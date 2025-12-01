// functions/src/index.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as logger from "firebase-functions/logger";

// V2 Import: Use this for the HTTPS Callable function (better performance)
import { HttpsError, onCall } from "firebase-functions/v2/https";

// V1 Import: Use this for the Auth Trigger (REQUIRED for auth.user().onDelete)
import * as functions from "firebase-functions";

import * as dotenv from "dotenv";
import * as admin from 'firebase-admin';

// Initialize Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

dotenv.config({ path: '.env.local' });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// --- v2 Function (AI Roast) ---
export const generateAiRoast = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }
  const { prompt } = request.data;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return { success: true, text };
  } catch (error) {
    logger.error("Gemini Error", error);
    throw new HttpsError("internal", "Failed to generate roast.");
  }
});

// --- v1 Function (Auth Cleanup) ---
// We use 'functions' (v1) here because 'auth' triggers are not available in v2 yet.
export const cleanupUserData = functions.auth.user().onDelete(async (user) => {
  const uid = user.uid; // TypeScript now knows 'user' is a UserRecord
  const db = admin.firestore();
  const userDocRef = db.collection('users').doc(uid);

  logger.log(`Starting data cleanup for deleted user: ${uid}`);

  try {
    // recursively delete the user doc and all subcollections
    await db.recursiveDelete(userDocRef);
    logger.log(`Successfully deleted all data for user ${uid}`);
  } catch (error) {
    logger.error(`Error cleaning up data for user ${uid}:`, error);
  }
});

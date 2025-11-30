// functions/src/index.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";

// 1. Initialize Gemini with the key from environment variables
// IMPORTANT: Set this using: firebase functions:secrets:set GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const generateAiRoast = onCall({ cors: true }, async (request) => {
  // 2. Check if user is authenticated (Optional but recommended)
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { prompt } = request.data;

  try {
    // 3. Call Gemini Securely
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return { success: true, text };
  } catch (error) {
    logger.error("Gemini Error", error);
    throw new HttpsError("internal", "Failed to generate roast.");
  }
});
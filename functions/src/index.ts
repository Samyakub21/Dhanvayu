// functions/src/index.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";

// Import dotenv to load .env.local (for local dev/Vercel)
// Make sure to install dotenv: npm install dotenv
import * as dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

// Use the API key from environment variables (Vercel injects them automatically in prod)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const result = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: "hello world test",
  });
  const values = result.embeddings?.[0]?.values ?? [];
  console.log("Gemini embedding dimensions:", values.length);
}

main();
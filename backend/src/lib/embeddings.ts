import { GoogleGenAI } from "@google/genai";

export async function getEmbedding(text: string): Promise<number[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const result = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: text.slice(0, 2000),
  });
  return result.embeddings?.[0]?.values ?? [];
}

export function chunkFile(filePath: string, content: string) {
  const lines = content.split("\n");
  const chunks = [];
  const CHUNK_SIZE = 50;

  for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
    const chunkLines = lines.slice(i, i + CHUNK_SIZE);
    chunks.push({
      file_path: filePath,
      content: chunkLines.join("\n"),
      chunk_index: Math.floor(i / CHUNK_SIZE),
    });
  }

  return chunks;
}
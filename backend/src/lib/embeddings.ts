import { response } from "express";

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nomic-embed-text",
      prompt: text.slice(0, 512),
    }),
  });

  

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  const data = await response.json() as { embedding: number[] };
  console.log("Embedding length:", data.embedding?.length);
  console.log("First value:", data.embedding?.[0]);
  return data.embedding;
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
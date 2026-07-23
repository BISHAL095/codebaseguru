export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text.slice(0, 512) }),
    }
  );

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.statusText}`);
  }

  const data = await response.json() as number[] | number[][];
  return Array.isArray(data[0]) ? data[0] as number[] : data as number[];
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
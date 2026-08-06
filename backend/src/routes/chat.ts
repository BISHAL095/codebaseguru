import { Router, Request, Response } from "express";
import Groq from "groq-sdk";
import { getEmbedding } from "../lib/embeddings";
import { searchChunks } from "../lib/vectorstore";

const router = Router();

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY! });
}

router.post("/", async (req: Request, res: Response) => {
  const { repo_id, question, responseStyle } = req.body;

  if (!repo_id || !question) {
    res.status(400).json({ error: "repo_id and question are required" });
    return;
  }

  try {
    // 1. Embed the question
    const queryEmbedding = await getEmbedding(question);

    // 2. Search for relevant chunks
    const chunks = await searchChunks(repo_id, queryEmbedding, 5);

    if (!chunks || chunks.length === 0) {
      res.json({ answer: "No relevant code found for your question.", citations: [] });
      return;
    }

    // 3. Build context from chunks
    const context = chunks
      .map((c: { file_path: string; content: string }) =>
        `// File: ${c.file_path}\n${c.content}`
      )
      .join("\n\n---\n\n");

    const citations = [...new Set(chunks.map((c: { file_path: string }) => c.file_path))];
    const styleInstruction = responseStyle === "bullets"
  ? "Format your response using bullet points or numbered lists. Be concise. Each point should be one clear sentence."
  : "Format your response as clear descriptive paragraphs. Be thorough but easy to understand.";


    // 4. Ask Groq
    const groq = getGroq();
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
  {
    role: "system",
    content: `You are CodebaseGuru — an expert at explaining codebases in plain English.
You are given relevant code chunks from a repository.
Answer the user's question based only on the provided code.
If the answer isn't in the provided code, say so honestly.
Do not make things up.
${styleInstruction}`,
        },
        {
          role: "user",
          content: `Here is the relevant code:\n\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });

    const answer = response.choices[0]?.message?.content || "No answer generated.";

    res.json({ answer, citations });
  } catch (err: unknown) {
    console.error("Chat route error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Something went wrong",
    });
  }
});

export default router;
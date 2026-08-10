import { Router, Request, Response } from "express";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import { getEmbedding, chunkFile } from "../lib/embeddings";
import { fetchFileContent } from "../lib/github";
import { getIP, incrementChatCount } from "../middleware/rateLimit";

const router = Router();

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY! });
}

// Score file paths and return the most relevant repo files for a question.
function findRelevantFiles(question: string, filePaths: string[]): string[] {
  const keywords = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const scored = filePaths.map((path) => {
    const lower = path.toLowerCase();
    const score = keywords.reduce((acc, keyword) => {
      return acc + (lower.includes(keyword) ? 1 : 0);
    }, 0);
    return { path, score };
  });

  // Always include index files and entry points
  const priority = ["index", "main", "app", "server", "config", "readme"];
  
  const results = scored
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((f) => f.path);

  // If no keyword matches, fall back to priority files
  if (results.length === 0) {
    return filePaths
      .filter((p) => priority.some((key) => p.toLowerCase().includes(key)))
      .slice(0, 5);
  }

  return results;
}

router.post("/", async (req: Request, res: Response) => {
  const supabase = getSupabase();
  const { repo_id, question, responseStyle } = req.body;

  if (!repo_id || !question) {
    res.status(400).json({ error: "repo_id and question are required" });
    return;
  }

  try {
    // Retrieve repository metadata needed for GitHub lookup.
    const { data: repo } = await supabase
      .from("repositories")
      .select("owner, name")
      .eq("id", repo_id)
      .single();

    if (!repo) {
      res.status(404).json({ error: "Repo not found" });
      return;
    }

    // 2. Get all file paths for this repo
    const { data: fileRows } = await supabase
      .from("file_chunks")
      .select("file_path")
      .eq("repo_id", repo_id);

    const allPaths = [...new Set((fileRows || []).map((r: { file_path: string }) => r.file_path))];

    // 3. Find relevant files based on question keywords
    const relevantPaths = findRelevantFiles(question, allPaths as string[]);
    console.log(`Relevant files for "${question}":`, relevantPaths);

    // 4. Fetch content of relevant files from GitHub
    const fileContents: { path: string; content: string }[] = [];
    for (const path of relevantPaths) {
      try {
        const content = await fetchFileContent(repo.owner, repo.name, path);
        if (content) fileContents.push({ path, content });
      } catch {
        console.warn(`Could not fetch ${path}`);
      }
    }

    if (fileContents.length === 0) {
      res.json({ answer: "Could not find relevant files for your question.", citations: [] });
      return;
    }

    // 5. Chunk + embed fetched files
    const allChunks: { file_path: string; content: string }[] = [];
    const allEmbeddings: number[][] = [];

    for (const file of fileContents) {
      const chunks = chunkFile(file.path, file.content).slice(0, 3);
      for (const chunk of chunks) {
        if (!chunk.content.trim()) continue;
        try {
          const embedding = await getEmbedding(chunk.content);
          if (embedding.length > 0) {
            allChunks.push({ file_path: chunk.file_path, content: chunk.content });
            allEmbeddings.push(embedding);
          }
        } catch {
          console.warn(`Failed to embed chunk from ${file.path}`);
        }
      }
    }

    // 6. Embed the question and find most similar chunks
    const questionEmbedding = await getEmbedding(question);
    
    function cosineSimilarity(a: number[], b: number[]): number {
      const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return dot / (magA * magB);
    }

    const scored = allChunks.map((chunk, i) => ({
      ...chunk,
      similarity: cosineSimilarity(questionEmbedding, allEmbeddings[i]),
    }));

    const topChunks = scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    // 7. Build context and ask Groq
    const context = topChunks
      .map((c) => `// File: ${c.file_path}\n${c.content}`)
      .join("\n\n---\n\n");

    const citations = [...new Set(topChunks.map((c) => c.file_path))];

    const styleInstruction = responseStyle === "bullets"
      ? "Format your response using bullet points or numbered lists. Be concise."
      : "Format your response as clear descriptive paragraphs.";

    const groq = getGroq();
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are CodebaseGuru — an expert at explaining codebases in plain English.
Answer the user's question based only on the provided code.
If the answer isn't in the provided code, say so honestly.
${styleInstruction}`,
        },
        {
          role: "user",
          content: `Here is the relevant code:\n\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });

    const answer = response.choices[0]?.message?.content || "No answer generated.";

    // Only count towards limit on success
    incrementChatCount(getIP(req));

    res.json({ answer, citations });

  } catch (err: unknown) {
    console.error("Chat route error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Something went wrong",
    });
  }
});

export default router;
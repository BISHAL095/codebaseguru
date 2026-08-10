import { Router, Request, Response } from "express";
import { parseGithubUrl, fetchRepoFiles, fetchReadme } from "../lib/github";
import { createClient } from "@supabase/supabase-js";
import { getIP, incrementRepoCount } from "../middleware/rateLimit";
import Groq from "groq-sdk";

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

router.post("/", async (req: Request, res: Response) => {
  const supabase = getSupabase();
  const { github_url } = req.body;

  if (!github_url) {
    res.status(400).json({ error: "github_url is required" });
    return;
  }

  try {
    // Parse the GitHub repository URL from the incoming request.
    const { owner, repo } = parseGithubUrl(github_url);

    // Fetch the repository file tree so we can record available file paths.
    console.log(`Fetching file tree for ${owner}/${repo}...`);
    const files = await fetchRepoFiles(owner, repo);
    const filePaths = files.map((f) => f.path);
    console.log(`Found ${filePaths.length} files`);

    // Attempt to retrieve the repository README for a short summary.
    console.log(`Fetching README...`);
    const readme = await fetchReadme(owner, repo);

    // Generate a concise summary from the README using Groq.
    console.log(`Generating summary...`);
    let summary = "No README found for this repository.";

    if (readme) {
      const groq = getGroq();
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content: "You are a technical assistant. Summarize the following README in 3-4 sentences in plain English. Focus on what the project does, what problem it solves, and what tech it uses. Be concise.",
          },
          {
            role: "user",
            content: readme.slice(0, 3000),
          },
        ],
      });
      summary = response.choices[0]?.message?.content || summary;
    }

    // Persist the repository record before saving file metadata.
    const { data: repoRecord, error: repoError } = await supabase
      .from("repositories")
      .insert({
        github_url,
        owner,
        name: repo,
        status: "ready",
        file_count: filePaths.length,
        user_id: null,
      })
      .select()
      .single();

    if (repoError) throw new Error(repoError.message);

    // 6. Save file paths (no embeddings yet)
    const fileRows = filePaths.map((path) => ({
      repo_id: repoRecord.id,
      file_path: path,
      content: "",
      chunk_index: 0,
      embedding: null,
    }));

    // Insert in batches
    for (let i = 0; i < fileRows.length; i += 50) {
      await supabase
        .from("file_chunks")
        .insert(fileRows.slice(i, i + 50));
    }

    console.log(`✅ Done — repo ready in seconds`);

    // Only count towards limit on success
    incrementRepoCount(getIP(req));

    res.json({
      repo_id: repoRecord.id,
      file_count: filePaths.length,
      summary,
    });

  } catch (err: unknown) {
    console.error("Explain route error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Something went wrong",
    });
  }
});

export default router;
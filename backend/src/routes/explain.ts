import { Router, Request, Response } from "express";
import { parseGithubUrl, fetchRepoFiles } from "../lib/github";
import { chunkFile, getEmbedding } from "../lib/embeddings";
import { saveChunks } from "../lib/vectorstore";
import { createClient } from "@supabase/supabase-js";

const router = Router();

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

router.post("/", async (req: Request, res: Response) => {
  const supabase = getSupabase();
  const { github_url } = req.body;

  if (!github_url) {
    res.status(400).json({ error: "github_url is required" });
    return;
  }

  try {
    // 1. Parse the GitHub URL
    const { owner, repo } = parseGithubUrl(github_url);

    // 2. Create a repo record in Supabase
    const { data: repoRecord, error: repoError } = await supabase
      .from("repositories")
      .insert({
        github_url,
        owner,
        name: repo,
        status: "processing",
        file_count: 0,
        user_id: null, // will add auth later
      })
      .select()
      .single();

    if (repoError) throw new Error(repoError.message);

    const repoId = repoRecord.id;

    // 3. Fetch all code files from GitHub
    console.log(`Fetching files for ${owner}/${repo}...`);
    const files = await fetchRepoFiles(owner, repo);
    console.log(`Found ${files.length} files`);

    // 4. Chunk + embed each file
    const allChunks: { file_path: string; content: string; chunk_index: number }[] = [];
    const allEmbeddings: number[][] = [];

    for (const file of files) {
      const chunks = chunkFile(file.path, file.content);

      for (const chunk of chunks) {
        if (!chunk.content || chunk.content.trim().length === 0) continue;
        try {
          const embedding = await getEmbedding(chunk.content);
          if (embedding.length === 0) continue;
          allChunks.push(chunk);
          allEmbeddings.push(embedding);
        } catch (err) {
          console.error(`Failed to embed chunk from ${file.path}:`, err);
        }
      }
    }

    console.log(`Generated ${allChunks.length} chunks`);

    // 5. Save all chunks + embeddings to Supabase in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      await saveChunks(
        repoId,
        allChunks.slice(i, i + BATCH_SIZE),
        allEmbeddings.slice(i, i + BATCH_SIZE)
      );
    }
    console.log(`✅ Successfully inserted chunks into Supabase`);
    
    // 6. Update repo status to ready
    await supabase
      .from("repositories")
      .update({ status: "ready", file_count: files.length })
      .eq("id", repoId);

    res.json({ repo_id: repoId, file_count: files.length });

  } catch (err: unknown) {
    console.error("Explain route error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Something went wrong",
    });
  }
});

export default router;
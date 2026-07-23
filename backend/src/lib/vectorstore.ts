import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function saveChunks(
  repoId: string,
  chunks: { file_path: string; content: string; chunk_index: number }[],
  embeddings: number[][]
) {
  const supabase = getSupabase();
  const rows = chunks.map((chunk, i) => ({
    repo_id: repoId,
    file_path: chunk.file_path,
    content: chunk.content,
    chunk_index: chunk.chunk_index,
    embedding: `[${embeddings[i].join(",")}]`,
  }));

  const { error } = await supabase.from("file_chunks").insert(rows);
  if (error) throw new Error(`Failed to save chunks: ${error.message}`);
}

export async function searchChunks(
  repoId: string,
  queryEmbedding: number[],
  matchCount = 5
) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: `[${queryEmbedding.join(",")}]`,
    match_repo_id: repoId,
    match_count: matchCount,
  });

  if (error) throw new Error(`Vector search failed: ${error.message}`);
  return data;
}
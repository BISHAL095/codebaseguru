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

  // filter out empty embeddings first
  const valid = chunks
    .map((chunk, i) => ({ chunk, embedding: embeddings[i] }))
    .filter(({ embedding }) => embedding && embedding.length === 768);

  console.log(`Inserting ${valid.length} valid chunks...`);

  const { error } = await supabase.rpc("insert_chunks_batch", {
    p_repo_id: repoId,
    p_file_paths: valid.map((v) => v.chunk.file_path),
    p_contents: valid.map((v) => v.chunk.content),
    p_chunk_indexes: valid.map((v) => v.chunk.chunk_index),
    p_embeddings: valid.map((v) => `[${v.embedding.join(",")}]`),
  });

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
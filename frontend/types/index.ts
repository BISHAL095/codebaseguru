export interface RepoFile {
  path: string;
  content: string;
  language: string;
  size: number;
}

export interface FileChunk {
  id?: string;
  repo_id: string;
  file_path: string;
  content: string;
  embedding?: number[];
  chunk_index: number;
}

export interface Repository {
  id?: string;
  user_id: string;
  github_url: string;
  owner: string;
  name: string;
  description?: string;
  status: "pending" | "processing" | "ready" | "error";
  file_count: number;
  created_at?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
}

export interface ExplainResponse {
  answer: string;
  citations: string[];
}

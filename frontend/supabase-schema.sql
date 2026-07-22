-- Enable pgvector extension
create extension if not exists vector;

-- Repositories table
create table repositories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  github_url text not null,
  owner text not null,
  name text not null,
  description text,
  status text default 'pending' check (status in ('pending', 'processing', 'ready', 'error')),
  file_count integer default 0,
  created_at timestamp with time zone default now()
);

-- File chunks table with vector embeddings
create table file_chunks (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid references repositories(id) on delete cascade,
  file_path text not null,
  content text not null,
  chunk_index integer not null,
  embedding vector(1536), -- OpenAI/Claude embedding size
  created_at timestamp with time zone default now()
);

-- Create vector similarity search index
create index on file_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Chat history table
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid references repositories(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  citations text[] default '{}',
  created_at timestamp with time zone default now()
);

-- Row level security
alter table repositories enable row level security;
alter table file_chunks enable row level security;
alter table chat_messages enable row level security;

-- Policies: users can only access their own data
create policy "Users can manage their own repos"
  on repositories for all using (auth.uid() = user_id);

create policy "Users can read chunks of their repos"
  on file_chunks for all using (
    repo_id in (select id from repositories where user_id = auth.uid())
  );

create policy "Users can manage their own chat messages"
  on chat_messages for all using (auth.uid() = user_id);

-- Function for vector similarity search
create or replace function match_chunks(
  query_embedding vector(1536),
  match_repo_id uuid,
  match_count int default 5
)
returns table (
  id uuid,
  file_path text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    file_path,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from file_chunks
  where repo_id = match_repo_id
  order by embedding <=> query_embedding
  limit match_count;
$$;

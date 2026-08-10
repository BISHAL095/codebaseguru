# CodebaseGuru Backend

The backend provides the API layer for CodebaseGuru. It is responsible for:

- Parsing GitHub repository URLs
- Fetching repository file metadata and README content
- Saving repository and file metadata to Supabase
- Creating embeddings via Gemini
- Serving chat completions through Groq LLaMA

## Recommended Deployment

Deploy this service to Render or another Node.js hosting provider.

### Required environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GITHUB_TOKEN`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `FRONTEND_URL` — optional, for CORS allowlist

## API Routes

- `POST /api/explain` — submit a GitHub repo URL for indexing and summary generation
- `POST /api/chat` — ask a question about an indexed repository

## Local Development

```bash
cd backend
npm install
npm run dev
```

The backend listens on `process.env.PORT || 8000`.

## Deployment Notes

- `backend/package.json` includes `build` and `start` scripts.
- Ensure the `GEMINI_API_KEY` has sufficient quota for embeddings.
- Use `GITHUB_TOKEN` to avoid GitHub API rate limits during repo ingestion.
- Keep the `SUPABASE_SERVICE_ROLE_KEY` secure; it is used for database writes.

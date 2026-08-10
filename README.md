# CodebaseGuru

CodebaseGuru is a repository analysis platform that allows users to submit a GitHub repo, index its code, and ask natural-language questions about the codebase.

## Architecture

This repository is organized as a monorepo with two main parts:

- `frontend/` — Next.js application intended for Vercel deployment
- `backend/` — Express API service intended for Render deployment

The frontend handles user interactions and dashboard UI, while the backend handles GitHub repo ingestion, Supabase storage, embeddings, and LLM-driven code explanations.

## Deployment Strategy

Recommended deployment setup:

- Deploy `frontend/` to **Vercel**
- Deploy `backend/` to **Render** or another Node service host

### Frontend

The frontend reads its API base URL from:

- `NEXT_PUBLIC_BACKEND_URL`

### Backend

The backend requires access to:

- GitHub API
- Gemini embeddings
- Groq chat
- Supabase database

## Environment Variables

### Frontend (`frontend/`)

- `NEXT_PUBLIC_BACKEND_URL` — endpoint for the deployed backend service

### Backend (`backend/`)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GITHUB_TOKEN`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `FRONTEND_URL` — origin allowed by CORS

## Repository Structure

```text
frontend/          # Next.js app and UI layer
backend/           # Express app for repo ingestion and chat
```

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## Notes

- This repo currently uses Gemini for embeddings in the backend.
- The frontend does not directly call Gemini; it uses the backend API.
- If deploying across Vercel and Render, ensure the backend URL is configured in Vercel.

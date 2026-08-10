import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import explainRouter from "./routes/explain";
import chatRouter from "./routes/chat";
import { repoRateLimit, chatRateLimit } from "./middleware/rateLimit";

dotenv.config(); // Load environment variables from .env in development.

const app = express();
const PORT = process.env.PORT || 8000;

// Restrict CORS origin to the frontend host in production.
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json()); // Parse incoming JSON requests.

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "CodebaseGuru backend running" });
});

app.use("/api/explain", repoRateLimit, explainRouter);
app.use("/api/chat", chatRateLimit, chatRouter);

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});

export default app;
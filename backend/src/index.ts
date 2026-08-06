import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import explainRouter from "./routes/explain";
import chatRouter from "./routes/chat";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "CodebaseGuru backend running" });
});

app.use("/api/explain", explainRouter);
app.use("/api/chat", chatRouter);
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});



export default app;
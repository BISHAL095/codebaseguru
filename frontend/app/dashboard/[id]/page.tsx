"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { createClient } from "@/lib/supabase/client";
import SageLoader from "@/app/components/SageLoader";

interface Repository {
  id: string;
  owner: string;
  name: string;
  github_url: string;
  file_count: number;
  status: string;
}

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [status, setStatus] = useState<"processing" | "ready" | "error">("processing");
  const [repo, setRepo] = useState<Repository | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<string[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("repositories")
        .select("*")
        .eq("id", id)
        .single();

      if (data?.status === "ready") {
        setRepo(data);
        setStatus("ready");
        clearInterval(interval);

        const { data: chunks } = await supabase
          .from("file_chunks")
          .select("file_path")
          .eq("repo_id", id);

        if (chunks) {
          const unique = [...new Set(chunks.map((c: { file_path: string }) => c.file_path))];
          setFiles((unique as string[]).sort());
        }
      } else if (data?.status === "error") {
        setStatus("error");
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setChatLoading(true);
    setAnswer("");
    setCitations([]);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_id: id, question }),
      });
      const data = await res.json();
      setAnswer(data.answer);
      setCitations(data.citations || []);
    } catch {
      setAnswer("Something went wrong. Please try again.");
    } finally {
      setChatLoading(false);
    }
  }

  if (status === "processing") return <SageLoader />;

  if (status === "error") return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">
      Something went wrong processing this repo.
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white grid grid-cols-[280px_1fr]">

      {/* Sidebar — file tree */}
      <aside className="bg-slate-950 border-r border-slate-800 p-4 overflow-y-auto">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">Files indexed</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{files.length}</span>
          </div>
          <a
            href={repo?.github_url}
            target="_blank"
            rel="noreferrer"
            className="text-slate-500 text-xs hover:text-slate-300 transition-colors"
          >
            {repo?.owner}/{repo?.name} ↗
          </a>
        </div>

        <ul className="space-y-0.5">
          {files.map((file) => (
            <li
              key={file}
              className="text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 px-2 py-1 rounded font-mono truncate cursor-default transition-colors"
              title={file}
            >
              {file}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main — chat area */}
      <main className="flex flex-col p-6 gap-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-lg font-semibold text-white">{repo?.owner}/{repo?.name}</h1>
            <p className="text-slate-500 text-sm">{repo?.file_count} files indexed · ready to answer questions</p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Ready</span>
          </div>
        </div>

        {/* Answer area */}
        <div className="flex-1 bg-slate-900 rounded-xl p-5 overflow-y-auto min-h-[300px] flex flex-col">
          {!answer && !chatLoading && (
            <div className="m-auto text-center">
              <p className="text-slate-500 text-sm mb-2">Ask anything about this codebase</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "How does auth work?",
                  "What does index.ts do?",
                  "Explain the folder structure",
                  "What APIs are exposed?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuestion(q)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 py-1.5 rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Thinking...
            </div>
          )}

          {answer && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-800 rounded-lg p-4 text-slate-300 text-sm leading-relaxed border-l-2 border-blue-500">
                {answer}
              </div>

              {citations.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Sources</p>
                  <div className="flex flex-col gap-1">
                    {citations.map((cite, i) => (
                      <span key={i} className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-1 rounded">
                        📎 {cite}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleAsk} className="flex gap-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask something about this codebase..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            disabled={chatLoading}
          />
          <button
            type="submit"
            disabled={chatLoading || !question.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium px-5 py-3 rounded-lg transition-colors text-sm"
          >
            {chatLoading ? "..." : "Ask →"}
          </button>
        </form>
      </main>
    </div>
  );
}
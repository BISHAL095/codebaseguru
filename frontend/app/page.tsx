"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SageLoader from "../components/SageLoader";
import { useRepoStatus } from "./hooks/useRepoStatus";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [repoId, setRepoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useRepoStatus(
    repoId,
    (id) => router.push(`/dashboard/${id}`),
    () => { setLoading(false); setRepoId(null); setError("Failed to process repo."); }
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github_url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setRepoId(data.repo_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      {loading && <SageLoader />}

      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-green-400 text-sm mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          AI-Powered Codebase Understanding
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          CodebaseGuru
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Paste a GitHub URL and get a plain English breakdown of any codebase — architecture, key files, and how it all connects.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
          >
            {loading ? "Analyzing..." : "Explain →"}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </form>

      <div className="mt-8 text-center">
        <p className="text-gray-600 text-sm mb-3">Try an example:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {["facebook/react", "vercel/next.js", "supabase/supabase"].map((example) => (
            <button
              key={example}
              onClick={() => setUrl(`https://github.com/${example}`)}
              className="text-xs bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white px-3 py-1.5 rounded-full transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl w-full text-center">
        {[
          { icon: "🗂", title: "Architecture Overview", desc: "Understand how the entire project is structured at a glance" },
          { icon: "💬", title: "Ask Anything", desc: "Chat with the codebase — ask how auth works, what a file does, and more" },
          { icon: "📎", title: "Cited Answers", desc: "Every answer links back to the exact file and line it came from" },
        ].map((feature) => (
          <div key={feature.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-2xl mb-2">{feature.icon}</div>
            <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
            <p className="text-gray-500 text-sm">{feature.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
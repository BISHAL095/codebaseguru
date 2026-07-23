const IGNORE_PATTERNS = [
  "node_modules", ".git", "dist", "build", ".next",
  "coverage", ".cache", "vendor", "__pycache__", ".venv",
];

const IGNORE_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
  ".pdf", ".zip", ".tar", ".gz", ".mp4", ".mp3",
  ".lock", ".sum", ".mod", ".min.js", ".min.css",
];

const CODE_EXTENSIONS = [
  ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java",
  ".rb", ".php", ".cs", ".cpp", ".c", ".h", ".swift", ".kt",
  ".md", ".json", ".yaml", ".yml", ".toml", ".sql", ".prisma",
  ".graphql", ".html", ".css", ".scss",
];

const MAX_FILE_SIZE = 50000;

function shouldIgnore(path: string): boolean {
  return path.split("/").some((part) =>
    IGNORE_PATTERNS.some((pattern) => part === pattern)
  );
}

function isCodeFile(path: string): boolean {
  const lower = path.toLowerCase();
  if (IGNORE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return false;
  return CODE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    py: "python", go: "go", rs: "rust", java: "java", rb: "ruby",
    php: "php", cs: "csharp", cpp: "cpp", c: "c", swift: "swift",
    kt: "kotlin", md: "markdown", json: "json", yaml: "yaml",
    yml: "yaml", sql: "sql", prisma: "prisma", graphql: "graphql",
    html: "html", css: "css", scss: "scss",
  };
  return map[ext] || "plaintext";
}

export function parseGithubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Invalid GitHub URL");
  return { owner: match[1], repo: match[2].replace(".git", "") };
}

export interface RepoFile {
  path: string;
  content: string;
  language: string;
  size: number;
}

export async function fetchRepoFiles(
  owner: string,
  repo: string
): Promise<RepoFile[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };

  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers }
  );

  if (!treeRes.ok) throw new Error(`GitHub API error: ${treeRes.statusText}`);

  const tree = await treeRes.json() as {
    tree: { type: string; path: string; size: number }[]
  };

  const codeFiles = tree.tree.filter(
    (item) =>
      item.type === "blob" &&
      !shouldIgnore(item.path) &&
      isCodeFile(item.path) &&
      item.size < MAX_FILE_SIZE
  );

  const results: RepoFile[] = [];
  const batchSize = 20;

  for (let i = 0; i < codeFiles.length; i += batchSize) {
    const batch = codeFiles.slice(i, i + batchSize);
    const contents = await Promise.allSettled(
      batch.map(async (file) => {
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`,
          { headers }
        );
        if (!res.ok) return null;
        const data = await res.json() as { content: string };
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        return {
          path: file.path,
          content,
          language: detectLanguage(file.path),
          size: file.size,
        };
      })
    );

    contents.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        results.push(result.value);
      }
    });
  }

  return results;
}
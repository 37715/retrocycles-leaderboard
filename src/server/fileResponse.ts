import { promises as fs } from "node:fs";
import path from "node:path";

const MIME_TYPES: Record<string, string> = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webm": "video/webm",
  ".gif": "image/gif"
};

const GITHUB_FALLBACK_BASE = "https://raw.githubusercontent.com/37715/retrocycles-leaderboard/main";

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

async function fetchGithubFallback(rootRelativePath: string): Promise<Response | null> {
  try {
    const safePath = rootRelativePath.replace(/\\/g, "/").replace(/^\/+/, "");
    const url = `${GITHUB_FALLBACK_BASE}/${safePath}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": getContentType(safePath),
        "Cache-Control": "public, max-age=86400"
      }
    });
  } catch {
    return null;
  }
}

export async function serveRepoFile(rootRelativePath: string): Promise<Response> {
  const absolutePath = path.join(process.cwd(), rootRelativePath);
  try {
    const data = await fs.readFile(absolutePath);
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": getContentType(absolutePath)
      }
    });
  } catch {
    const fallback = await fetchGithubFallback(rootRelativePath);
    if (fallback) return fallback;
    return new Response("Not Found", { status: 404 });
  }
}

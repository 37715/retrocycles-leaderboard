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

export async function serveRepoFile(rootRelativePath: string): Promise<Response> {
  const absolutePath = path.join(process.cwd(), rootRelativePath);
  try {
    const data = await fs.readFile(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": contentType
      }
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}

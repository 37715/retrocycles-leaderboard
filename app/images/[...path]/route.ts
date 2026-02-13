import { serveRepoFile } from "@/src/server/fileResponse";

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return serveRepoFile(`images/${path.join("/")}`);
}

import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import type { Briefing } from "./generate";

// Temporary source until Supabase (Phase 1/3): the newest out/briefing-YYYY-MM-DD.json.
// Cached: the briefing changes once a day. The cron job will call revalidateTag("briefing")
// right after generating, so new briefings show up immediately.
export async function loadLatestBriefing(): Promise<Briefing | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("briefing");

  const dir = path.join(process.cwd(), "out");
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return null;
  }
  const latest = files
    .filter((f) => /^briefing-\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .at(-1);
  if (!latest) return null;
  return JSON.parse(await readFile(path.join(dir, latest), "utf8")) as Briefing;
}

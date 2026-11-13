import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Briefing } from "./generate";
import { getLatestBriefing } from "./store";

// Cached: the briefing changes once a day. /api/generate calls revalidateTag("briefing")
// right after saving a new one, so it shows up immediately.
export async function loadLatestBriefing(): Promise<Briefing | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("briefing");

  return getLatestBriefing();
}

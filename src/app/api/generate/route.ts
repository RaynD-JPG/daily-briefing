import { revalidateTag } from "next/cache";
import { fetchCandidates } from "@/lib/news/fetch";
import { generateBriefing } from "@/lib/news/generate";
import { saveBriefing } from "@/lib/news/store";

// RSS fetch + Gemini call can take a while; 60s is the Vercel Hobby-safe limit.
export const maxDuration = 60;

// Called by Vercel Cron every morning (see vercel.json). Vercel automatically sends
// "Authorization: Bearer <CRON_SECRET>" when the CRON_SECRET env var is set.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  try {
    const { candidates, report } = await fetchCandidates();
    const date = new Date().toISOString().slice(0, 10);
    const briefing = await generateBriefing(candidates, date);
    await saveBriefing(briefing);
    revalidateTag("briefing", "max");

    return Response.json({
      ok: true,
      date,
      stories: briefing.stories.length,
      candidates: candidates.length,
      failedFeeds: report.filter((r) => r.error).map((r) => r.feed),
      ms: Date.now() - started,
    });
  } catch (err) {
    // Yesterday's briefing stays visible; the error shows up in Vercel's function logs.
    console.error("Briefing generation failed:", err);
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

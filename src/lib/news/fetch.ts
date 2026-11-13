import Parser from "rss-parser";
import { FEEDS, type Feed, type Section } from "./feeds";

export type Candidate = {
  id: string; // short id Gemini cites instead of URLs (so it can't invent links)
  outlet: string;
  hint: Section;
  title: string;
  description: string;
  url: string;
  publishedAt: string | null;
};

const MAX_AGE_HOURS = 36;
const MAX_PER_FEED = 15;
const MAX_DESCRIPTION = 300;

const parser = new Parser({
  timeout: 15_000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; DailyBriefing/0.1)" },
});

function clean(text: string | undefined): string {
  return (text ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_DESCRIPTION);
}

async function fetchFeed(feed: Feed): Promise<Omit<Candidate, "id">[]> {
  const parsed = await parser.parseURL(feed.url);
  const cutoff = Date.now() - MAX_AGE_HOURS * 3600_000;

  return parsed.items
    .filter((item) => item.title && item.link)
    .filter((item) => {
      // Keep undated items; drop anything clearly older than the cutoff.
      const t = item.isoDate ? Date.parse(item.isoDate) : NaN;
      return Number.isNaN(t) || t >= cutoff;
    })
    .slice(0, MAX_PER_FEED)
    .map((item) => ({
      outlet: feed.name,
      hint: feed.hint,
      title: clean(item.title),
      description: clean(item.contentSnippet ?? item.content ?? item.summary),
      url: item.link!,
      publishedAt: item.isoDate ?? null,
    }));
}

export type FetchReport = { feed: string; count: number; error?: string };

export async function fetchCandidates(): Promise<{
  candidates: Candidate[];
  report: FetchReport[];
}> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));

  const report: FetchReport[] = [];
  const seen = new Set<string>();
  const candidates: Candidate[] = [];

  results.forEach((result, i) => {
    const feed = FEEDS[i];
    if (result.status === "rejected") {
      report.push({ feed: feed.name, count: 0, error: String(result.reason?.message ?? result.reason) });
      return;
    }
    let count = 0;
    for (const item of result.value) {
      const key = item.title.toLowerCase();
      if (seen.has(key) || seen.has(item.url)) continue;
      seen.add(key);
      seen.add(item.url);
      candidates.push({ id: `c${candidates.length + 1}`, ...item });
      count++;
    }
    report.push({ feed: feed.name, count });
  });

  return { candidates, report };
}

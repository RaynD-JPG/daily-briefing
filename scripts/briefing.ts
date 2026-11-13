// Phase 2 test harness: fetch RSS -> Gemini -> print the briefing.
// Usage: npm run briefing            (full run)
//        npm run briefing -- --feeds (only test the RSS feeds, no Gemini call)
//        npm run briefing -- --save  (also save it to Supabase)
import { writeFileSync, mkdirSync } from "node:fs";
import { fetchCandidates } from "../src/lib/news/fetch";
import { generateBriefing, type Briefing } from "../src/lib/news/generate";
import { saveBriefing } from "../src/lib/news/store";

const LABELS: Record<string, string> = {
  world: "🌍 World",
  hungary: "🇭🇺 Hungary",
  economy: "📈 Economy & Markets",
  tech: "💻 Tech & AI",
  positive: "☀️ Good News",
};

function print(b: Briefing) {
  console.log(`\n=== Daily Briefing — ${b.date} (${b.model}) ===`);
  for (const section of Object.keys(LABELS)) {
    const stories = b.stories.filter((s) => s.section === section);
    if (!stories.length) continue;
    console.log(`\n${LABELS[section]}`);
    for (const s of stories) {
      console.log(`\n  ${s.title}`);
      console.log(`  ${s.summary}`);
      console.log(`  Why it matters: ${s.whyItMatters}`);
      if (s.perspectives) console.log(`  Perspectives: ${s.perspectives}`);
      for (const src of s.sources) console.log(`  → ${src.name}: ${src.url}`);
    }
  }
  console.log(`\n🤔 ${b.closingQuestion}\n`);
}

async function main() {
  const { candidates, report } = await fetchCandidates();
  console.log("Feeds:");
  for (const r of report) console.log(`  ${r.error ? "✗" : "✓"} ${r.feed.padEnd(20)} ${r.count}${r.error ? `  (${r.error})` : ""}`);
  console.log(`Total candidates: ${candidates.length}`);

  if (process.argv.includes("--feeds")) return;

  const date = new Date().toISOString().slice(0, 10);
  const briefing = await generateBriefing(candidates, date);
  print(briefing);

  mkdirSync("out", { recursive: true });
  writeFileSync(`out/briefing-${date}.json`, JSON.stringify(briefing, null, 2));
  console.log(`Saved out/briefing-${date}.json`);

  if (process.argv.includes("--save")) {
    await saveBriefing(briefing);
    console.log("Saved to Supabase");
  }
}

// Exit explicitly: open keep-alive sockets from the feed fetches otherwise keep Node running.
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

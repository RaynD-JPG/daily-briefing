import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { SECTION_COUNTS, type Section } from "./feeds";
import type { Candidate } from "./fetch";

const SECTIONS = ["world", "hungary", "jordan", "economy", "tech", "positive"] as const;

// What Gemini must return. It cites candidate ids, never raw URLs.
const GeminiOutput = z.object({
  stories: z.array(
    z.object({
      section: z.enum(SECTIONS),
      title: z.string(),
      summary: z.string().describe("2-3 calm, factual sentences on what happened."),
      whyItMatters: z.string().describe("1-2 sentences on why it matters."),
      sourceIds: z.array(z.string()).min(1).describe("Candidate ids used, most authoritative first."),
      perspectives: z
        .string()
        .nullable()
        .describe("Only if the story is contested: how outlets with different outlooks report it. Otherwise null."),
    }),
  ),
  closingQuestion: z.string().describe("One question worth thinking about, tied to today's news."),
});

export type Story = {
  section: Section;
  position: number;
  title: string;
  summary: string;
  whyItMatters: string;
  sources: { name: string; url: string }[];
  perspectives: string | null;
};

export type Briefing = {
  date: string; // YYYY-MM-DD
  model: string;
  generatedAt: string;
  closingQuestion: string;
  stories: Story[];
};

const SYSTEM_PROMPT = `You write a five-minute daily news briefing.
Rules:
- Pick the most important stories from the candidate headlines provided. Use ONLY these candidates; never add facts that aren't supported by them.
- Sections and exact counts: ${Object.entries(SECTION_COUNTS)
  .map(([s, n]) => `${s}: ${n}`)
  .join(", ")}.
  world = most important global stories; hungary = top story from Hungary; jordan = top story from Jordan;
  economy = economy or markets;
  tech = technology or AI; positive = one genuinely positive story.
- A candidate's "hint" is only a suggestion; put a story in whichever section fits best.
- Every story must be about a different topic: never cover the same event, company or person in two sections (e.g. not one world story AND one economy story on the same scandal) — pick a different story instead.
- For each story: a clear neutral title, a 2-3 sentence summary of what happened, and 1-2 sentences on why it matters.
- Cite sources by candidate id in sourceIds. When several outlets cover the same story, cite them all (up to 3).
- If a story is contested, use "perspectives" to say briefly how outlets with different outlooks report it; otherwise null.
- Hungarian-language candidates must be summarized in English.
- Tone: calm and factual, no sensationalism.
- End with one closing question worth thinking about.`;

export async function generateBriefing(candidates: Candidate[], date: string): Promise<Briefing> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set (get a free key at https://aistudio.google.com/apikey)");
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  // v1 rejects systemInstruction ("Developer instruction is not enabled for api version v1").
  const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
  const byId = new Map(candidates.map((c) => [c.id, c]));

  const input = candidates.map(({ id, outlet, hint, title, description }) => ({ id, outlet, hint, title, description }));

  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: `Today is ${date}. Candidate headlines (JSON):\n${JSON.stringify(input)}`,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseJsonSchema: z.toJSONSchema(GeminiOutput),
          temperature: 0.3,
        },
      });

      const output = GeminiOutput.parse(JSON.parse(res.text ?? ""));
      const stories = toStories(output, byId);
      checkCounts(stories);

      return {
        date,
        model,
        generatedAt: new Date().toISOString(),
        closingQuestion: output.closingQuestion,
        stories,
      };
    } catch (err) {
      lastError = err;
      console.warn(`Gemini attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
    }
  }
  throw lastError;
}

function toStories(output: z.infer<typeof GeminiOutput>, byId: Map<string, Candidate>): Story[] {
  const positions: Partial<Record<Section, number>> = {};
  return output.stories.map((s) => {
    // Map ids back to real links; silently drop any id Gemini made up.
    const sources = s.sourceIds
      .map((id) => byId.get(id))
      .filter((c): c is Candidate => !!c)
      .map((c) => ({ name: c.outlet, url: c.url }));
    if (sources.length === 0) throw new Error(`Story "${s.title}" has no valid source ids`);

    positions[s.section] = (positions[s.section] ?? 0) + 1;
    return {
      section: s.section,
      position: positions[s.section]!,
      title: s.title,
      summary: s.summary,
      whyItMatters: s.whyItMatters,
      sources,
      perspectives: s.perspectives,
    };
  });
}

function checkCounts(stories: Story[]) {
  for (const [section, expected] of Object.entries(SECTION_COUNTS)) {
    const got = stories.filter((s) => s.section === section).length;
    if (got !== expected) throw new Error(`Expected ${expected} ${section} stories, got ${got}`);
  }
}

import { createAdminClient } from "../supabase/admin";
import type { Section } from "./feeds";
import type { Briefing } from "./generate";

// Save (or replace) the briefing for briefing.date.
export async function saveBriefing(briefing: Briefing): Promise<void> {
  const db = createAdminClient();

  const { data: row, error } = await db
    .from("briefings")
    .upsert(
      {
        date: briefing.date,
        closing_question: briefing.closingQuestion,
        model: briefing.model,
        generated_at: briefing.generatedAt,
      },
      { onConflict: "date" },
    )
    .select("id")
    .single();
  if (error) throw new Error(`Saving briefing failed: ${error.message}`);

  // Re-running for the same day replaces that day's stories.
  const del = await db.from("stories").delete().eq("briefing_id", row.id);
  if (del.error) throw new Error(`Clearing old stories failed: ${del.error.message}`);

  const ins = await db.from("stories").insert(
    briefing.stories.map((s) => ({
      briefing_id: row.id,
      section: s.section,
      position: s.position,
      title: s.title,
      summary: s.summary,
      why_it_matters: s.whyItMatters,
      sources: s.sources,
      perspectives: s.perspectives,
    })),
  );
  if (ins.error) throw new Error(`Saving stories failed: ${ins.error.message}`);
}

type StoryRow = {
  section: Section;
  position: number;
  title: string;
  summary: string;
  why_it_matters: string;
  sources: { name: string; url: string }[];
  perspectives: string | null;
};

export async function getLatestBriefing(): Promise<Briefing | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("briefings")
    .select("date, closing_question, model, generated_at, stories(section, position, title, summary, why_it_matters, sources, perspectives)")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Loading briefing failed: ${error.message}`);
  if (!data) return null;

  return {
    date: data.date,
    closingQuestion: data.closing_question,
    model: data.model,
    generatedAt: data.generated_at,
    stories: (data.stories as StoryRow[]).map((s) => ({
      section: s.section,
      position: s.position,
      title: s.title,
      summary: s.summary,
      whyItMatters: s.why_it_matters,
      sources: s.sources,
      perspectives: s.perspectives,
    })),
  };
}

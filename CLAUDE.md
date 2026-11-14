# CLAUDE.md

Guidance for Claude Code (and future me) when working in this repository.

## What this is

A personal **daily news briefing app**, shipped as a **web app (PWA)** — not a native iOS app — so it runs in Safari on iPhone and can be added to the home screen.

It turns this "re-usable prompt" (from a Financial Management lecture slide) into an app:

> Give me a five-minute briefing on today's current events. Cover the three most important world stories, the top story from Hungary, one story on the economy or markets, and one positive story. For each, write two or three sentences on what happened and why it matters, with a link to the original source. Where a story is contested, say briefly how outlets with different outlooks report it. Use reputable outlets such as Reuters, the BBC, the FT, The Economist, Telex and Portfolio. Keep it calm and factual, and end with one question worth thinking about.

Core user flow:
1. Log in.
2. Open the app → today's briefing is already there (instant, pre-generated).
3. Read ~5 minutes of stories by section; tap through to the original source.
4. Bookmark stories worth keeping; scroll back through past days' briefings.

## Decisions (locked in)

- **Cost: must be $0.** No paid APIs. Everything runs on free tiers.
- **News source:** free **RSS feeds** from reputable outlets → **Google Gemini API (free tier)** selects stories and writes summaries. (Claude API was ruled out: no free tier.)
- **Timing:** generated **once a day**, automatically (Vercel Cron, morning), and **cached** in the database. Opening the app never triggers an AI call → stays within free limits.
- **One shared briefing per day** for all users (not per-user generation).
- **Accounts:** Supabase Auth. Used for login + personal extras: **bookmarks** and **archive of past days**.
- **Sections:**
  - 3 × World (most important)
  - 1 × Hungary (top story)
  - 1 × Jordan (top story; English-language sources only)
  - 1 × Economy / Markets
  - 1 × Tech / AI
  - 1 × Positive story
  - Closing: one question worth thinking about
- **Per story:** title, 2–3 sentence summary (what happened + why it matters), source link(s), and — only when contested — a short note on how outlets with different outlooks report it.
- **Tone:** calm, factual. Output language: English (Hungarian sources get summarized in English).
- **Scope:** personal use first, designed to grow into multi-user later.
- **Hosting:** Vercel (free Hobby plan; daily cron is allowed).

## Tech stack (same as the fitness app)

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (Postgres + Supabase Auth) |
| AI summaries | Google Gemini API, free tier (key from Google AI Studio) |
| News input | RSS feeds (parsed server-side) |
| Scheduling | Vercel Cron → protected API route |
| Hosting | Vercel |
| Code hosting | GitHub |

## Candidate RSS sources (verify each URL works in Phase 2)

- World: BBC World, Reuters (no official public RSS anymore — use Google News RSS filtered to reuters.com, or swap for AP / The Guardian), Al Jazeera
- Hungary: Telex, Portfolio, (optionally) Hungary Today / Daily News Hungary for English
- Jordan (English only, by choice): Roya News English, Jordan Times (via Google News; direct RSS is 403)
- Economy / Markets: Portfolio, BBC Business, FT/Economist headlines where RSS is available (articles may be paywalled — link anyway)
- Tech / AI: BBC Technology, Ars Technica, The Verge
- Positive: Positive News, Good News Network
- Using several outlets per section gives Gemini what it needs for the "how outlets differ" note.

## Data model

```
Briefing         id, date (unique), closing_question, generated_at, model
 └─ Story        id, briefing_id, section, position, title, summary,
                 why_it_matters, sources (jsonb: [{name, url}]),
                 perspectives (text, nullable — only for contested stories)
User (Supabase Auth)
 └─ Bookmark     user_id, story_id, created_at
```

RLS:
- `briefings` / `stories`: readable by any logged-in user; **writable only by the server** (service-role key, used by the cron route).
- `bookmarks`: each user can only read/write their own rows.

## Generation pipeline (cron, once a day)

1. Fetch all RSS feeds in parallel; keep items from the last ~24h.
2. De-duplicate and group candidate headlines by section.
3. One Gemini call with the slide's prompt + the candidate items (title, outlet, description, link) → **structured JSON** output matching the Story schema. Gemini may only cite links that were in the input (no invented URLs).
4. Validate the JSON; on failure retry once, otherwise keep yesterday's briefing visible and log the error.
5. Insert Briefing + Stories into Supabase.

## Build phases

1. **Foundation** — Next.js + Tailwind scaffold, deploy empty app to Vercel. Supabase project + tables + RLS.
2. **News pipeline** — RSS fetching + Gemini summarization as a local script/route; inspect output quality before building UI.
3. **Accounts** — Supabase Auth; protect pages behind login.
4. **Today view** (core loop) — mobile-first briefing page, sections, source links, closing question.
5. **Automation** — Vercel Cron hitting a secret-protected `/api/generate` route each morning.
6. **Extras** — bookmarks, archive of past days.
7. **iPhone polish** — PWA manifest + icon for Add to Home Screen.

Recommendation: read real briefings for a few days after Phase 4/5 and tune the prompt before building extras.

## Current status (2026-11-13)

- Done: Phase 1 (Supabase tables + RLS), 2 (pipeline), 4 (Today view), 5 (Vercel Cron, daily 05:00 UTC).
- Live: https://daily-briefing-nine-pink.vercel.app — repo: github.com/RaynD-JPG/daily-briefing (public).
- **Phase 3 (login) is postponed by choice.** The site is public for now; the server reads briefings with the service-role key (`src/lib/news/load.ts` → `store.ts`), never in the browser.
- **Before building login:** rotate `SUPABASE_SERVICE_ROLE_KEY` (the old `sb_secret_` key was pasted into a chat). Update `.env.local` + Vercel, then redeploy. Gemini key rotation is optional (free tier).
- Known prompt issue: "perspectives" is sometimes filled with an unrelated story (seen on the Hungary story).

## Conventions

- TypeScript throughout; prefer type safety over `any`.
- Mobile-first, readable typography — this is read on a phone over coffee.
- Secrets (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) live in `.env.local` / Vercel env vars; never commit them. Only the Supabase URL + anon key use the `NEXT_PUBLIC_` prefix.
- Never call Gemini from the client or on page load — only from the cron route.
- Commits: no Claude co-author trailer.

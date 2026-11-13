# Daily Briefing

A calm, five-minute briefing on today's most important news, as a mobile-first web app (PWA).

Every morning it pulls headlines from free RSS feeds (BBC, Reuters, The Guardian, Al Jazeera, Telex, Portfolio, FT, The Economist, Ars Technica, The Verge, Good News Network), and Google's Gemini (free tier) picks and summarizes:

- 🌍 3 world stories
- 🇭🇺 1 Hungary story
- 📈 1 economy / markets story
- 💻 1 tech / AI story
- ☀️ 1 positive story
- 🤔 one question worth thinking about

Each story gets what happened, why it matters, links to the original sources, and, when a story is contested, how different outlets report it. Total running cost: $0.

## Run it locally

```bash
npm install
cp .env.local.example .env.local   # add a free key from https://aistudio.google.com/apikey
npm run briefing                   # fetch feeds + generate today's briefing into out/
npm run dev                        # open http://localhost:3000
```

`npm run briefing -- --feeds` tests only the RSS feeds (no Gemini call).

## Stack

Next.js (App Router) + TypeScript, Tailwind CSS, Gemini API, RSS. Planned: Supabase (auth, storage, bookmarks), Vercel + Vercel Cron.

See [CLAUDE.md](CLAUDE.md) for decisions, data model and build phases.

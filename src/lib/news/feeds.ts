export type Section = "world" | "hungary" | "economy" | "tech" | "positive";

export type Feed = {
  name: string; // outlet name shown to the reader
  url: string;
  hint: Section; // which section this feed mostly feeds; Gemini may still reassign
};

// All verified to respond on 2026-11-13. Positive.news blocks bots (403), so it's left out.
export const FEEDS: Feed[] = [
  // World
  { name: "BBC", url: "https://feeds.bbci.co.uk/news/world/rss.xml", hint: "world" },
  {
    name: "Reuters",
    url: "https://news.google.com/rss/search?q=site:reuters.com+when:1d&hl=en-US&gl=US&ceid=US:en",
    hint: "world",
  },
  { name: "The Guardian", url: "https://www.theguardian.com/world/rss", hint: "world" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", hint: "world" },

  // Hungary
  { name: "Telex", url: "https://telex.hu/rss", hint: "hungary" },
  { name: "Portfolio", url: "https://www.portfolio.hu/rss/all.xml", hint: "hungary" },
  { name: "Hungary Today", url: "https://hungarytoday.hu/feed/", hint: "hungary" },
  { name: "Daily News Hungary", url: "https://dailynewshungary.com/feed/", hint: "hungary" },

  // Economy / markets
  { name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml", hint: "economy" },
  { name: "The Economist", url: "https://www.economist.com/finance-and-economics/rss.xml", hint: "economy" },
  { name: "Financial Times", url: "https://www.ft.com/rss/home", hint: "economy" },

  // Tech / AI
  { name: "BBC Technology", url: "https://feeds.bbci.co.uk/news/technology/rss.xml", hint: "tech" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index", hint: "tech" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", hint: "tech" },

  // Positive
  { name: "Good News Network", url: "https://www.goodnewsnetwork.org/feed/", hint: "positive" },
];

// How many stories each section gets in the briefing.
export const SECTION_COUNTS: Record<Section, number> = {
  world: 3,
  hungary: 1,
  economy: 1,
  tech: 1,
  positive: 1,
};

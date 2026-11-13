import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daily Briefing",
    short_name: "Briefing",
    description: "A calm, five-minute briefing on today's most important news.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f1",
    theme_color: "#f6f5f1",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

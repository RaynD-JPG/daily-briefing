import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const serif = Source_Serif_4({
  variable: "--font-serif-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daily Briefing",
  description: "A calm, five-minute briefing on today's most important news.",
  appleWebApp: {
    capable: true,
    title: "Briefing",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#121211" },
  ],
  width: "device-width",
  initialScale: 1,
  // Let content extend into the safe areas so env(safe-area-inset-*) works
  // for the notch and home-indicator on iPhone.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} h-full antialiased`}
    >
      {/* min-h-dvh = dynamic viewport height: tracks the real visible area as
          the mobile address bar shows/hides, avoiding gaps and cut-off content. */}
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}

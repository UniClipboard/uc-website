import {
  Cormorant_Garamond,
  Inter_Tight,
  JetBrains_Mono,
} from "next/font/google";

import { metaFor } from "@/i18n/locale-meta";

// Sans and mono both render translated copy, so they need a Cyrillic-capable
// cut on Russian pages. Declaring separate instances per script (rather than
// adding "cyrillic" to one shared instance) keeps the extra glyphs off Latin
// and CJK pages: only the variables a page actually applies get preloaded.
const fontSans = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const fontSansCyrillic = Inter_Tight({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const fontMonoCyrillic = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

// Serif only ever renders the "UniClipboard" wordmark and roman numerals, which
// stay Latin in every locale, so it needs no per-script variant.
const fontSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const latinFonts = `${fontSans.variable} ${fontMono.variable} ${fontSerif.variable}`;
const cyrillicFonts = `${fontSansCyrillic.variable} ${fontMonoCyrillic.variable} ${fontSerif.variable}`;

export const fontsFor = (locale: string) =>
  metaFor(locale).script === "cyrillic" ? cyrillicFonts : latinFonts;

import { Geist, Geist_Mono } from "next/font/google";

import { metaFor } from "@/i18n/locale-meta";

// Geist in only the subsets a locale renders. Scripts Geist lacks (CJK,
// Arabic, Devanagari, Thai) fall through to the per-language system stacks in
// globals.css; Geist still draws their Latin text and digits.
const sans = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--try-font-sans",
  display: "swap",
});

const sansLatinExt = Geist({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--try-font-sans",
  display: "swap",
});

const sansCyrillic = Geist({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--try-font-sans",
  display: "swap",
});

// Mono only renders sizes, percentages, codes and file-type badges, which
// stay Latin in every locale.
const mono = Geist_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--try-font-mono",
  display: "swap",
});

const sansFor = {
  latin: sans.variable,
  "latin-ext": sansLatinExt.variable,
  cyrillic: sansCyrillic.variable,
  system: "",
};

export const tryFontsFor = (locale: string) =>
  `${sansFor[metaFor(locale).fonts]} ${mono.variable}`.trim();

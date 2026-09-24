import { Geist, Geist_Mono } from "next/font/google";

import { metaFor } from "@/i18n/locale-meta";

// Geist is the /try page's own type (the "C" visual language). It lives in
// this module, imported only by the /try route, so no other page downloads
// or preloads it. Cyrillic gets separate instances, as in `src/lib/fonts.ts`.
const sans = Geist({
  subsets: ["latin"],
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

// Mono only renders sizes, percentages and file-type badges, which stay Latin
// in every locale, so it needs no Cyrillic variant.
const mono = Geist_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--try-font-mono",
  display: "swap",
});

export const tryFontsFor = (locale: string) =>
  metaFor(locale).script === "cyrillic"
    ? `${sansCyrillic.variable} ${mono.variable}`
    : `${sans.variable} ${mono.variable}`;

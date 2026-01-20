import { Manrope, Noto_Sans_SC } from "next/font/google";

const fontSans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontChinese = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-chinese",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const fonts = `${fontChinese.variable} ${fontSans.variable}`;

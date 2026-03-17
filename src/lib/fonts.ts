import "@fontsource-variable/noto-sans-sc";

import localFont from "next/font/local";

const fontSans = localFont({
  src: "../assets/fonts/manrope-latin-wght-normal.woff2",
  variable: "--font-sans",
  display: "swap",
});

export const fonts = fontSans.variable;

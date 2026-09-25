import "../globals.css";
import "@/components/try/try.css";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import { ThemeProvider } from "@/components/theme-provider";
import { tryFontsFor } from "@/components/try/fonts";
import { routing } from "@/i18n/routing";
import { FRAGMENT_CAPTURE_SCRIPT } from "@/lib/web-transfer/link";

export const metadata: Metadata = {
  metadataBase: new URL("https://try.uniclipboard.app"),
  referrer: "no-referrer",
};
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale} data-try-site="" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: FRAGMENT_CAPTURE_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider messages={await getMessages()}>
          <ThemeProvider attribute="class">
            <div className={`try-page ${tryFontsFor(locale)}`}>{children}</div>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import "@/components/try/try.css";

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";
import { tryFontsFor } from "@/components/try/fonts";
import { TryTransfer } from "@/components/try/TryTransfer";
import {
  localeAlternates,
  localePathPrefix,
  metaFor,
} from "@/i18n/locale-meta";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/lib/site-config";
import { FRAGMENT_CAPTURE_SCRIPT } from "@/lib/web-transfer/link";

// Static shell; everything interactive runs in the browser. The tailcat wasm
// is fetched only when the user sends or opens a connection link.
export const revalidate = 3600;

type LocaleParam = { params: Promise<{ locale: string }> };

const TAILCAT_LICENSE_URL =
  "https://github.com/tailscale/tailcat/blob/83921d7141b80db20fd733ee195c805d2721e489/LICENSE";

export async function generateMetadata({
  params,
}: LocaleParam): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "try" });
  const canonical = `${localePathPrefix(locale)}/try`;
  const title = t("seoTitle");
  const description = t("seoDescription");
  const meta = metaFor(locale);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical, languages: localeAlternates("/try") },
    // Connection links carry secrets in the fragment; never leak the page
    // URL (with or without it) to other origins.
    referrer: "no-referrer",
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${canonical}`,
      type: "website",
      siteName: siteConfig.brand,
      locale: meta.ogLocale,
      images: [{ url: meta.ogImage, width: 1730, height: 909 }],
    },
  };
}

const Plus = ({ side }: { side: "left" | "right" }) => (
  <svg className={`try-plus try-plus--${side}`} viewBox="0 0 15 15" aria-hidden>
    <path d="M7.5 0v15M0 7.5h15" stroke="currentColor" strokeWidth="1" />
  </svg>
);

export default async function TryPage({ params }: LocaleParam) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "try.footer" });
  // The root layout leaves the `try` namespace out of the client messages.
  const { try: tryMessages } = await getMessages();

  return (
    <>
      {/* Runs during parsing, before hydration and analytics: moves a
          connection fragment into memory and strips it from the URL. */}
      <script dangerouslySetInnerHTML={{ __html: FRAGMENT_CAPTURE_SCRIPT }} />
      <Navigation />
      <div className={`try-page ${tryFontsFor(locale)}`}>
        <div className="try-frame">
          <Plus side="left" />
          <Plus side="right" />
          <main className="try-main">
            <NextIntlClientProvider messages={{ try: tryMessages }}>
              <TryTransfer />
            </NextIntlClientProvider>
          </main>
          <p className="try-foot">
            <span>
              {t("demo")} · {t("e2e")} · {t("notApp")} ·
            </span>
            <span>
              <Link href="/download">{t("getApp")}</Link> {t("forSync")}
            </span>
            <span aria-hidden>·</span>
            <a href={TAILCAT_LICENSE_URL} rel="noopener noreferrer">
              {t("license")}
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}

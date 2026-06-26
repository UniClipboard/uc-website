import "@/styles/globals.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ScrollToTop } from "@/components/scroll-to-top";
import { ThemeProvider } from "@/components/theme-provider";
import { routing } from "@/i18n/routing";
import { fonts } from "@/lib/fonts";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

// Enumerate locales at build time so every `[locale]` page can be statically
// prerendered. Without this (plus `setRequestLocale` below) next-intl reads the
// locale from `headers()`, which forces the entire subtree into dynamic
// rendering — a full SSR on every request.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isDefault = locale === routing.defaultLocale;
  const canonicalUrl = isDefault ? "/" : `/${locale}`;

  const t = await getTranslations({ locale, namespace: "seo" });
  const title = t("title");
  const description = t("description");
  const keywords = t("keywords")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const ogImage = {
    url: locale === "zh" ? "/og-zh.jpg" : "/og-en.jpg",
    width: 1730,
    height: 909,
    alt: t("ogAlt"),
  };

  return {
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: "/",
        zh: "/zh",
        "x-default": "/",
      },
    },
    metadataBase: new URL(siteConfig.url),
    title: {
      default: title,
      template: t("titleTemplate"),
    },
    description,
    keywords,
    robots: { index: true, follow: true },
    verification: {
      google: siteConfig.verification.google || undefined,
      ...(siteConfig.verification.yandex && {
        yandex: siteConfig.verification.yandex,
      }),
      other: {
        ...(siteConfig.verification.bing && {
          "msvalidate.01": siteConfig.verification.bing,
        }),
        ...(siteConfig.verification.baidu && {
          "baidu-site-verification": siteConfig.verification.baidu,
        }),
      },
    },
    openGraph: {
      url: siteConfig.url,
      title,
      description,
      siteName: siteConfig.brand,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      images: [ogImage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

const RootLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enables static rendering for this layout and all descendant pages: makes
  // next-intl resolve the locale from this value instead of `headers()`.
  setRequestLocale(locale);

  const gaId = siteConfig.analytics.gaMeasurementId;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={cn("min-h-screen font-sans", fonts)}>
        {process.env.NODE_ENV === "development" && (
          <Script src="/react-grab.global.js" strategy="lazyOnload" />
        )}
        {gaId && (
          <>
            <Script
              id="ga4-loader"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', { send_page_view: true });
              `}
            </Script>
          </>
        )}
        <NextIntlClientProvider>
          <ScrollToTop />
          <ThemeProvider attribute="class">{children}</ThemeProvider>
        </NextIntlClientProvider>
        <SpeedInsights />
      </body>
    </html>
  );
};

export default RootLayout;

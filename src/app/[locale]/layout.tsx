import "@/styles/globals.css";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";

import { ThemeProvider } from "@/components/theme-provider";
import { routing } from "@/i18n/routing";
import { fonts } from "@/lib/fonts";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isDefault = locale === routing.defaultLocale;
  const canonicalUrl = isDefault ? "/" : `/${locale}`;

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
      default: siteConfig.title,
      template: `%s | ${siteConfig.title}`,
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    robots: { index: true, follow: true },
    verification: {
      google: siteConfig.googleSiteVerificationId,
    },
    openGraph: {
      url: siteConfig.url,
      title: siteConfig.title,
      description: siteConfig.description,
      siteName: siteConfig.title,
      images: [
        {
          url: "/opengraph-image.jpg",
          width: 1584,
          height: 672,
          alt: "UniClipboard - Privacy-first clipboard sync",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.title,
      description: siteConfig.description,
      images: [
        {
          url: "/opengraph-image.jpg",
          width: 1584,
          height: 672,
          alt: "UniClipboard - Privacy-first clipboard sync",
        },
      ],
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

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={cn("min-h-screen font-sans", fonts)}>
        {process.env.NODE_ENV === "development" && (
          <Script src="/react-grab.global.js" strategy="lazyOnload" />
        )}
        <NextIntlClientProvider>
          <ThemeProvider attribute="class">{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;

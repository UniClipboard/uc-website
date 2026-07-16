import { getTranslations } from "next-intl/server";

import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { FinalDownloadCta } from "@/components/landing/FinalDownloadCta";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { Navigation } from "@/components/landing/Navigation";
import { localePathPrefix, metaFor } from "@/i18n/locale-meta";
import { fetchGitHubStars } from "@/lib/github-stars";
import {
  FALLBACK_RELEASE_URL,
  fetchStableRelease,
} from "@/lib/release-feed/fetch-stable-release";
import {
  normalizeStableRelease,
  type StableReleaseViewModel,
} from "@/lib/release-feed/normalize-release";
import { siteConfig } from "@/lib/site-config";

// Prerender as ISR (regenerate at most hourly) instead of rendering per request.
export const revalidate = 3600;

const buildDegradedFallback = (): StableReleaseViewModel => ({
  status: "degraded",
  version: "unavailable",
  publishedAt: "unavailable",
  notes: ["notes unavailable"],
  downloads: [],
  fallbackReleaseUrl: FALLBACK_RELEASE_URL,
  blockedPlatforms: [],
  degradedReason: "network-error",
});

type LandingPageProps = {
  params: Promise<{ locale: string }>;
};

const LandingPage = async ({ params }: LandingPageProps) => {
  const { locale } = await params;

  let stableRelease = buildDegradedFallback();

  try {
    stableRelease = normalizeStableRelease(await fetchStableRelease());
  } catch {
    stableRelease = buildDegradedFallback();
  }

  const starsResult = await fetchGitHubStars();
  const stars = starsResult.stars;

  const versionForSchema =
    stableRelease.version === "unavailable" ? undefined : stableRelease.version;

  const tFaq = await getTranslations({
    locale,
    namespace: "landing.faq",
  });
  const tHow = await getTranslations({
    locale,
    namespace: "landing.howItWorks",
  });
  const tSeo = await getTranslations({ locale, namespace: "seo" });

  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const pageUrl = `${baseUrl}${localePathPrefix(locale) || "/"}`;
  const ogImage = `${baseUrl}${metaFor(locale).ogImage}`;
  const logoUrl = `${baseUrl}/favicon/apple-touch-icon.png`;
  // Deliberately distinct from `seo.description`: this one describes the
  // product for the SoftwareApplication schema, not for a search snippet.
  const softwareDescription = tSeo("softwareDescription");

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "UniClipboard",
    description: softwareDescription,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "macOS, Windows, Linux, iOS, Android",
    url: baseUrl,
    image: ogImage,
    inLanguage: metaFor(locale).inLanguage,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    softwareVersion: versionForSchema,
    license: "https://www.gnu.org/licenses/agpl-3.0.html",
    downloadUrl: "https://github.com/UniClipboard/UniClipboard/releases/latest",
    sameAs: ["https://github.com/UniClipboard/UniClipboard"],
    ...(stars !== null && stars > 0
      ? {
          interactionStatistic: {
            "@type": "InteractionCounter",
            interactionType: { "@type": "LikeAction" },
            userInteractionCount: stars,
            name: "GitHub stars",
          },
        }
      : {}),
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "UniClipboard",
    url: baseUrl,
    logo: logoUrl,
    description: softwareDescription,
    sameAs: ["https://github.com/UniClipboard/UniClipboard"],
    contactPoint: {
      "@type": "ContactPoint",
      email: "hello@uniclipboard.app",
      contactType: "customer support",
      availableLanguage: ["English", "Chinese"],
    },
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "UniClipboard",
    url: baseUrl,
    inLanguage: metaFor(locale).inLanguage,
    publisher: { "@type": "Organization", name: "UniClipboard", url: baseUrl },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
      "@type": "Question",
      name: tFaq(`item${i}.q`),
      acceptedAnswer: {
        "@type": "Answer",
        text: tFaq(`item${i}.a`),
      },
    })),
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: tHow("title"),
    description: tHow("title"),
    inLanguage: metaFor(locale).inLanguage,
    totalTime: "PT1M",
    supply: [],
    tool: [
      { "@type": "HowToTool", name: "macOS, Windows, or Linux device" },
      { "@type": "HowToTool", name: "UniClipboard app" },
    ],
    step: [1, 2, 3].map((i) => ({
      "@type": "HowToStep",
      position: i,
      name: tHow(`step${i}Title`),
      text: tHow(`step${i}Desc`),
      url: `${pageUrl}#how-it-works`,
    })),
  };

  return (
    <>
      <Navigation />
      <main>
        <HeroSection stars={stars} />
        <FeaturesSection />
        <ComparisonSection />
        <FaqSection />
        <FinalDownloadCta release={stableRelease} />
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            orgSchema,
            webSiteSchema,
            softwareSchema,
            faqSchema,
            howToSchema,
          ]),
        }}
      />
    </>
  );
};

export default LandingPage;

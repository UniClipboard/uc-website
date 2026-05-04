import { getTranslations } from "next-intl/server";

import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { DownloadSection } from "@/components/landing/DownloadSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { Navigation } from "@/components/landing/Navigation";
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

  const baseUrl = siteConfig.url;
  const pageUrl = locale === "en" ? `${baseUrl}/` : `${baseUrl}/${locale}`;

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "UniClipboard",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "macOS, Windows, Linux",
    url: "https://www.uniclipboard.app",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    softwareVersion: versionForSchema,
    license: "https://www.gnu.org/licenses/agpl-3.0.html",
    downloadUrl: "https://github.com/UniClipboard/UniClipboard/releases/latest",
    sameAs: ["https://github.com/UniClipboard/UniClipboard"],
    ...(stars !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        ratingCount: String(stars),
        bestRating: "5",
        worstRating: "1",
      },
    }),
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "UniClipboard",
    url: "https://www.uniclipboard.app",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4, 5, 6].map((i) => ({
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
    inLanguage: locale === "zh" ? "zh-CN" : "en",
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
        <HeroSection release={stableRelease} stars={stars} />
        <FeaturesSection />
        <ComparisonSection />
        <DownloadSection release={stableRelease} />
        <FaqSection />
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            orgSchema,
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

import { CtaSection } from "@/components/landing/CtaSection";
import { DownloadSection } from "@/components/landing/DownloadSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { Navigation } from "@/components/landing/Navigation";
import {
  FALLBACK_RELEASE_URL,
  fetchStableRelease,
} from "@/lib/release-feed/fetch-stable-release";
import {
  normalizeStableRelease,
  type StableReleaseViewModel,
} from "@/lib/release-feed/normalize-release";

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

const LandingPage = async () => {
  let stableRelease = buildDegradedFallback();

  try {
    stableRelease = normalizeStableRelease(await fetchStableRelease());
  } catch {
    stableRelease = buildDegradedFallback();
  }

  return (
    <>
      <Navigation />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <DownloadSection release={stableRelease} />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "UniClipboard",
            url: "https://www.uniclipboard.app",
          }),
        }}
      />
    </>
  );
};

export default LandingPage;

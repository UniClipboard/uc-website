import { AudienceSection } from "@/components/landing/AudienceSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { Navigation } from "@/components/landing/Navigation";
import { TrustSection } from "@/components/landing/TrustSection";

const LandingPage = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;

  return (
    <>
      <Navigation />
      <main>
        <HeroSection locale={locale} />
        <FeaturesSection />
        <HowItWorksSection />
        <TrustSection />
        <AudienceSection />
        <FaqSection />
        <CtaSection locale={locale} />
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

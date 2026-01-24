import { AudienceSection } from "@/components/landing/AudienceSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { Navigation } from "@/components/landing/Navigation";
import { RoadmapSection } from "@/components/landing/RoadmapSection";
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
        <RoadmapSection />
        <AudienceSection />
        <CtaSection locale={locale} />
      </main>
      <Footer />
    </>
  );
};

export default LandingPage;

import { AudienceSection } from "@/components/landing/AudienceSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
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
        <FeaturesSection locale={locale} />
        <TrustSection locale={locale} />
        <RoadmapSection locale={locale} />
        <AudienceSection locale={locale} />
        <CtaSection locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  );
};

export default LandingPage;

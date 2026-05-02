import { getTranslations } from "next-intl/server";

import type { StableReleaseViewModel } from "@/lib/release-feed/normalize-release";

import { AnimateIn } from "./AnimateIn";
import { HeroDownloadCta } from "./HeroDownloadCta";
import { HeroTrustBar } from "./HeroTrustBar";
import { HeroVideo } from "./HeroVideo";

type Props = {
  release: StableReleaseViewModel;
  stars: number | null;
};

export async function HeroSection({ release, stars }: Props) {
  const t = await getTranslations("landing.hero");
  const tDl = await getTranslations("landing.download");

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden pt-[120px] pb-[96px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--hero-spotlight)" }}
      />
      <div className="landing-shell">
        <div className="mx-auto mb-14 flex max-w-[820px] flex-col items-center text-center">
          <AnimateIn delay={0.08} duration={0.6}>
            <h1
              className="text-foreground my-5"
              style={{
                fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
                lineHeight: 1.0,
                fontWeight: 600,
                letterSpacing: "-0.035em",
                textWrap: "balance",
              }}
            >
              {t("title")}
              <span style={{ color: "var(--muted2)" }}> {t("titleLine2")}</span>
            </h1>
          </AnimateIn>

          <AnimateIn delay={0.14} duration={0.6}>
            <p
              className="text-muted-foreground mx-auto mb-7"
              style={{
                fontSize: "clamp(1rem, 1.6vw, 1.125rem)",
                lineHeight: 1.55,
                maxWidth: 620,
                textWrap: "pretty",
              }}
            >
              {t("description")}
            </p>
          </AnimateIn>

          <AnimateIn delay={0.2} duration={0.6}>
            <div className="mb-6">
              <HeroDownloadCta
                downloads={release.downloads}
                labels={{
                  primaryGeneric: tDl("ctaPrimaryGeneric"),
                  primaryWith: tDl("ctaPrimaryWith"),
                  secondaryHow: t("secondaryCta"),
                  otherPlatforms: tDl("ctaOtherPlatforms"),
                  arm: tDl("archArm"),
                  intel: tDl("archIntel"),
                  x64: tDl("archX64"),
                  linuxX64: tDl("ctaLinuxX64"),
                  linuxArm: tDl("ctaLinuxArm"),
                  windows: tDl("platformWindows"),
                  mac: tDl("platformMacOS"),
                }}
              />
            </div>
          </AnimateIn>

          <AnimateIn delay={0.26} duration={0.6}>
            <HeroTrustBar
              stars={stars}
              labels={{
                starsSuffix: t("starsSuffix"),
                starsFallback: t("starsFallback"),
                free: t("free"),
                e2e: t("e2e"),
              }}
            />
          </AnimateIn>
        </div>

        <div className="relative mx-auto" style={{ maxWidth: 1080 }}>
          <AnimateIn delay={0.32} duration={0.6}>
            <HeroVideo
              playLabel={t("videoPlay")}
              pauseLabel={t("videoPause")}
              durationLabel={t("videoDuration")}
              videoLabel={t("videoLabel")}
            />
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}

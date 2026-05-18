import { getTranslations } from "next-intl/server";

import { isChinaIp } from "@/lib/geo/country";
import { getAndroidPrimaryDownloadUrl } from "@/lib/mobile-releases";
import type { StableReleaseViewModel } from "@/lib/release-feed/normalize-release";

import { HeroDownloadCta } from "./HeroDownloadCta";
import { HeroTrustBar } from "./HeroTrustBar";
import { HeroVideo } from "./HeroVideo";
import type { HeroVideoSource } from "./HeroVideoModal";
import { HeroMobileCta } from "./mobile/HeroMobileCta";
import { HeroVideoMobile } from "./mobile/HeroVideoMobile";

type Props = {
  release: StableReleaseViewModel;
  stars: number | null;
};

export async function HeroSection({ release, stars }: Props) {
  const t = await getTranslations("landing.hero");
  const tDl = await getTranslations("landing.download");
  const defaultVideoSource: HeroVideoSource = (await isChinaIp())
    ? "bilibili"
    : "youtube";

  const downloadLabels = {
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
  };

  const trustLabels = {
    starsSuffix: t("starsSuffix"),
    starsFallback: t("starsFallback"),
    free: t("free"),
    e2e: t("e2e"),
  };

  return (
    <section id="top" className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--hero-spotlight)" }}
      />

      {/* Desktop / tablet */}
      <div className="hidden pt-[152px] pb-[128px] md:block lg:pt-[168px] lg:pb-[144px]">
        <div className="landing-shell">
          <div className="mx-auto mb-16 flex max-w-[820px] flex-col items-center text-center">
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

            <div className="mb-6">
              <HeroDownloadCta
                downloads={release.downloads}
                labels={downloadLabels}
              />
            </div>

            <HeroTrustBar stars={stars} labels={trustLabels} />
          </div>

          <div className="relative mx-auto" style={{ maxWidth: 1080 }}>
            <HeroVideo
              playLabel={t("videoPlay")}
              videoLabel={t("videoLabel")}
              openLabel={t("videoOpen")}
              closeLabel={t("videoClose")}
              youtubeLabel={t("videoSourceYoutube")}
              bilibiliLabel={t("videoSourceBilibili")}
              fallbackHint={t("videoFallbackHint")}
              defaultSource={defaultVideoSource}
            />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="pt-[108px] pb-[80px] md:hidden">
        <div className="landing-shell">
          <div className="flex flex-col items-center text-center">
            <h1
              className="text-foreground mt-3 mb-5"
              style={{
                fontSize: "clamp(2rem, 9vw, 2.6rem)",
                lineHeight: 1.05,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                textWrap: "balance",
              }}
            >
              {t("title")}
              <span style={{ color: "var(--muted2)" }}> {t("titleLine2")}</span>
            </h1>

            <p
              className="text-muted-foreground mx-auto mb-7"
              style={{
                fontSize: 15,
                lineHeight: 1.55,
                maxWidth: 480,
                textWrap: "pretty",
              }}
            >
              {t("descriptionMobile")}
            </p>
          </div>

          <HeroVideoMobile
            playLabel={t("videoPlay")}
            videoLabel={t("videoLabel")}
            openLabel={t("videoOpen")}
            closeLabel={t("videoClose")}
            youtubeLabel={t("videoSourceYoutube")}
            bilibiliLabel={t("videoSourceBilibili")}
            fallbackHint={t("videoFallbackHint")}
            defaultSource={defaultVideoSource}
          />

          <div className="mt-8 flex flex-col items-center text-center">
            <HeroMobileCta
              defaultLabel={t("mobileBadge")}
              defaultHref="#faq-mobile"
              iosLabel={t("mobileBadgeIOS")}
              iosHref="#download"
              androidLabel={t("mobileBadgeAndroid")}
              androidUrl={getAndroidPrimaryDownloadUrl()}
            />

            <HeroTrustBar stars={stars} labels={trustLabels} />
          </div>
        </div>
      </div>
    </section>
  );
}

import { ArrowDown } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AnimateIn } from "./AnimateIn";
import { HeroVideo } from "./HeroVideo";

export async function HeroSection() {
  const t = await getTranslations("landing.hero");

  return (
    <section id="top" className="relative overflow-hidden pt-[120px] pb-[96px]">
      <div className="landing-shell">
        {/* Centered text block */}
        <div className="mx-auto mb-14 flex max-w-[820px] flex-col items-center text-center">
          <AnimateIn variant="fade-in" duration={0.6}>
            <p className="landing-kicker">{t("eyebrow")}</p>
          </AnimateIn>

          <AnimateIn delay={0.08} duration={0.6}>
            <h1
              className="text-foreground my-5"
              style={{
                fontSize: 72,
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
                fontSize: 18,
                lineHeight: 1.55,
                maxWidth: 620,
                textWrap: "pretty",
              }}
            >
              {t("description")}
            </p>
          </AnimateIn>

          <AnimateIn delay={0.2} duration={0.6}>
            <div className="mb-6 flex items-center gap-3">
              <a
                href="#download"
                className="bg-primary text-primary-foreground inline-flex items-center gap-2.5 rounded-[10px] px-[18px] py-3 text-[14px] font-medium transition-transform hover:-translate-y-[1px]"
              >
                <ArrowDown className="size-4" />
                {t("primaryCta")}
              </a>
              <a
                href="#how"
                className="border-border text-foreground hover:bg-foreground/5 inline-flex items-center gap-2 rounded-[10px] border px-4 py-3 text-[14px] font-medium transition-colors"
              >
                {t("secondaryCta")}
              </a>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.26} duration={0.6}>
            <div
              className="text-muted-foreground flex items-center gap-[18px]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.04em",
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="bg-foreground inline-block"
                  style={{ width: 5, height: 5, borderRadius: 99 }}
                />
                {t("meta1")}
              </span>
              <span>·</span>
              <span>{t("meta2")}</span>
              <span>·</span>
              <span>{t("meta3")}</span>
            </div>
          </AnimateIn>
        </div>

        {/* Big centered video stage */}
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

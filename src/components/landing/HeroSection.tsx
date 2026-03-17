import { Github } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AnimateIn, StaggerChild, StaggerIn } from "./AnimateIn";

export async function HeroSection() {
  const t = await getTranslations("landing.hero");
  const facts = ["fact1", "fact2", "fact3"] as const;

  return (
    <section
      id="top"
      className="relative overflow-hidden pt-36 pb-20 sm:pt-44 sm:pb-28"
    >
      <div className="landing-shell relative">
        <div className="max-w-[52rem]">
          <AnimateIn variant="fade-in" duration={0.8}>
            <p className="landing-kicker">{t("eyebrow")}</p>
          </AnimateIn>

          <AnimateIn delay={0.1} duration={0.9}>
            <h1 className="mt-7 text-[clamp(3rem,8vw,7.2rem)] leading-[0.88] font-semibold tracking-[-0.06em]">
              <span className="block">{t("title")}</span>
              <span className="text-primary block">{t("titleLine2")}</span>
            </h1>
          </AnimateIn>

          <AnimateIn delay={0.25} duration={0.8}>
            <p className="text-muted-foreground mt-8 max-w-[36rem] text-[1.05rem] leading-[1.85]">
              {t("description")}
            </p>
          </AnimateIn>

          <AnimateIn delay={0.4}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#download"
                className="bg-primary text-primary-foreground inline-flex h-12 items-center justify-center rounded-full px-7 text-sm font-medium shadow-[0_20px_50px_rgba(38,106,74,0.22)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(38,106,74,0.3)]"
              >
                {t("primaryCta")}
              </a>
              <a
                href="https://github.com/UniClipboard/UniClipboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 px-1 text-sm font-medium transition-colors"
              >
                <Github className="size-4" />
                {t("tertiaryCta")}
              </a>
            </div>
          </AnimateIn>
        </div>

        <AnimateIn delay={0.55}>
          <StaggerIn
            stagger={0.12}
            className="mt-20 grid gap-x-8 gap-y-4 border-t border-[color:var(--border)] pt-7 sm:grid-cols-3"
          >
            {facts.map((key) => (
              <StaggerChild key={key}>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-[0.68rem] font-medium tracking-[0.22em] uppercase">
                    {t(`${key}.label`)}
                  </p>
                  <p className="mt-2 text-[0.92rem] leading-7">
                    {t(`${key}.value`)}
                  </p>
                </div>
              </StaggerChild>
            ))}
          </StaggerIn>
        </AnimateIn>
      </div>
    </section>
  );
}

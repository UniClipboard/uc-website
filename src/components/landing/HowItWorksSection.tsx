import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { AnimateIn, StaggerChild, StaggerIn } from "./AnimateIn";

const steps = ["step1", "step2", "step3"] as const;
const securityFacts = ["fact1", "fact2", "fact3"] as const;

export async function HowItWorksSection() {
  const t = await getTranslations("landing.howItWorks");

  return (
    <section id="security" className="py-20 sm:py-28">
      <div className="landing-shell">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
          <div>
            <AnimateIn>
              <p className="landing-kicker">{t("eyebrow")}</p>
              <h2 className="mt-5 text-[clamp(1.8rem,4.2vw,3.2rem)] leading-[1.05] font-semibold tracking-[-0.04em]">
                {t("title")}
              </h2>
              <p className="text-muted-foreground mt-4 max-w-lg text-base leading-8">
                {t("subtitle")}
              </p>
            </AnimateIn>

            <StaggerIn stagger={0.12} className="mt-12">
              {steps.map((step, index) => (
                <StaggerChild key={step}>
                  <div
                    className={`flex gap-6 py-7 ${
                      index < steps.length - 1
                        ? "border-b border-[color:var(--border)]"
                        : ""
                    } ${index === 0 ? "border-t border-[color:var(--border)]" : ""}`}
                  >
                    <p className="text-primary shrink-0 pt-0.5 text-sm font-semibold">
                      0{index + 1}
                    </p>
                    <div>
                      <h3 className="text-lg font-medium tracking-[-0.02em]">
                        {t(`${step}.title`)}
                      </h3>
                      <p className="text-muted-foreground mt-2 text-[0.94rem] leading-7">
                        {t(`${step}.description`)}
                      </p>
                    </div>
                  </div>
                </StaggerChild>
              ))}
            </StaggerIn>
          </div>

          <AnimateIn variant="scale-up" delay={0.15}>
            <aside className="landing-panel h-fit rounded-[2rem] p-7">
              <p className="landing-kicker">{t("securityEyebrow")}</p>
              <h3 className="mt-4 text-[1.55rem] leading-tight font-semibold tracking-[-0.03em]">
                {t("securityTitle")}
              </h3>
              <p className="text-muted-foreground mt-4 text-[0.94rem] leading-7">
                {t("securityDescription")}
              </p>

              <StaggerIn stagger={0.1} className="mt-7 grid gap-3">
                {securityFacts.map((fact, index) => (
                  <StaggerChild key={fact}>
                    <div className="rounded-2xl border border-[color:color-mix(in_oklab,var(--color-border)_60%,white)] bg-white/40 p-4 dark:border-white/8 dark:bg-white/3">
                      <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
                        0{index + 1}
                      </p>
                      <p className="mt-2 text-sm leading-7">
                        {t(`security.${fact}`)}
                      </p>
                    </div>
                  </StaggerChild>
                ))}
              </StaggerIn>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link
                  className="bg-primary text-primary-foreground inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium shadow-[0_18px_40px_rgba(38,106,74,0.22)] transition-all duration-300 ease-out hover:-translate-y-0.5"
                  href="/whitepaper"
                >
                  {t("whitepaperCta")}
                </Link>
                <a
                  href="#download"
                  className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                >
                  {t("downloadCta")}
                </a>
              </div>
            </aside>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}

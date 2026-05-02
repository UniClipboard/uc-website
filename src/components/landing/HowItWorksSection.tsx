import { getTranslations } from "next-intl/server";

import { AnimateIn, StaggerChild, StaggerIn } from "./AnimateIn";

const steps = ["step1", "step2", "step3"] as const;

export async function HowItWorksSection() {
  const t = await getTranslations("landing.howItWorks");

  return (
    <section
      id="how"
      className="border-border bg-background relative overflow-hidden border-b py-[120px]"
    >
      {/* Soft ambient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 40%, rgba(10,10,10,0.035) 0%, rgba(10,10,10,0.015) 40%, rgba(10,10,10,0) 75%)",
        }}
      />
      {/* Grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(10,10,10,0.05) 1px, transparent 1px),linear-gradient(to bottom, rgba(10,10,10,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          WebkitMaskImage:
            "radial-gradient(closest-side, black 30%, transparent 80%)",
          maskImage:
            "radial-gradient(closest-side, black 30%, transparent 80%)",
        }}
      />

      <div className="landing-shell relative">
        <AnimateIn variant="fade-in" duration={0.5}>
          <p className="landing-kicker">{t("eyebrow")}</p>
        </AnimateIn>
        <AnimateIn delay={0.06} duration={0.6}>
          <h2
            className="text-foreground mt-3.5 mb-14"
            style={{
              fontSize: 44,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              maxWidth: 760,
              textWrap: "balance",
            }}
          >
            {t("title")}
          </h2>
        </AnimateIn>

        <div className="relative grid grid-cols-3 gap-6">
          {/* connecting hairline */}
          <div
            className="bg-border absolute z-0"
            style={{
              top: 30,
              left: "8.3%",
              right: "8.3%",
              height: 1,
            }}
          />

          <StaggerIn stagger={0.08} className="contents">
            {steps.map((step, i) => (
              <StaggerChild key={step}>
                <div className="relative z-10">
                  <div
                    className="bg-card border-border text-foreground mb-[22px] flex size-[60px] items-center justify-center rounded-[14px] border"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                      boxShadow: "0 4px 12px -8px rgba(10,10,10,0.18)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div
                    className="text-foreground mb-2.5"
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {t(`${step}Title`)}
                  </div>
                  <div
                    className="text-muted-foreground"
                    style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 320 }}
                  >
                    {t(`${step}Desc`)}
                  </div>
                </div>
              </StaggerChild>
            ))}
          </StaggerIn>
        </div>
      </div>
    </section>
  );
}

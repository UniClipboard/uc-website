import { getTranslations } from "next-intl/server";

import { AnimateIn, StaggerChild, StaggerIn } from "./AnimateIn";

const items = ["local", "frictionless", "private"] as const;

export async function FeaturesSection() {
  const t = await getTranslations("landing.features");

  return (
    <section id="why" className="relative py-20 sm:py-28">
      <div className="landing-shell">
        <AnimateIn>
          <div className="max-w-xl">
            <p className="landing-kicker">{t("eyebrow")}</p>
            <h2 className="mt-5 text-[clamp(1.8rem,4.2vw,3.2rem)] leading-[1.05] font-semibold tracking-[-0.04em] text-balance">
              {t("title")}
            </h2>
            <p className="text-muted-foreground mt-5 text-base leading-8">
              {t("subtitle")}
            </p>
          </div>
        </AnimateIn>

        <StaggerIn stagger={0.15} className="mt-16 grid gap-0 sm:grid-cols-3">
          {items.map((item, index) => (
            <StaggerChild key={item}>
              <div
                className={`py-8 sm:pr-10 ${
                  index === 0
                    ? "border-t border-[color:var(--border)] sm:border-t"
                    : "border-t border-[color:var(--border)]"
                } ${index < 2 ? "sm:border-t sm:border-r" : "sm:border-t"} ${
                  index > 0 ? "sm:pl-10" : ""
                }`}
              >
                <p className="text-primary text-sm font-semibold">
                  0{index + 1}
                </p>
                <h3 className="mt-4 text-lg leading-snug font-medium tracking-[-0.02em]">
                  {t(`${item}.title`)}
                </h3>
                <p className="text-muted-foreground mt-3 text-[0.94rem] leading-7">
                  {t(`${item}.description`)}
                </p>
              </div>
            </StaggerChild>
          ))}
        </StaggerIn>
      </div>
    </section>
  );
}

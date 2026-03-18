import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AnimateIn, StaggerChild, StaggerIn } from "./AnimateIn";

export async function FaqSection() {
  const t = await getTranslations("landing.faq");
  const items = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="landing-shell">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
          {/* Left column — header */}
          <AnimateIn className="lg:sticky lg:top-28 lg:self-start">
            <p className="landing-kicker">{t("eyebrow")}</p>
            <h2 className="mt-5 text-[clamp(1.8rem,4.2vw,3rem)] leading-[1.05] font-semibold tracking-[-0.04em]">
              {t("title")}
            </h2>
            <p className="text-muted-foreground mt-4 text-base leading-8">
              {t("subtitle")}
            </p>
          </AnimateIn>

          {/* Right column — accordion */}
          <StaggerIn stagger={0.08}>
            {items.map((num, index) => (
              <StaggerChild key={num}>
                <details
                  className={`group border-b border-[color:var(--border)] ${
                    index === 0 ? "border-t" : ""
                  }`}
                >
                  <summary className="flex cursor-pointer list-none items-center gap-5 py-5 [&::-webkit-details-marker]:hidden">
                    <span className="text-muted-foreground/50 text-xs font-medium tabular-nums">
                      {String(num).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-[0.98rem] font-medium tracking-[-0.01em]">
                      {t(`item${num}.q`)}
                    </span>
                    <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-out group-open:rotate-180" />
                  </summary>
                  <div className="pb-6 pl-9">
                    <p className="text-muted-foreground max-w-xl text-[0.94rem] leading-7 whitespace-pre-line">
                      {t(`item${num}.a`)}
                    </p>
                  </div>
                </details>
              </StaggerChild>
            ))}
          </StaggerIn>
        </div>
      </div>
    </section>
  );
}

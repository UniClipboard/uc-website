import { getTranslations } from "next-intl/server";

import { AnimateIn } from "./AnimateIn";

export async function CtaSection() {
  const t = await getTranslations("landing.cta");

  return (
    <section id="cta" className="py-20 sm:py-28">
      <div className="landing-shell">
        <AnimateIn variant="scale-up" duration={0.85}>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[linear-gradient(150deg,oklch(0.32_0.06_158),oklch(0.26_0.035_215)_48%,oklch(0.30_0.045_38))] p-10 text-white shadow-[0_32px_90px_rgba(16,24,20,0.22)] md:p-18">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-white/[0.05] blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/[0.03] blur-3xl"
            />

            <div className="relative z-10 max-w-3xl">
              <AnimateIn variant="fade-in" delay={0.2}>
                <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-white/50 uppercase">
                  {t("badge")}
                </p>
              </AnimateIn>

              <AnimateIn delay={0.3} duration={0.9}>
                <h2 className="mt-6 text-[clamp(2.4rem,6vw,5rem)] leading-[0.9] font-semibold tracking-[-0.05em]">
                  <span className="block">{t("title")}</span>
                  <span className="block text-white/70">{t("titleLine2")}</span>
                </h2>
              </AnimateIn>

              <AnimateIn delay={0.45}>
                <p className="mt-7 max-w-md text-[1.05rem] leading-8 text-white/60">
                  {t("description")}
                </p>
              </AnimateIn>

              <AnimateIn delay={0.55}>
                <div className="mt-10 flex flex-wrap items-center gap-5">
                  <a
                    href="#download"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold whitespace-nowrap text-[color:oklch(0.25_0.03_52)] shadow-[0_16px_40px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
                  >
                    {t("button")}
                  </a>
                  <p className="text-sm leading-7 text-white/45">{t("note")}</p>
                </div>
              </AnimateIn>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}

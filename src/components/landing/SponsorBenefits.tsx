import {
  BadgeCheck,
  Handshake,
  type LucideIcon,
  MessageCircle,
  Rocket,
  Sparkles,
  Vote,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AnimateIn } from "@/components/landing/AnimateIn";

const BENEFITS: { key: string; Icon: LucideIcon }[] = [
  { key: "b1", Icon: Sparkles },
  { key: "b2", Icon: Rocket },
  { key: "b3", Icon: Vote },
  { key: "b4", Icon: MessageCircle },
  { key: "b5", Icon: BadgeCheck },
  { key: "b6", Icon: Handshake },
];

export async function SponsorBenefits() {
  const t = await getTranslations("landing.sponsor.benefits");

  return (
    <section className="border-border bg-background border-b py-[72px] md:py-[100px]">
      <div className="landing-shell">
        <div className="max-w-2xl">
          <AnimateIn>
            <p className="landing-kicker mb-4">{t("eyebrow")}</p>
          </AnimateIn>
          <AnimateIn delay={0.06}>
            <h2 className="text-foreground text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              {t("title")}
            </h2>
          </AnimateIn>
          <AnimateIn delay={0.12}>
            <p className="text-muted mt-4 text-base leading-relaxed md:text-lg">
              {t("subtitle")}
            </p>
          </AnimateIn>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ key, Icon }, i) => (
            <AnimateIn key={key} delay={0.06 + i * 0.05}>
              <div className="border-border bg-card hover:border-foreground/20 flex h-full flex-col gap-4 rounded-2xl border p-7 transition-colors">
                <span className="border-border text-foreground bg-background inline-flex size-11 items-center justify-center rounded-xl border">
                  <Icon className="size-5" strokeWidth={1.6} />
                </span>
                <div>
                  <h3 className="text-foreground text-[15px] font-semibold">
                    {t(`items.${key}.title`)}
                  </h3>
                  <p className="text-muted mt-2 text-sm leading-relaxed">
                    {t(`items.${key}.desc`)}
                  </p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}

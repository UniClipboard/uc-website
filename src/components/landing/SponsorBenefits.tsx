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

/** The two headline perks get oversized "featured" cards; the rest are compact. */
const FEATURED: { key: string; Icon: LucideIcon }[] = [
  { key: "b1", Icon: Sparkles },
  { key: "b2", Icon: Rocket },
];

const REST: { key: string; Icon: LucideIcon }[] = [
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

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {/* Two headline perks — oversized cards with a horizontal layout. */}
          {FEATURED.map(({ key, Icon }, i) => (
            <AnimateIn key={key} delay={0.06 + i * 0.06}>
              {/* Below `sm` these match the compact cards exactly so the mobile
                  column reads as one uniform list; the oversized treatment
                  only kicks in once the grid exists. */}
              <div className="group border-border bg-card hover:border-foreground/25 relative flex h-full items-start gap-4 overflow-hidden rounded-2xl border p-5 transition-colors sm:gap-5 sm:p-7 md:p-8">
                {/* corner glow */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle, color-mix(in srgb, var(--foreground) 7%, transparent), transparent 70%)",
                  }}
                />
                <span className="border-border text-foreground bg-background relative inline-flex size-10 flex-none items-center justify-center rounded-lg border sm:size-12 sm:rounded-xl">
                  <Icon className="size-[18px] sm:size-6" strokeWidth={1.6} />
                </span>
                <div className="relative">
                  <h3 className="text-foreground text-[15px] font-semibold tracking-tight sm:text-lg">
                    {t(`items.${key}.title`)}
                  </h3>
                  <p className="text-muted mt-1.5 text-sm leading-relaxed sm:mt-2">
                    {t(`items.${key}.desc`)}
                  </p>
                </div>
              </div>
            </AnimateIn>
          ))}

          {/* Remaining perks — compact cards, four-up on the widest layout. */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-4">
            {REST.map(({ key, Icon }, i) => (
              <AnimateIn key={key} delay={0.18 + i * 0.05}>
                <div className="border-border bg-card hover:border-foreground/20 flex h-full items-start gap-4 rounded-2xl border p-5 transition-colors sm:flex-col sm:p-6">
                  <span className="border-border text-foreground bg-background inline-flex size-10 flex-none items-center justify-center rounded-lg border">
                    <Icon className="size-[18px]" strokeWidth={1.6} />
                  </span>
                  <div>
                    <h3 className="text-foreground text-[15px] font-semibold">
                      {t(`items.${key}.title`)}
                    </h3>
                    <p className="text-muted mt-1.5 text-sm leading-relaxed">
                      {t(`items.${key}.desc`)}
                    </p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

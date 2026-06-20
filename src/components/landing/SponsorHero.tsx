import { Github } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AnimateIn } from "@/components/landing/AnimateIn";
import { Monogram } from "@/components/landing/Monogram";
import { GITHUB_REPO_URL, sponsorPrimaryChannel } from "@/lib/sponsors";
import { getPublicSponsors } from "@/lib/sponsors-store";

export async function SponsorHero() {
  const t = await getTranslations("landing.sponsor.hero");
  const sponsors = await getPublicSponsors();
  const primary = sponsorPrimaryChannel();
  const preview = sponsors.slice(0, 5);

  return (
    <section className="border-border bg-background relative overflow-hidden border-b">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--hero-spotlight)" }}
      />
      <div className="landing-shell relative flex flex-col items-center pt-28 pb-16 text-center md:pt-40 md:pb-24">
        <AnimateIn>
          <p className="landing-kicker mb-5">{t("eyebrow")}</p>
        </AnimateIn>
        <AnimateIn delay={0.06}>
          <h1 className="text-foreground mx-auto max-w-3xl text-4xl leading-[1.06] font-semibold tracking-tight text-balance md:text-5xl lg:text-6xl">
            {t("title")} <span className="text-muted">{t("titleLine2")}</span>
          </h1>
        </AnimateIn>
        <AnimateIn delay={0.12}>
          <p className="text-muted mx-auto mt-6 max-w-2xl text-base leading-relaxed md:text-lg">
            {t("description")}
          </p>
        </AnimateIn>
        <AnimateIn delay={0.18}>
          <div className="mt-9 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
            {primary && (
              <a
                href={primary.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-foreground text-background inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                {t("primaryCta")}
              </a>
            )}
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border text-foreground hover:bg-bg2 inline-flex w-full items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors sm:w-auto"
            >
              <Github className="size-4" />
              {t("secondaryCta")}
            </a>
          </div>
        </AnimateIn>
        {sponsors.length > 0 && (
          <AnimateIn delay={0.24}>
            <div className="text-muted mt-8 flex items-center justify-center gap-3 text-sm">
              <span className="flex items-center -space-x-2.5">
                {preview.map((s) =>
                  s.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={s.id}
                      src={s.avatar}
                      alt=""
                      width={30}
                      height={30}
                      className="ring-background size-[30px] rounded-full object-cover ring-2"
                    />
                  ) : (
                    <Monogram
                      key={s.id}
                      name={s.name}
                      size={30}
                      className="ring-background ring-2"
                    />
                  ),
                )}
              </span>
              <span>{t("count", { count: sponsors.length })}</span>
            </div>
          </AnimateIn>
        )}
      </div>
    </section>
  );
}

import { Github } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AnimateIn } from "@/components/landing/AnimateIn";
import { Monogram } from "@/components/landing/Monogram";
import {
  GITHUB_REPO_URL,
  nextSponsorMilestone,
  SPONSOR_MILESTONE_MIN,
  sponsorPrimaryChannel,
} from "@/lib/sponsors";
import { getPublicSponsors } from "@/lib/sponsors-store";

export async function SponsorHero() {
  const t = await getTranslations("landing.sponsor.hero");
  const sponsors = await getPublicSponsors();
  const primary = sponsorPrimaryChannel();
  const count = sponsors.length;
  const preview = sponsors.slice(0, 6);

  // Once enough people have chipped in, a progress bar toward the next milestone
  // is more motivating than a plain count. Until then, keep the avatar cluster.
  const showMilestone = count >= SPONSOR_MILESTONE_MIN;
  const target = nextSponsorMilestone(count);
  const pct = Math.min(100, Math.round((count / target) * 100));

  const avatars = (
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
  );

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
          {/* The full pitch is too long for a phone screen — swap in a short
              version below `sm` instead of clamping mid-sentence. */}
          <p className="text-muted mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:hidden">
            {t("descriptionShort")}
          </p>
          <p className="text-muted mx-auto mt-6 hidden max-w-2xl text-base leading-relaxed sm:block md:text-lg">
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
        {count > 0 && (
          <AnimateIn delay={0.24}>
            {showMilestone ? (
              <div className="mt-10 w-full max-w-md">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2.5">
                    {avatars}
                    <span className="text-muted">{t("count", { count })}</span>
                  </span>
                  <span className="text-muted2">
                    {t("milestoneTarget", { target })}
                  </span>
                </div>
                <div className="bg-border mt-3 h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-foreground h-full rounded-full transition-[width] duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="border-border bg-card text-muted mt-9 inline-flex items-center gap-3 rounded-full border py-2 pr-5 pl-2.5 text-sm">
                {avatars}
                <span>{t("count", { count })}</span>
              </div>
            )}
          </AnimateIn>
        )}
      </div>
    </section>
  );
}

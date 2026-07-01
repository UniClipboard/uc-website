import { Plus, Sparkles, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AnimateIn } from "@/components/landing/AnimateIn";
import { Monogram } from "@/components/landing/Monogram";
import { type Sponsor, sponsorPrimaryChannel } from "@/lib/sponsors";
import { getPublicSponsors } from "@/lib/sponsors-store";

/**
 * Engraved / gilded memorial wall.
 *
 * Each sponsor is a "nameplate" — avatar + name (+ since/note) — laid out on a
 * dark slate panel. Gold sponsors get a gilded-foil name and an oversized
 * plate. When both gold and regular sponsors exist the wall splits into labelled
 * tiers; with only one tier it stays a single clean cluster. An empty wall
 * invites the first sponsor.
 */
function SponsorAvatar({ sponsor, size }: { sponsor: Sponsor; size: number }) {
  if (sponsor.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={sponsor.avatar}
        alt=""
        className="flex-none rounded-full object-cover ring-1 ring-white/10"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <Monogram
      name={sponsor.name}
      size={size}
      className="ring-1 ring-white/10"
    />
  );
}

function Nameplate({
  sponsor,
  sinceLabel,
  featured = false,
}: {
  sponsor: Sponsor;
  sinceLabel: string;
  featured?: boolean;
}) {
  const gold = sponsor.tier === "gold";
  const meta =
    sponsor.note ?? (sponsor.since ? `${sinceLabel} ${sponsor.since}` : null);

  const cls = [
    "group flex items-center rounded-full border transition-colors",
    featured ? "gap-3.5 py-2.5 pr-6 pl-2.5" : "gap-3 py-2 pr-5 pl-2",
    gold
      ? "border-amber-400/30 bg-amber-300/[0.06] hover:border-amber-400/55"
      : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]",
  ].join(" ");

  const inner = (
    <>
      <SponsorAvatar sponsor={sponsor} size={featured ? 52 : 40} />
      <span className="flex min-w-0 flex-col text-left">
        <span className="flex items-center gap-1.5">
          <span
            className={
              gold
                ? `uc-gild font-semibold tracking-tight ${featured ? "text-base" : "text-[15px]"}`
                : `truncate font-medium text-white/90 ${featured ? "text-base" : "text-[15px]"}`
            }
          >
            {sponsor.name}
          </span>
          {gold && (
            <Sparkles
              className="size-3.5 flex-none text-amber-300/90"
              aria-hidden
            />
          )}
        </span>
        {meta && (
          <span className="mt-0.5 truncate text-xs text-white/45">{meta}</span>
        )}
      </span>
    </>
  );

  return sponsor.url ? (
    <a
      href={sponsor.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={sponsor.name}
      className={cls}
    >
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function TierLabel({ children, gold }: { children: string; gold?: boolean }) {
  return (
    <div className="mb-5 flex items-center justify-center gap-3">
      <span className="h-px w-8 bg-white/15" />
      <span
        className={`font-mono text-[11px] tracking-[0.18em] uppercase ${
          gold ? "text-amber-300/70" : "text-white/45"
        }`}
      >
        {children}
      </span>
      <span className="h-px w-8 bg-white/15" />
    </div>
  );
}

export async function SponsorWall() {
  const t = await getTranslations("landing.sponsor.wall");
  const sponsors = await getPublicSponsors();
  const primary = sponsorPrimaryChannel();
  const sinceLabel = t("sinceLabel");
  const isEmpty = sponsors.length === 0;

  const golds = sponsors.filter((s) => s.tier === "gold");
  const regulars = sponsors.filter((s) => s.tier !== "gold");
  // Only label the tiers when there is a genuine split to show.
  const segmented = golds.length > 0 && regulars.length > 0;

  return (
    <section className="border-border bg-bg2/40 border-b py-[72px] md:py-[100px]">
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
          {!isEmpty && (
            <AnimateIn delay={0.16}>
              <div className="border-border bg-card text-muted mt-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm">
                <Users className="size-4" strokeWidth={1.8} />
                <span>{t("supporters", { count: sponsors.length })}</span>
              </div>
            </AnimateIn>
          )}
        </div>

        <AnimateIn delay={0.2}>
          <div className="mt-12 flex justify-center">
            <div
              className="relative inline-flex max-w-full overflow-hidden rounded-3xl border border-white/12 px-5 py-7 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_24px_60px_-24px_rgba(0,0,0,0.3)] md:px-9 md:py-9"
              style={{
                background: "linear-gradient(180deg,#17171b 0%,#0b0b0d 62%)",
              }}
            >
              {/* top sheen + soft overhead light */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 60% 45% at 50% 0%, rgba(255,255,255,0.07), transparent 70%)",
                }}
              />

              {isEmpty ? (
                <div className="relative flex max-w-sm flex-col items-center px-4 py-6 text-center">
                  <span className="mb-5 inline-flex size-12 items-center justify-center rounded-full bg-white/10 text-white/70">
                    <Plus className="size-6" />
                  </span>
                  <h3 className="uc-gild text-xl font-semibold tracking-tight">
                    {t("emptyTitle")}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">
                    {t("emptyDesc")}
                  </p>
                  {primary && (
                    <a
                      href={primary.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:border-white/35 hover:text-white"
                    >
                      <Plus className="size-4" />
                      {t("becomeTitle")}
                    </a>
                  )}
                </div>
              ) : (
                <div className="relative flex w-full flex-col gap-9">
                  {golds.length > 0 && (
                    <div>
                      {segmented && (
                        <TierLabel gold>{t("goldLabel")}</TierLabel>
                      )}
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        {golds.map((s) => (
                          <Nameplate
                            key={s.id}
                            sponsor={s}
                            sinceLabel={sinceLabel}
                            featured
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {regulars.length > 0 && (
                    <div>
                      {segmented && <TierLabel>{t("backerLabel")}</TierLabel>}
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        {regulars.map((s) => (
                          <Nameplate
                            key={s.id}
                            sponsor={s}
                            sinceLabel={sinceLabel}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}

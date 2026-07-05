import { Plus, Sparkles, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AnimateIn } from "@/components/landing/AnimateIn";
import { Monogram } from "@/components/landing/Monogram";
import { type Sponsor, sponsorPrimaryChannel } from "@/lib/sponsors";
import { getPublicSponsors } from "@/lib/sponsors-store";

/**
 * Danmaku sponsor wall.
 *
 * Sponsors float across the viewport as full-bleed marquee rows (bilibili
 * danmaku style, scrolling left→right). The animation is pure CSS
 * (`uc-marquee-track` in globals.css) so this stays a static server render;
 * hover/focus pauses the row so pills remain clickable, and reduced-motion
 * users see a static row. No tier segmentation — gold sponsors are simply
 * gilded in place, which keeps the wall warm and egalitarian.
 */

/** Pills per half-track needed to guarantee the loop fills wide viewports. */
const MIN_ITEMS_PER_HALF = 10;
/** Rough seconds each pill contributes to one loop — sets a calm pace. */
const SECONDS_PER_ITEM = 3.2;

function SponsorAvatar({ sponsor, size }: { sponsor: Sponsor; size: number }) {
  if (sponsor.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={sponsor.avatar}
        alt=""
        className="ring-border flex-none rounded-full object-cover ring-1"
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  return (
    <Monogram name={sponsor.name} size={size} className="ring-border ring-1" />
  );
}

function Nameplate({
  sponsor,
  sinceLabel,
}: {
  sponsor: Sponsor;
  sinceLabel: string;
}) {
  const gold = sponsor.tier === "gold";
  const meta =
    sponsor.note ?? (sponsor.since ? `${sinceLabel} ${sponsor.since}` : null);

  const cls = [
    "flex flex-none items-center gap-3 rounded-full border py-2 pr-5 pl-2 transition-colors",
    gold
      ? "border-amber-500/35 bg-amber-400/[0.08] hover:border-amber-500/60"
      : "border-border bg-card hover:border-foreground/30",
  ].join(" ");

  const inner = (
    <>
      <SponsorAvatar sponsor={sponsor} size={40} />
      <span className="flex flex-col text-left">
        <span className="flex items-center gap-1.5">
          <span
            className={
              gold
                ? "dark:uc-gild max-w-48 truncate text-[15px] font-semibold tracking-tight text-amber-700"
                : "text-foreground/90 max-w-48 truncate text-[15px] font-medium"
            }
          >
            {sponsor.name}
          </span>
          {gold && (
            <Sparkles
              className="size-3.5 flex-none text-amber-600/80 dark:text-amber-300/90"
              aria-hidden
            />
          )}
        </span>
        {meta && (
          <span className="text-muted mt-0.5 max-w-52 truncate text-xs">
            {meta}
          </span>
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

/** Dashed "you could be next" pill floated along with the sponsors. */
function JoinPlate({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="border-border text-muted hover:border-foreground/40 hover:text-foreground flex flex-none items-center gap-2.5 rounded-full border border-dashed py-2 pr-5 pl-3 transition-colors"
    >
      <span className="bg-bg2 text-muted inline-flex size-9 flex-none items-center justify-center rounded-full">
        <Plus className="size-4" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}

function MarqueeRow({
  children,
  copies,
  duration,
  delay,
}: {
  children: React.ReactNode;
  copies: number;
  duration: number;
  delay: number;
}) {
  // Two identical halves let the CSS loop slide exactly -50% seamlessly; each
  // half repeats the row enough times to outgrow the widest viewports.
  // Duplicated copies are aria-hidden AND inert so screen readers announce
  // each sponsor once and keyboard focus never lands on an off-screen clone.
  const half = (hidden: boolean) => (
    <div
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      className="flex items-center gap-3 pr-3 md:gap-4 md:pr-4"
    >
      {Array.from({ length: copies }, (_, i) => {
        const dup = !hidden && i > 0;
        return (
          <div
            key={i}
            aria-hidden={dup || undefined}
            inert={dup || undefined}
            className="flex items-center gap-3 md:gap-4"
          >
            {children}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="uc-marquee-fade w-full overflow-hidden">
      <div
        className="uc-marquee-track"
        style={{
          animationDuration: `${duration}s`,
          animationDelay: `-${delay}s`,
        }}
      >
        {half(false)}
        {half(true)}
      </div>
    </div>
  );
}

export async function SponsorWall() {
  const t = await getTranslations("landing.sponsor.wall");
  const sponsors = await getPublicSponsors();
  const primary = sponsorPrimaryChannel();
  const sinceLabel = t("sinceLabel");
  const isEmpty = sponsors.length === 0;

  // Two staggered rows once there are enough names; a single row before that.
  const twoRows = sponsors.length >= 6;
  const rows: Sponsor[][] = twoRows
    ? [
        sponsors.filter((_, i) => i % 2 === 0),
        sponsors.filter((_, i) => i % 2 === 1),
      ]
    : [sponsors];

  return (
    <section className="border-border bg-bg2/40 overflow-hidden border-b py-[72px] md:py-[100px]">
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
      </div>

      {isEmpty ? (
        <div className="landing-shell">
          <AnimateIn delay={0.2}>
            <div className="border-border bg-card mt-12 flex justify-center rounded-3xl border px-6 py-12">
              <div className="flex max-w-sm flex-col items-center text-center">
                <span className="bg-bg2 text-muted mb-5 inline-flex size-12 items-center justify-center rounded-full">
                  <Plus className="size-6" />
                </span>
                <h3 className="text-foreground text-xl font-semibold tracking-tight">
                  {t("emptyTitle")}
                </h3>
                <p className="text-muted mt-3 text-sm leading-relaxed">
                  {t("emptyDesc")}
                </p>
                {primary && (
                  <a
                    href={primary.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border text-foreground hover:bg-bg2 mt-7 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors"
                  >
                    <Plus className="size-4" />
                    {t("becomeTitle")}
                  </a>
                )}
              </div>
            </div>
          </AnimateIn>
        </div>
      ) : (
        <AnimateIn delay={0.2} variant="fade-in">
          <div className="uc-marquee mt-12 flex flex-col gap-3 md:mt-14 md:gap-4">
            {rows.map((row, rowIndex) => {
              const isLast = rowIndex === rows.length - 1;
              // The join pill rides along the last row.
              const itemCount = row.length + (isLast && primary ? 1 : 0);
              const copies = Math.max(
                1,
                Math.ceil(MIN_ITEMS_PER_HALF / itemCount),
              );
              const duration = Math.max(
                24,
                Math.round(itemCount * copies * SECONDS_PER_ITEM),
              );
              return (
                <MarqueeRow
                  key={rowIndex}
                  copies={copies}
                  // Slightly different speeds + a negative delay keep the rows
                  // from marching in lockstep.
                  duration={rowIndex % 2 === 0 ? duration : duration * 1.25}
                  delay={rowIndex * (duration / 3)}
                >
                  {row.map((s) => (
                    <Nameplate key={s.id} sponsor={s} sinceLabel={sinceLabel} />
                  ))}
                  {isLast && primary && (
                    <JoinPlate href={primary.href} label={t("becomeTitle")} />
                  )}
                </MarqueeRow>
              );
            })}
          </div>
        </AnimateIn>
      )}
    </section>
  );
}

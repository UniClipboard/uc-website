/**
 * Sponsor display shape + static config (channels, monogram fallback).
 *
 * This module is isomorphic — it is imported by both server and client
 * components, so it must NOT import any server-only code (DB, fs, sharp).
 * The live sponsor list is loaded from the database in
 * `src/lib/sponsors-store.ts` (server-only) and managed via the admin UI.
 */

export type SponsorTier = "gold" | "regular";

export type Sponsor = {
  /** Stable id (DB row id) — used as a React key. */
  id: string;
  /** Display name shown on the wall. */
  name: string;
  /** Optional link to their homepage / profile. */
  url?: string;
  /** Optional month they started sponsoring, e.g. "2026-01". */
  since?: string;
  /** Optional one-line shout-out shown under the name. */
  note?: string;
  /**
   * Optional avatar image URL. Resolves to the avatar-serving route for
   * uploaded images, or an external URL (e.g. GitHub CDN). When absent, the
   * wall falls back to a deterministic colour-tinted initials monogram.
   */
  avatar?: string;
  /** "gold" sponsors are highlighted and sorted to the front. */
  tier?: SponsorTier;
};

/**
 * Where the "Sponsor" buttons point. These are PLACEHOLDER links — replace the
 * hrefs with your real sponsorship pages. The first entry is used as the
 * primary call-to-action across the page.
 */
export type SponsorChannel = {
  id: "afdian" | "github" | "kofi";
  label: string;
  href: string;
};

export const SPONSOR_CHANNELS: SponsorChannel[] = [
  // 爱发电为目前唯一的收款渠道。GitHub Sponsors 暂未开通（未绑卡），
  // 待开通后在此追加 { id: "github", ... } 即可。
  { id: "afdian", label: "爱发电", href: "https://afdian.com/a/mkdir700" },
];

export const GITHUB_REPO_URL = "https://github.com/UniClipboard/UniClipboard";

export const sponsorPrimaryChannel = (): SponsorChannel | undefined =>
  SPONSOR_CHANNELS[0];

/**
 * Sponsor count at/above which the hero shows a milestone progress bar. Below
 * this, a near-empty bar ("1 of 10") reads as discouraging, so the hero shows a
 * simple avatar cluster instead. Raise/lower to taste as the wall grows.
 */
export const SPONSOR_MILESTONE_MIN = 8;

const SPONSOR_MILESTONES = [10, 25, 50, 100, 250, 500] as const;

/** The next milestone strictly above `count` (rounds up to 100s past the top). */
export function nextSponsorMilestone(count: number): number {
  return (
    SPONSOR_MILESTONES.find((m) => m > count) ??
    Math.ceil((count + 1) / 100) * 100
  );
}

/**
 * Deterministic monogram (initials + tint) for a sponsor without an avatar.
 * The tint backgrounds use low-alpha colours so they read well on both the
 * light (#fff) and dark (#161616) card surfaces.
 */
const MONOGRAM_TINTS = [
  "99,102,241", // indigo
  "16,185,129", // emerald
  "236,72,153", // pink
  "249,115,22", // orange
  "14,165,233", // sky
  "168,85,247", // purple
  "234,179,8", // amber
  "20,184,166", // teal
] as const;

export type Monogram = {
  initials: string;
  bg: string;
  fg: string;
};

export function monogramFor(name: string): Monogram {
  const trimmed = name.trim();
  const isLatin = /^[\x00-\x7F]+$/.test(trimmed);
  let initials: string;
  if (isLatin) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    initials =
      parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : trimmed.slice(0, 2).toUpperCase();
  } else {
    initials = trimmed.slice(0, 1);
  }

  let hash = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) | 0;
  }
  const rgb = MONOGRAM_TINTS[Math.abs(hash) % MONOGRAM_TINTS.length];

  return {
    initials,
    bg: `rgba(${rgb}, 0.14)`,
    fg: `rgb(${rgb})`,
  };
}

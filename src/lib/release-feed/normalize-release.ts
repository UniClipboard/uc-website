import {
  filterApprovedDownloads,
  isApprovedReleaseUrl,
} from "@/lib/release-feed/allowlist";
import type { StableReleaseFetchResult } from "@/lib/release-feed/fetch-stable-release";

const NOTES_UNAVAILABLE = "notes unavailable";
const RELEASE_TAG_URL_PREFIX =
  "https://github.com/UniClipboard/UniClipboard/releases/tag/v";

// `version` and `publishedAt` are null when the feed did not provide them.
// Callers must render that as "unknown", never as a version-shaped string.
export type StableReleaseViewModel = {
  status: "ok" | "degraded";
  version: string | null;
  publishedAt: string | null;
  notes: string[];
  downloads: Array<{ platform: string; url: string }>;
  fallbackReleaseUrl: string;
  blockedPlatforms: string[];
  degradedReason?: string;
};

export function normalizeStableRelease(
  input: StableReleaseFetchResult,
): StableReleaseViewModel {
  if (input.status === "degraded") {
    return {
      status: "degraded",
      version: null,
      publishedAt: null,
      notes: [NOTES_UNAVAILABLE],
      downloads: [],
      fallbackReleaseUrl: input.fallbackReleaseUrl,
      blockedPlatforms: [],
      degradedReason: input.reason,
    };
  }

  const { approved, blocked } = filterApprovedDownloads(
    input.payload.downloads,
  );
  const releaseUrl = input.payload.metadata.releaseUrl;
  const notes = input.payload.metadata.notes;
  const normalizedNotes = Array.isArray(notes)
    ? notes
    : typeof notes === "string" && notes.length > 0
      ? [notes]
      : [NOTES_UNAVAILABLE];

  const version = input.payload.metadata.version;
  // Without an explicit releaseUrl, point at the GitHub release whose tag
  // matches the feed version (tags are `v<version>`), so the page never links
  // a different "latest" than the version it shows.
  const fallbackReleaseUrl =
    typeof releaseUrl === "string" && isApprovedReleaseUrl(releaseUrl)
      ? releaseUrl
      : `${RELEASE_TAG_URL_PREFIX}${encodeURIComponent(version)}`;

  const isDegraded = blocked.length > 0 || approved.length === 0;

  return {
    status: isDegraded ? "degraded" : "ok",
    version,
    publishedAt: input.payload.metadata.publishedAt || null,
    notes: normalizedNotes,
    downloads: approved,
    fallbackReleaseUrl,
    blockedPlatforms: blocked.map((item) => item.platform),
    degradedReason: isDegraded ? "unsafe-links-filtered" : undefined,
  };
}

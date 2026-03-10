import {
  filterApprovedDownloads,
  isApprovedReleaseUrl,
} from "@/lib/release-feed/allowlist";
import {
  FALLBACK_RELEASE_URL,
  type StableReleaseFetchResult,
} from "@/lib/release-feed/fetch-stable-release";

const METADATA_UNAVAILABLE = "unavailable";
const NOTES_UNAVAILABLE = "notes unavailable";

export type StableReleaseViewModel = {
  status: "ok" | "degraded";
  version: string;
  publishedAt: string;
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
      version: METADATA_UNAVAILABLE,
      publishedAt: METADATA_UNAVAILABLE,
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

  const fallbackReleaseUrl =
    typeof releaseUrl === "string" && isApprovedReleaseUrl(releaseUrl)
      ? releaseUrl
      : FALLBACK_RELEASE_URL;

  const isDegraded = blocked.length > 0 || approved.length === 0;

  return {
    status: isDegraded ? "degraded" : "ok",
    version: input.payload.metadata.version || METADATA_UNAVAILABLE,
    publishedAt: input.payload.metadata.publishedAt || METADATA_UNAVAILABLE,
    notes: normalizedNotes,
    downloads: approved,
    fallbackReleaseUrl,
    blockedPlatforms: blocked.map((item) => item.platform),
    degradedReason: isDegraded ? "unsafe-links-filtered" : undefined,
  };
}

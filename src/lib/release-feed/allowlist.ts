import type { StableReleasePayload } from "@/lib/release-feed/schema";

export const APPROVED_RELEASE_HOSTS = new Set([
  "release.uniclipboard.app",
  "github.com",
  "objects.githubusercontent.com",
  "release-assets.githubusercontent.com",
]);

export type ApprovedDownload = {
  platform: string;
  url: string;
};

export type FilteredDownloads = {
  approved: ApprovedDownload[];
  blocked: ApprovedDownload[];
};

export function isApprovedReleaseUrl(candidate: string): boolean {
  try {
    const parsed = new URL(candidate);
    return (
      parsed.protocol === "https:" &&
      APPROVED_RELEASE_HOSTS.has(parsed.hostname)
    );
  } catch {
    return false;
  }
}

export function filterApprovedDownloads(
  downloads: StableReleasePayload["downloads"],
): FilteredDownloads {
  return Object.entries(downloads).reduce<FilteredDownloads>(
    (accumulator, [platform, entry]) => {
      const url = typeof entry === "string" ? entry : entry.url;
      const item = { platform, url };

      if (isApprovedReleaseUrl(url)) {
        accumulator.approved.push(item);
      } else {
        accumulator.blocked.push(item);
      }
      return accumulator;
    },
    { approved: [], blocked: [] },
  );
}

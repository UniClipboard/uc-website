import { z } from "zod";

const stableMetadataSchema = z
  .object({
    version: z.string().min(1),
    publishedAt: z.string().optional(),
    releaseUrl: z.string().url().optional(),
    notes: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .strict();

const stableDownloadEntrySchema = z.union([
  z.string().url(),
  z
    .object({
      url: z.string().url(),
      checksum: z.string().optional(),
    })
    .strict(),
]);

const stableDownloadsSchema = z.record(
  z.string().min(1),
  stableDownloadEntrySchema,
);

export const stableReleasePayloadSchema = z
  .object({
    metadata: stableMetadataSchema,
    downloads: stableDownloadsSchema,
  })
  .strict();

const upstreamPlatformEntrySchema = z
  .object({
    url: z.string().url(),
    signature: z.string().optional(),
  })
  .strict();

const upstreamStableReleasePayloadSchema = z
  .object({
    version: z.string().min(1),
    pub_date: z.string().min(1).optional(),
    notes: z.union([z.string(), z.array(z.string())]).optional(),
    platforms: z.record(z.string().min(1), upstreamPlatformEntrySchema),
  })
  .strict();

export type StableReleasePayload = z.infer<typeof stableReleasePayloadSchema>;

export type StableFeedParseFailure = {
  code: "INVALID_STABLE_FEED";
  message: string;
  issues: string[];
};

export type ParseStableFeedResult =
  | { ok: true; data: StableReleasePayload }
  | { ok: false; error: StableFeedParseFailure };

function normalizeUpstreamPlatformLabel(platform: string): string {
  switch (platform) {
    case "darwin-aarch64":
      return "macOS ARM64";
    case "darwin-x86_64":
      return "macOS x86_64";
    case "windows-x86_64":
      return "Windows x86_64";
    case "windows-aarch64":
      return "Windows ARM64";
    case "linux-x86_64":
      return "Linux x86_64";
    case "linux-aarch64":
      return "Linux ARM64";
    default:
      return platform;
  }
}

// Upstream stable.json points macOS at the Tauri auto-updater bundle
// (UniClipboard_<arch>-apple-darwin.app.tar.gz). For end-user downloads on the
// website we want the .dmg sibling published alongside it
// (UniClipboard_<version>_<arch>.dmg).
function preferMacosDmgUrl(url: string, version: string): string {
  const aarch64Suffix = "UniClipboard_aarch64-apple-darwin.app.tar.gz";
  const x86Suffix = "UniClipboard_x86_64-apple-darwin.app.tar.gz";
  if (url.endsWith(aarch64Suffix)) {
    return (
      url.slice(0, -aarch64Suffix.length) +
      `UniClipboard_${version}_aarch64.dmg`
    );
  }
  if (url.endsWith(x86Suffix)) {
    return url.slice(0, -x86Suffix.length) + `UniClipboard_${version}_x64.dmg`;
  }
  return url;
}

function rewriteMacosDownloadsToDmg(
  downloads: Record<string, string | { url: string; checksum?: string }>,
  version: string,
): Record<string, string | { url: string; checksum?: string }> {
  return Object.fromEntries(
    Object.entries(downloads).map(([platform, entry]) => {
      if (!platform.startsWith("macOS")) return [platform, entry];
      if (typeof entry === "string") {
        return [platform, preferMacosDmgUrl(entry, version)];
      }
      return [
        platform,
        { ...entry, url: preferMacosDmgUrl(entry.url, version) },
      ];
    }),
  );
}

export function parseStableReleasePayload(
  input: unknown,
): ParseStableFeedResult {
  const parsed = stableReleasePayloadSchema.safeParse(input);

  if (parsed.success) {
    return {
      ok: true,
      data: {
        ...parsed.data,
        downloads: rewriteMacosDownloadsToDmg(
          parsed.data.downloads,
          parsed.data.metadata.version,
        ),
      },
    };
  }

  const upstreamParsed = upstreamStableReleasePayloadSchema.safeParse(input);
  if (upstreamParsed.success) {
    const version = upstreamParsed.data.version;
    return {
      ok: true,
      data: {
        metadata: {
          version,
          publishedAt: upstreamParsed.data.pub_date,
          notes: upstreamParsed.data.notes,
        },
        downloads: Object.fromEntries(
          Object.entries(upstreamParsed.data.platforms).map(
            ([platform, entry]) => {
              const label = normalizeUpstreamPlatformLabel(platform);
              const url = label.startsWith("macOS")
                ? preferMacosDmgUrl(entry.url, version)
                : entry.url;
              return [label, url];
            },
          ),
        ),
      },
    };
  }

  return {
    ok: false,
    error: {
      code: "INVALID_STABLE_FEED",
      message: "stable.json payload failed schema validation",
      issues: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`,
      ),
    },
  };
}

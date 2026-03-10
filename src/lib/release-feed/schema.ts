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

export type StableReleasePayload = z.infer<typeof stableReleasePayloadSchema>;

export type StableFeedParseFailure = {
  code: "INVALID_STABLE_FEED";
  message: string;
  issues: string[];
};

export type ParseStableFeedResult =
  | { ok: true; data: StableReleasePayload }
  | { ok: false; error: StableFeedParseFailure };

export function parseStableReleasePayload(
  input: unknown,
): ParseStableFeedResult {
  const parsed = stableReleasePayloadSchema.safeParse(input);

  if (parsed.success) {
    return { ok: true, data: parsed.data };
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

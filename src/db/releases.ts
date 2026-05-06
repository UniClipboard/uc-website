import { desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { RELEASES_CACHE_TAG } from "@/lib/changelog-sync";

import { db } from "./client";
import { releases } from "./schema";

export type ReleaseRecord = {
  id: string;
  version: string;
  pubDate: Date;
  notesEn: string;
  notesZh: string;
  platforms: Record<string, { url: string; signature?: string }>;
  createdAt: Date;
  updatedAt: Date;
};

const PLATFORM_LABEL: Record<string, string> = {
  "darwin-aarch64": "macOS (Apple Silicon)",
  "darwin-x86_64": "macOS (Intel)",
  "windows-x86_64": "Windows",
  "linux-x86_64": "Linux (AppImage)",
};

export function platformLabel(key: string): string {
  return PLATFORM_LABEL[key] ?? key;
}

const platformsAsRecord = (
  value: unknown,
): Record<string, { url: string; signature?: string }> => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, { url: string; signature?: string }>;
  }
  return {};
};

// `unstable_cache` JSON-serializes the value, which collapses Date instances
// to ISO strings. The fetch* helpers return that "wire" shape; the public
// helpers below re-hydrate dates so callers always see Date objects.
type ReleaseRecordWire = Omit<
  ReleaseRecord,
  "pubDate" | "createdAt" | "updatedAt"
> & {
  pubDate: string;
  createdAt: string;
  updatedAt: string;
};

const toWire = (row: typeof releases.$inferSelect): ReleaseRecordWire => ({
  id: row.id,
  version: row.version,
  pubDate: row.pubDate.toISOString(),
  notesEn: row.notesEn,
  notesZh: row.notesZh,
  platforms: platformsAsRecord(row.platforms),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const hydrate = (wire: ReleaseRecordWire): ReleaseRecord => ({
  ...wire,
  pubDate: new Date(wire.pubDate),
  createdAt: new Date(wire.createdAt),
  updatedAt: new Date(wire.updatedAt),
});

const fetchAllReleasesCached = unstable_cache(
  async (): Promise<ReleaseRecordWire[]> => {
    const rows = await db
      .select()
      .from(releases)
      .orderBy(desc(releases.pubDate));
    return rows.map(toWire);
  },
  ["releases-all"],
  { tags: [RELEASES_CACHE_TAG] },
);

const fetchReleaseByVersionCached = (version: string) =>
  unstable_cache(
    async (): Promise<ReleaseRecordWire | null> => {
      const rows = await db
        .select()
        .from(releases)
        .where(eq(releases.version, version))
        .limit(1);
      const row = rows[0];
      return row ? toWire(row) : null;
    },
    ["release-by-version", version],
    { tags: [RELEASES_CACHE_TAG] },
  )();

export const getAllReleases = async (): Promise<ReleaseRecord[]> => {
  const wire = await fetchAllReleasesCached();
  return wire.map(hydrate);
};

export const getReleaseByVersion = async (
  version: string,
): Promise<ReleaseRecord | null> => {
  const wire = await fetchReleaseByVersionCached(version);
  return wire ? hydrate(wire) : null;
};

const fetchAllReleaseVersionsCached = unstable_cache(
  async () => {
    const rows = await db
      .select({ version: releases.version, updatedAt: releases.updatedAt })
      .from(releases)
      .orderBy(desc(releases.pubDate));
    return rows.map((r) => ({
      version: r.version,
      updatedAt: r.updatedAt.toISOString(),
    }));
  },
  ["releases-versions"],
  { tags: [RELEASES_CACHE_TAG] },
);

export const getAllReleaseVersions = async (): Promise<
  { version: string; updatedAt: Date }[]
> => {
  const wire = await fetchAllReleaseVersionsCached();
  return wire.map((r) => ({
    version: r.version,
    updatedAt: new Date(r.updatedAt),
  }));
};

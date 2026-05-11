import "server-only";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { db } from "@/db/client";
import { releases } from "@/db/schema";

import { type ParsedRelease, parseStableJson } from "./changelog-parser";

export const STABLE_JSON_URL = "https://release.uniclipboard.app/stable.json";
export const RELEASES_CACHE_TAG = "changelog";

export type SyncResult =
  | { status: "inserted"; version: string }
  | { status: "updated"; version: string }
  | { status: "unchanged"; version: string }
  | { status: "skipped"; reason: string };

async function fetchStableJson(signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(STABLE_JSON_URL, {
    signal,
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`stable.json HTTP ${res.status}`);
  }
  return res.json();
}

async function upsertRelease(parsed: ParsedRelease): Promise<SyncResult> {
  const existing = await db
    .select({
      id: releases.id,
      notesEn: releases.notesEn,
      notesZh: releases.notesZh,
      pubDate: releases.pubDate,
      manualOverride: releases.manualOverride,
    })
    .from(releases)
    .where(eq(releases.version, parsed.version))
    .limit(1);

  const row = existing[0];
  const fullPayload = {
    version: parsed.version,
    pubDate: parsed.pubDate,
    notesEn: parsed.notesEn,
    notesZh: parsed.notesZh,
    platforms: parsed.platforms,
    rawPayload: parsed.raw,
  };

  if (!row) {
    await db.insert(releases).values(fullPayload);
    return { status: "inserted", version: parsed.version };
  }

  // Admin-edited notes win: never overwrite them via sync. Platforms,
  // pub_date, and raw payload still refresh so download links stay current.
  const writable = row.manualOverride
    ? {
        version: parsed.version,
        pubDate: parsed.pubDate,
        platforms: parsed.platforms,
        rawPayload: parsed.raw,
      }
    : fullPayload;

  const notesUnchanged = row.manualOverride
    ? true
    : row.notesEn === parsed.notesEn && row.notesZh === parsed.notesZh;
  const pubDateUnchanged = row.pubDate.getTime() === parsed.pubDate.getTime();

  if (notesUnchanged && pubDateUnchanged) {
    return { status: "unchanged", version: parsed.version };
  }

  await db
    .update(releases)
    .set({ ...writable, updatedAt: new Date() })
    .where(eq(releases.id, row.id));
  return { status: "updated", version: parsed.version };
}

export async function syncLatestRelease(
  signal?: AbortSignal,
): Promise<SyncResult> {
  let raw: unknown;
  try {
    raw = await fetchStableJson(signal);
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "fetch stable.json failed";
    return { status: "skipped", reason };
  }

  let parsed: ParsedRelease;
  try {
    parsed = parseStableJson(raw);
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "parse stable.json failed";
    return { status: "skipped", reason };
  }

  const result = await upsertRelease(parsed);
  if (result.status === "inserted" || result.status === "updated") {
    revalidateTag(RELEASES_CACHE_TAG);
  }
  return result;
}

export function syncLatestReleaseSafe(): Promise<SyncResult> {
  return syncLatestRelease().catch((error) => ({
    status: "skipped" as const,
    reason: error instanceof Error ? error.message : "unknown error",
  }));
}

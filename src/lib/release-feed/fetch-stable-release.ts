import {
  parseStableReleasePayload,
  type StableFeedParseFailure,
  type StableReleasePayload,
} from "@/lib/release-feed/schema";

export const STABLE_RELEASE_FEED_URL =
  "https://release.uniclipboard.app/stable.json";
export const STABLE_RELEASE_REVALIDATE_SECONDS = 60 * 60;
export const STABLE_RELEASE_TIMEOUT_MS = 5000;
export const FALLBACK_RELEASE_URL =
  "https://github.com/uniclipboard/uniclipboard/releases/latest";

type StableReleaseFailureReason =
  | "network-error"
  | "timeout"
  | "http-error"
  | "invalid-json"
  | "schema-error";

export type StableReleaseFetchFailure = {
  status: "degraded";
  reason: StableReleaseFailureReason;
  fallbackReleaseUrl: string;
  metadata: {
    sourceUrl: string;
    fetchedAt: string;
    revalidateSeconds: number;
    httpStatus?: number;
    parseFailure?: StableFeedParseFailure;
  };
};

export type StableReleaseFetchSuccess = {
  status: "ok";
  payload: StableReleasePayload;
  metadata: {
    sourceUrl: string;
    fetchedAt: string;
    revalidateSeconds: number;
  };
};

export type StableReleaseFetchResult =
  | StableReleaseFetchSuccess
  | StableReleaseFetchFailure;

export async function fetchStableRelease(): Promise<StableReleaseFetchResult> {
  const fetchedAt = new Date().toISOString();
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    STABLE_RELEASE_TIMEOUT_MS,
  );

  try {
    const response = await fetch(STABLE_RELEASE_FEED_URL, {
      signal: timeoutController.signal,
      cache: "force-cache",
      next: { revalidate: STABLE_RELEASE_REVALIDATE_SECONDS },
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return {
        status: "degraded",
        reason: "http-error",
        fallbackReleaseUrl: FALLBACK_RELEASE_URL,
        metadata: {
          sourceUrl: STABLE_RELEASE_FEED_URL,
          fetchedAt,
          revalidateSeconds: STABLE_RELEASE_REVALIDATE_SECONDS,
          httpStatus: response.status,
        },
      };
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return {
        status: "degraded",
        reason: "invalid-json",
        fallbackReleaseUrl: FALLBACK_RELEASE_URL,
        metadata: {
          sourceUrl: STABLE_RELEASE_FEED_URL,
          fetchedAt,
          revalidateSeconds: STABLE_RELEASE_REVALIDATE_SECONDS,
        },
      };
    }

    const parsed = parseStableReleasePayload(body);
    if (!parsed.ok) {
      return {
        status: "degraded",
        reason: "schema-error",
        fallbackReleaseUrl: FALLBACK_RELEASE_URL,
        metadata: {
          sourceUrl: STABLE_RELEASE_FEED_URL,
          fetchedAt,
          revalidateSeconds: STABLE_RELEASE_REVALIDATE_SECONDS,
          parseFailure: parsed.error,
        },
      };
    }

    return {
      status: "ok",
      payload: parsed.data,
      metadata: {
        sourceUrl: STABLE_RELEASE_FEED_URL,
        fetchedAt,
        revalidateSeconds: STABLE_RELEASE_REVALIDATE_SECONDS,
      },
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return {
      status: "degraded",
      reason: timedOut ? "timeout" : "network-error",
      fallbackReleaseUrl: FALLBACK_RELEASE_URL,
      metadata: {
        sourceUrl: STABLE_RELEASE_FEED_URL,
        fetchedAt,
        revalidateSeconds: STABLE_RELEASE_REVALIDATE_SECONDS,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

import {
  FALLBACK_RELEASE_URL,
  fetchStableRelease,
  STABLE_RELEASE_FEED_URL,
  STABLE_RELEASE_REVALIDATE_SECONDS,
} from "@/lib/release-feed/fetch-stable-release";
import { parseStableReleasePayload } from "@/lib/release-feed/schema";

describe("release feed schema", () => {
  it("accepts a valid stable feed payload", () => {
    const result = parseStableReleasePayload({
      metadata: {
        version: "0.2.1",
        publishedAt: "2026-03-09T00:00:00.000Z",
        releaseUrl:
          "https://github.com/uniclipboard/uniclipboard/releases/tag/v0.2.1",
        notes: ["Fixes", "Perf"],
      },
      downloads: {
        linux:
          "https://release.uniclipboard.app/downloads/uniclipboard-linux.AppImage",
      },
    });

    expect(result.ok).toBe(true);
  });

  it("rejects malformed payloads with structured parse metadata", () => {
    const result = parseStableReleasePayload({
      metadata: {
        publishedAt: "not-a-date",
      },
      downloads: {},
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected schema parse to fail");
    }
    expect(result.error.code).toBe("INVALID_STABLE_FEED");
    expect(result.error.issues.length).toBeGreaterThan(0);
  });
});

describe("release feed cache", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("fetches stable feed with explicit revalidation policy", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        metadata: {
          version: "0.2.1",
        },
        downloads: {
          linux:
            "https://release.uniclipboard.app/downloads/uniclipboard-linux.AppImage",
        },
      }),
    } as Response);

    const result = await fetchStableRelease();
    expect(result.status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledWith(
      STABLE_RELEASE_FEED_URL,
      expect.objectContaining({
        cache: "force-cache",
        next: { revalidate: STABLE_RELEASE_REVALIDATE_SECONDS },
      }),
    );
  });

  it("maps request failures into degraded status without throwing", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockRejectedValue(new Error("socket closed"));

    await expect(fetchStableRelease()).resolves.toEqual(
      expect.objectContaining({
        status: "degraded",
        reason: "network-error",
        fallbackReleaseUrl: FALLBACK_RELEASE_URL,
      }),
    );
  });
});

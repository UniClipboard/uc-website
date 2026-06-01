import {
  FALLBACK_RELEASE_URL,
  fetchStableRelease,
  STABLE_RELEASE_FEED_URL,
  STABLE_RELEASE_REVALIDATE_SECONDS,
  type StableReleaseFetchResult,
} from "@/lib/release-feed/fetch-stable-release";
import { normalizeStableRelease } from "@/lib/release-feed/normalize-release";
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

  it("accepts the current upstream stable feed payload shape", () => {
    const result = parseStableReleasePayload({
      version: "0.2.3",
      notes: "Release notes",
      pub_date: "2026-03-11T06:28:09Z",
      platforms: {
        "linux-x86_64": {
          signature: "abc",
          url: "https://release.uniclipboard.app/artifacts/v0.2.3/UniClipboard_0.2.3_amd64.AppImage",
        },
        "windows-x86_64": {
          signature: "def",
          url: "https://release.uniclipboard.app/artifacts/v0.2.3/UniClipboard_0.2.3_x64-setup.exe",
        },
        "darwin-aarch64": {
          signature: "ghi",
          url: "https://release.uniclipboard.app/artifacts/v0.2.3/UniClipboard_aarch64-apple-darwin.app.tar.gz",
        },
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected upstream schema parse to succeed");
    }
    expect(result.data).toEqual({
      metadata: {
        version: "0.2.3",
        publishedAt: "2026-03-11T06:28:09Z",
        notes: "Release notes",
      },
      downloads: {
        "Linux x86_64":
          "https://release.uniclipboard.app/artifacts/v0.2.3/UniClipboard_0.2.3_amd64.AppImage",
        "Windows x86_64":
          "https://release.uniclipboard.app/artifacts/v0.2.3/UniClipboard_0.2.3_x64-setup.exe",
        "macOS ARM64":
          "https://release.uniclipboard.app/artifacts/v0.2.3/UniClipboard_0.2.3_aarch64.dmg",
      },
    });
  });

  it("rewrites macOS .app.tar.gz urls to the dmg sibling for both arches", () => {
    const result = parseStableReleasePayload({
      version: "0.6.0",
      pub_date: "2026-05-02T17:35:00Z",
      platforms: {
        "darwin-aarch64": {
          url: "https://release.uniclipboard.app/artifacts/v0.6.0/UniClipboard_aarch64-apple-darwin.app.tar.gz",
        },
        "darwin-x86_64": {
          url: "https://release.uniclipboard.app/artifacts/v0.6.0/UniClipboard_x86_64-apple-darwin.app.tar.gz",
        },
      },
    });

    if (!result.ok) {
      throw new Error("Expected upstream schema parse to succeed");
    }
    expect(result.data.downloads).toEqual({
      "macOS ARM64":
        "https://release.uniclipboard.app/artifacts/v0.6.0/UniClipboard_0.6.0_aarch64.dmg",
      "macOS x86_64":
        "https://release.uniclipboard.app/artifacts/v0.6.0/UniClipboard_0.6.0_x64.dmg",
    });
  });

  it("leaves non-tarball macOS urls untouched", () => {
    const result = parseStableReleasePayload({
      metadata: { version: "0.6.0" },
      downloads: {
        "macOS ARM64":
          "https://release.uniclipboard.app/artifacts/v0.6.0/UniClipboard_0.6.0_aarch64.dmg",
      },
    });

    if (!result.ok) {
      throw new Error("Expected schema parse to succeed");
    }
    expect(result.data.downloads).toEqual({
      "macOS ARM64":
        "https://release.uniclipboard.app/artifacts/v0.6.0/UniClipboard_0.6.0_aarch64.dmg",
    });
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
    expect(result.error.issues).toEqual(
      expect.arrayContaining([expect.stringContaining("metadata.version")]),
    );
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
        metadata: expect.objectContaining({
          sourceUrl: STABLE_RELEASE_FEED_URL,
          revalidateSeconds: STABLE_RELEASE_REVALIDATE_SECONDS,
        }),
      }),
    );
  });

  it("maps http failures into degraded status with response code", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    await expect(fetchStableRelease()).resolves.toEqual(
      expect.objectContaining({
        status: "degraded",
        reason: "http-error",
        fallbackReleaseUrl: FALLBACK_RELEASE_URL,
        metadata: expect.objectContaining({
          httpStatus: 503,
        }),
      }),
    );
  });
});

describe("release feed host filtering", () => {
  it("drops disallowed hosts while preserving approved links", () => {
    const result: StableReleaseFetchResult = {
      status: "ok",
      metadata: {
        sourceUrl: STABLE_RELEASE_FEED_URL,
        fetchedAt: "2026-03-10T00:00:00.000Z",
        revalidateSeconds: STABLE_RELEASE_REVALIDATE_SECONDS,
      },
      payload: {
        metadata: {
          version: "0.2.1",
          releaseUrl:
            "https://github.com/uniclipboard/uniclipboard/releases/latest",
        },
        downloads: {
          linux:
            "https://release.uniclipboard.app/downloads/uniclipboard-linux.AppImage",
          malware: "https://evil.example.com/payload.exe",
        },
      },
    };

    const normalized = normalizeStableRelease(result);

    expect(normalized.downloads).toEqual([
      {
        platform: "linux",
        url: "https://release.uniclipboard.app/downloads/uniclipboard-linux.AppImage",
      },
    ]);
    expect(normalized.blockedPlatforms).toEqual(["malware"]);
    expect(normalized.status).toBe("degraded");
    expect(normalized.degradedReason).toBe("unsafe-links-filtered");
  });

  it("keeps ok status when all download hosts are approved", () => {
    const result: StableReleaseFetchResult = {
      status: "ok",
      metadata: {
        sourceUrl: STABLE_RELEASE_FEED_URL,
        fetchedAt: "2026-03-10T00:00:00.000Z",
        revalidateSeconds: STABLE_RELEASE_REVALIDATE_SECONDS,
      },
      payload: {
        metadata: {
          version: "0.2.1",
          releaseUrl:
            "https://github.com/uniclipboard/uniclipboard/releases/latest",
        },
        downloads: {
          windows:
            "https://release.uniclipboard.app/downloads/uniclipboard-windows.exe",
        },
      },
    };

    const normalized = normalizeStableRelease(result);
    expect(normalized.status).toBe("ok");
    expect(normalized.downloads).toHaveLength(1);
  });

  it("normalizes current upstream platform labels into downloadable entries", () => {
    const parsed = parseStableReleasePayload({
      version: "0.2.3",
      pub_date: "2026-03-11T06:28:09Z",
      platforms: {
        "linux-x86_64": {
          url: "https://release.uniclipboard.app/artifacts/v0.2.3/UniClipboard_0.2.3_amd64.AppImage",
        },
        "windows-x86_64": {
          url: "https://release.uniclipboard.app/artifacts/v0.2.3/UniClipboard_0.2.3_x64-setup.exe",
        },
        "windows-aarch64": {
          url: "https://release.uniclipboard.app/artifacts/v0.2.3/UniClipboard_0.2.3_arm64-setup.exe",
        },
        "darwin-aarch64": {
          url: "https://release.uniclipboard.app/artifacts/v0.2.3/UniClipboard_aarch64-apple-darwin.app.tar.gz",
        },
      },
    });

    if (!parsed.ok) {
      throw new Error("Expected upstream schema parse to succeed");
    }

    const normalized = normalizeStableRelease({
      status: "ok",
      metadata: {
        sourceUrl: STABLE_RELEASE_FEED_URL,
        fetchedAt: "2026-03-11T11:30:21.000Z",
        revalidateSeconds: STABLE_RELEASE_REVALIDATE_SECONDS,
      },
      payload: parsed.data,
    });

    expect(normalized.status).toBe("ok");
    expect(normalized.version).toBe("0.2.3");
    expect(normalized.publishedAt).toBe("2026-03-11T06:28:09Z");
    expect(normalized.downloads).toEqual([
      {
        platform: "Linux x86_64",
        url: "https://release.uniclipboard.app/artifacts/v0.2.3/UniClipboard_0.2.3_amd64.AppImage",
      },
      {
        platform: "Windows x86_64",
        url: "https://release.uniclipboard.app/artifacts/v0.2.3/UniClipboard_0.2.3_x64-setup.exe",
      },
      {
        platform: "Windows ARM64",
        url: "https://release.uniclipboard.app/artifacts/v0.2.3/UniClipboard_0.2.3_arm64-setup.exe",
      },
      {
        platform: "macOS ARM64",
        url: "https://release.uniclipboard.app/artifacts/v0.2.3/UniClipboard_0.2.3_aarch64.dmg",
      },
    ]);
  });
});

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

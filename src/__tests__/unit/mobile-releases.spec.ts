import {
  buildMobileGroups,
  getAndroidPrimaryDownloadUrl,
  getAndroidRelease,
  type MobileGroupLabels,
} from "@/lib/mobile-releases";

const RELEASE_HOST = "https://release.uniclipboard.app";
const MANIFEST_URL = `${RELEASE_HOST}/android/stable.json`;

const manifest = (overrides: Record<string, unknown> = {}) => ({
  version: "2.0.0.186",
  tagName: "v2.0.0.186",
  prerelease: false,
  pub_date: "2026-09-28T14:28:03.501Z",
  notes: { en: "Notes", zh: "说明" },
  assets: [
    {
      name: "UniClip-2.0.0-arm64-v8a.apk",
      sha256:
        "5e3251e5d87b227328388ba1898e9842d45598c0413bd32fb2e2b0f1f0d619c6",
    },
  ],
  confirmation_required: false,
  confirmation_description: null,
  ...overrides,
});

function respondWith(
  body: unknown,
  init: { ok?: boolean; status?: number } = {},
) {
  const fetchMock = jest.fn(async () => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  }));
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("getAndroidRelease", () => {
  const original = global.fetch;
  afterEach(() => {
    global.fetch = original;
    jest.restoreAllMocks();
  });

  it("builds every download link on the release host from the stable channel manifest", async () => {
    const fetchMock = respondWith(manifest());
    const release = await getAndroidRelease();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calls = fetchMock.mock.calls as unknown as unknown[][];
    expect(calls[0]?.[0]).toBe(MANIFEST_URL);
    expect(release.version).toBe("2.0.0.186");
    expect(release.items).toEqual([
      {
        arch: "arm64-v8a",
        url: `${RELEASE_HOST}/android/artifacts/v2.0.0.186/UniClip-2.0.0-arm64-v8a.apk`,
        recommended: true,
      },
    ]);
  });

  it("never links a download to GitHub or any other host", async () => {
    respondWith(
      manifest({
        assets: [
          { name: "UniClip-2.0.0-arm64-v8a.apk" },
          { name: "UniClip-2.0.0-armeabi-v7a.apk" },
          { name: "UniClip-2.0.0-x86_64.apk" },
          { name: "UniClip-2.0.0-universal.apk" },
        ],
      }),
    );
    const release = await getAndroidRelease();
    expect(release.items.map((item) => item.arch)).toEqual([
      "arm64-v8a",
      "armeabi-v7a",
      "x86_64",
      "universal",
    ]);
    for (const item of release.items) {
      expect(item.url.startsWith(`${RELEASE_HOST}/android/artifacts/`)).toBe(
        true,
      );
      expect(item.url).not.toContain("github.com");
    }
    expect(release.items.filter((item) => item.recommended)).toHaveLength(1);
  });

  it("ignores assets that are not APKs and keeps the release page link on the tag", async () => {
    respondWith(
      manifest({
        assets: [
          { name: "UniClip-2.0.0-arm64-v8a.apk" },
          { name: "notes.txt" },
          { name: "UniClip-2.0.0-arm64-v8a.apk.sha256" },
        ],
      }),
    );
    const release = await getAndroidRelease();
    expect(release.items).toHaveLength(1);
    expect(release.releasePageUrl).toBe(
      "https://github.com/UniClipboard/UniClip/releases/tag/v2.0.0.186",
    );
  });

  it("asks the data cache to revalidate hourly", async () => {
    const fetchMock = respondWith(manifest());
    await getAndroidRelease();
    const calls = fetchMock.mock.calls as unknown as unknown[][];
    expect(calls[0]?.[1]).toMatchObject({ next: { revalidate: 3600 } });
  });

  it("falls back to a link on the release host when the manifest cannot be used", async () => {
    const failures: Array<() => void> = [
      () => respondWith({}, { ok: false, status: 503 }),
      () => respondWith({ unexpected: true }),
      () => respondWith(manifest({ assets: [] })),
      () => respondWith(manifest({ assets: [{ name: "readme.txt" }] })),
      () => {
        global.fetch = jest.fn(async () => {
          throw new Error("network down");
        }) as unknown as typeof fetch;
      },
    ];
    for (const arrange of failures) {
      arrange();
      const release = await getAndroidRelease();
      expect(release.items.length).toBeGreaterThan(0);
      for (const item of release.items) {
        expect(item.url.startsWith(`${RELEASE_HOST}/android/artifacts/`)).toBe(
          true,
        );
      }
      expect(getAndroidPrimaryDownloadUrl(release)).toContain(RELEASE_HOST);
    }
  });

  it("refuses a manifest whose tag or file names could change the link's path", async () => {
    const hostile = [
      manifest({ tagName: "v1/../../admin" }),
      manifest({ tagName: "v2.0.0.186?x=1" }),
      manifest({ tagName: "" }),
      manifest({ assets: [{ name: "../evil.apk" }] }),
      manifest({ assets: [{ name: "a/b.apk" }] }),
    ];
    for (const body of hostile) {
      respondWith(body);
      const release = await getAndroidRelease();
      for (const item of release.items) {
        expect(item.url).toMatch(
          /^https:\/\/release\.uniclipboard\.app\/android\/artifacts\/v[0-9A-Za-z.-]+\/[0-9A-Za-z._-]+\.apk$/,
        );
      }
      // Hostile input yields the built-in fallback, never a path built from it.
      expect(JSON.stringify(release)).not.toContain("evil");
      expect(JSON.stringify(release)).not.toContain("admin");
    }
  });
});

describe("Android download group", () => {
  const labels: MobileGroupLabels = {
    platformIOS: "iOS",
    platformAndroid: "Android",
    iosBetaBadge: "Beta",
    androidMinOS: "Android 8+",
    androidExtLabel: ".apk",
  };

  it("hands the release host links to the download page and the hero button", async () => {
    respondWith(manifest());
    const release = await getAndroidRelease();
    const android = buildMobileGroups(labels, release).find(
      (group) => group.os === "android",
    );
    expect(android?.items[0]?.url).toBe(
      `${RELEASE_HOST}/android/artifacts/v2.0.0.186/UniClip-2.0.0-arm64-v8a.apk`,
    );
    expect(getAndroidPrimaryDownloadUrl(release)).toBe(android?.items[0]?.url);
  });
});

import enMessages from "../../../messages/en.json";
import zhMessages from "../../../messages/zh.json";

jest.mock("../../lib/site-config", () => ({
  siteConfig: {
    brand: "UniClipboard",
    url: "http://localhost:3000",
    verification: { google: "", bing: "", baidu: "", yandex: "" },
    analytics: { gaMeasurementId: "" },
  },
}));

import LandingPage from "@/app/[locale]/page";

jest.mock(
  "@/lib/release-feed/fetch-stable-release",
  () => ({
    fetchStableRelease: jest.fn(),
  }),
  { virtual: true },
);
jest.mock(
  "@/lib/release-feed/normalize-release",
  () => ({
    normalizeStableRelease: jest.fn(),
  }),
  { virtual: true },
);

let currentLocale: "en" | "zh" = "en";

const resolveDotPath = (
  dictionary: Record<string, unknown>,
  key: string,
): string => {
  const parts = key.split(".");
  let cursor: unknown = dictionary;
  for (const part of parts) {
    if (cursor && typeof cursor === "object" && part in (cursor as object)) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof cursor === "string" ? cursor : key;
};

jest.mock("next-intl/server", () => ({
  getLocale: async () => currentLocale,
  getTranslations: async (
    arg: string | { locale?: string; namespace?: string },
  ) => {
    const namespace = typeof arg === "string" ? arg : (arg?.namespace ?? "");
    const messages = currentLocale === "en" ? enMessages : zhMessages;
    const dictionary = namespace.split(".").reduce<unknown>((cursor, part) => {
      if (cursor && typeof cursor === "object" && part in (cursor as object))
        return (cursor as Record<string, unknown>)[part];
      return undefined;
    }, messages) as Record<string, unknown> | undefined;
    const passthrough = (key: string) => key;
    const translator = ((key: string) => {
      if (!dictionary) return key;
      return resolveDotPath(dictionary, key);
    }) as ((key: string) => string) & { raw: (key: string) => unknown };
    translator.raw = passthrough;
    return translator;
  },
}));

describe("landing release state integration", () => {
  beforeEach(() => {
    currentLocale = "en";
    jest.clearAllMocks();
  });

  it("renders the landing page without crashing when the release feed fails", async () => {
    const mockedFetchStableRelease = jest.requireMock(
      "@/lib/release-feed/fetch-stable-release",
    ).fetchStableRelease as jest.Mock;
    const mockedNormalizeStableRelease = jest.requireMock(
      "@/lib/release-feed/normalize-release",
    ).normalizeStableRelease as jest.Mock;

    mockedFetchStableRelease.mockRejectedValue(new Error("socket closed"));

    await expect(
      LandingPage({ params: Promise.resolve({ locale: "en" }) }),
    ).resolves.toBeTruthy();
    expect(mockedNormalizeStableRelease).not.toHaveBeenCalled();
  });

  it("keeps landing.finalCta keys aligned across locales", () => {
    const enKeys = Object.keys(
      enMessages.landing.finalCta as unknown as Record<string, unknown>,
    ).sort();
    const zhKeys = Object.keys(
      zhMessages.landing.finalCta as unknown as Record<string, unknown>,
    ).sort();
    expect(zhKeys).toEqual(enKeys);
  });

  it("keeps landing.download keys aligned across locales", () => {
    const enKeys = Object.keys(
      enMessages.landing.download as unknown as Record<string, unknown>,
    ).sort();
    const zhKeys = Object.keys(
      zhMessages.landing.download as unknown as Record<string, unknown>,
    ).sort();
    expect(zhKeys).toEqual(enKeys);
  });
});

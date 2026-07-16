import enMessages from "../../../messages/en.json";
import ruMessages from "../../../messages/ru.json";
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
import { routing } from "@/i18n/routing";

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

const messagesByLocale: Record<string, unknown> = {
  en: enMessages,
  zh: zhMessages,
  ru: ruMessages,
};

let currentLocale = "en";

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
    const messages = messagesByLocale[currentLocale] ?? enMessages;
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

  // A missing key does not fail the build — next-intl falls back to echoing the
  // key path, so an untranslated locale ships looking like `landing.hero.title`.
  // Comparing every leaf path against the default locale is what catches it.
  const leafPaths = (value: unknown, prefix = ""): string[] => {
    if (Array.isArray(value)) {
      return value.flatMap((item, i) => leafPaths(item, `${prefix}[${i}]`));
    }
    if (value && typeof value === "object") {
      return Object.entries(value).flatMap(([key, child]) =>
        leafPaths(child, prefix ? `${prefix}.${key}` : key),
      );
    }
    return [prefix];
  };

  const expectedPaths = leafPaths(enMessages).sort();

  it.each(routing.locales.filter((locale) => locale !== routing.defaultLocale))(
    "keeps every message key aligned between en and %s",
    (locale) => {
      expect(leafPaths(messagesByLocale[locale]).sort()).toEqual(expectedPaths);
    },
  );

  it.each(routing.locales)("has a message file for %s", (locale) => {
    expect(messagesByLocale[locale]).toBeDefined();
  });
});

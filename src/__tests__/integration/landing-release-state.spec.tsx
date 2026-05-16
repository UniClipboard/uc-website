import { render, screen } from "@testing-library/react";

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
import { DownloadSection } from "@/components/landing/DownloadSection";

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

const getDownloadDictionary = (locale: "en" | "zh") => {
  const messages = locale === "en" ? enMessages : zhMessages;

  return messages.landing.download as Record<string, string>;
};

jest.mock("next-intl/server", () => ({
  getTranslations: async (
    arg: string | { locale?: string; namespace?: string },
  ) => {
    const namespace = typeof arg === "string" ? arg : (arg?.namespace ?? "");
    const passthrough = (key: string) => key;
    const translator = ((key: string) => {
      if (namespace !== "landing.download") return key;
      const dictionary = getDownloadDictionary(currentLocale);
      return dictionary[key] ?? key;
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

  it("renders degraded release fallback without crashing landing page", async () => {
    const mockedFetchStableRelease = jest.requireMock(
      "@/lib/release-feed/fetch-stable-release",
    ).fetchStableRelease as jest.Mock;
    const mockedNormalizeStableRelease = jest.requireMock(
      "@/lib/release-feed/normalize-release",
    ).normalizeStableRelease as jest.Mock;
    const dictionary = getDownloadDictionary("en");

    mockedFetchStableRelease.mockRejectedValue(new Error("socket closed"));

    await expect(
      LandingPage({ params: Promise.resolve({ locale: "en" }) }),
    ).resolves.toBeTruthy();
    expect(mockedNormalizeStableRelease).not.toHaveBeenCalled();

    const section = await DownloadSection({
      release: {
        status: "degraded",
        version: "unavailable",
        publishedAt: "unavailable",
        notes: ["notes unavailable"],
        downloads: [],
        fallbackReleaseUrl:
          "https://github.com/uniclipboard/uniclipboard/releases/latest",
        blockedPlatforms: [],
        degradedReason: "network-error",
      },
    });
    render(section);

    expect(
      screen.getAllByText(dictionary.degradedNotice).length,
    ).toBeGreaterThan(0);
    const releaseLinks = screen
      .getAllByRole("link")
      .filter(
        (link) =>
          link.getAttribute("href") ===
          "https://github.com/uniclipboard/uniclipboard/releases/latest",
      );
    expect(releaseLinks.length).toBeGreaterThan(0);
  });

  it("renders locale copy for degraded release section", async () => {
    const enDictionary = getDownloadDictionary("en");
    const zhDictionary = getDownloadDictionary("zh");

    expect(Object.keys(zhDictionary).sort()).toEqual(
      Object.keys(enDictionary).sort(),
    );

    currentLocale = "zh";
    const section = await DownloadSection({
      release: {
        status: "degraded",
        version: "unavailable",
        publishedAt: "unavailable",
        notes: ["notes unavailable"],
        downloads: [],
        fallbackReleaseUrl:
          "https://github.com/uniclipboard/uniclipboard/releases/latest",
        blockedPlatforms: [],
        degradedReason: "network-error",
      },
    });
    render(section);

    expect(
      screen.getAllByText(zhDictionary.degradedNotice).length,
    ).toBeGreaterThan(0);
    const releaseLinks = screen
      .getAllByRole("link")
      .filter(
        (link) =>
          link.getAttribute("href") ===
          "https://github.com/uniclipboard/uniclipboard/releases/latest",
      );
    expect(releaseLinks.length).toBeGreaterThan(0);
  });
});

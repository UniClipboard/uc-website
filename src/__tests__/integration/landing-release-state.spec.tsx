import { render, screen } from "@testing-library/react";

import LandingPage from "@/app/[locale]/page";
import { DownloadSection } from "@/components/landing/DownloadSection";

import enMessages from "../../../messages/en.json";
import zhMessages from "../../../messages/zh.json";

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
  getTranslations: async (namespace: string) => {
    if (namespace !== "landing.download") return (key: string) => key;
    const dictionary = getDownloadDictionary(currentLocale);
    return (key: string) => dictionary[key] ?? key;
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
      LandingPage({
        params: Promise.resolve({ locale: "en" }),
      }),
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

    expect(screen.getByText(dictionary.degradedNotice)).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: dictionary.fallbackAction,
      }),
    ).toHaveAttribute(
      "href",
      "https://github.com/uniclipboard/uniclipboard/releases/latest",
    );
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

    expect(screen.getByText(zhDictionary.degradedNotice)).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: zhDictionary.fallbackAction,
      }),
    ).toHaveAttribute(
      "href",
      "https://github.com/uniclipboard/uniclipboard/releases/latest",
    );
  });
});

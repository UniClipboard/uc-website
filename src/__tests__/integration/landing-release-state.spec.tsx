import { render, screen } from "@testing-library/react";

import LandingPage from "@/app/[locale]/page";
import { DownloadSection } from "@/components/landing/DownloadSection";
import type { StableReleaseFetchResult } from "@/lib/release-feed/fetch-stable-release";

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

jest.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => {
    const dictionary: Record<string, string> = {
      sectionTitle: "Download the latest release",
      sectionDescription:
        "Choose an official package below. If feed data is stale, use the fallback release page.",
      degradedNotice: "Release details are temporarily unavailable.",
      fallbackAction: "Open latest release",
      notesUnavailable: "Release notes are currently unavailable.",
      metadataUnavailable: "Metadata unavailable",
      freshnessHint: "Status updates refresh automatically every hour.",
      notesLabel: "Release notes",
      latestVersionLabel: "Latest version",
      publishedAtLabel: "Published at",
      downloadsLabel: "Direct downloads",
      unavailableValue: "Unavailable",
    };
    return dictionary[key] ?? key;
  },
}));

describe("landing release state integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("renders degraded release fallback without crashing landing page", async () => {
    const mockedFetchStableRelease = jest.requireMock(
      "@/lib/release-feed/fetch-stable-release",
    ).fetchStableRelease as jest.Mock;
    const mockedNormalizeStableRelease = jest.requireMock(
      "@/lib/release-feed/normalize-release",
    ).normalizeStableRelease as jest.Mock;

    const degradedResult: StableReleaseFetchResult = {
      status: "degraded",
      reason: "network-error",
      fallbackReleaseUrl:
        "https://github.com/uniclipboard/uniclipboard/releases/latest",
      metadata: {
        sourceUrl: "https://release.uniclipboard.app/stable.json",
        fetchedAt: "2026-03-10T00:00:00.000Z",
        revalidateSeconds: 3600,
      },
    };

    mockedFetchStableRelease.mockRejectedValue(new Error("socket closed"));
    mockedNormalizeStableRelease.mockReturnValue({
      status: "degraded",
      version: "unavailable",
      publishedAt: "unavailable",
      notes: ["notes unavailable"],
      downloads: [],
      fallbackReleaseUrl: degradedResult.fallbackReleaseUrl,
      blockedPlatforms: [],
      degradedReason: "network-error",
    });

    await expect(
      LandingPage({
        params: Promise.resolve({ locale: "en" }),
      }),
    ).resolves.toBeTruthy();

    const section = await DownloadSection({
      release: {
        status: "degraded",
        version: "unavailable",
        publishedAt: "unavailable",
        notes: ["notes unavailable"],
        downloads: [],
        fallbackReleaseUrl: degradedResult.fallbackReleaseUrl,
        blockedPlatforms: [],
        degradedReason: "network-error",
      },
    });
    render(section);

    expect(
      screen.getByText("Release details are temporarily unavailable."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Open latest release",
      }),
    ).toHaveAttribute("href", degradedResult.fallbackReleaseUrl);
  });

  it("renders locale copy for degraded release section", async () => {
    const mockedFetchStableRelease = jest.requireMock(
      "@/lib/release-feed/fetch-stable-release",
    ).fetchStableRelease as jest.Mock;
    const mockedNormalizeStableRelease = jest.requireMock(
      "@/lib/release-feed/normalize-release",
    ).normalizeStableRelease as jest.Mock;

    mockedFetchStableRelease.mockResolvedValue({
      status: "degraded",
      reason: "network-error",
      fallbackReleaseUrl:
        "https://github.com/uniclipboard/uniclipboard/releases/latest",
      metadata: {
        sourceUrl: "https://release.uniclipboard.app/stable.json",
        fetchedAt: "2026-03-10T00:00:00.000Z",
        revalidateSeconds: 3600,
      },
    } as StableReleaseFetchResult);
    mockedNormalizeStableRelease.mockReturnValue({
      status: "degraded",
      version: "unavailable",
      publishedAt: "unavailable",
      notes: ["notes unavailable"],
      downloads: [],
      fallbackReleaseUrl:
        "https://github.com/uniclipboard/uniclipboard/releases/latest",
      blockedPlatforms: [],
      degradedReason: "network-error",
    });

    await expect(
      LandingPage({
        params: Promise.resolve({ locale: "en" }),
      }),
    ).resolves.toBeTruthy();
  });
});

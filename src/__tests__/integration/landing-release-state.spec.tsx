import { render, screen } from "@testing-library/react";
import { type ElementType, isValidElement, type ReactNode } from "react";

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

jest.mock(
  "@/components/FloatingLines",
  () => ({
    __esModule: true,
    default: jest.fn(() => null),
  }),
  { virtual: true },
);
jest.mock(
  "@/lib/github-stars",
  () => ({
    fetchGitHubStars: jest.fn(async () => ({
      status: "degraded",
      stars: null,
    })),
  }),
  { virtual: true },
);

import LandingPage from "@/app/[locale]/page";
import FloatingLines from "@/components/FloatingLines";
import { DownloadSection } from "@/components/landing/DownloadSection";
import { HeroSection } from "@/components/landing/HeroSection";

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

const treeContainsElementType = (
  node: ReactNode,
  type: ElementType,
): boolean => {
  if (Array.isArray(node)) {
    return node.some((child) => treeContainsElementType(child, type));
  }

  if (!isValidElement(node)) {
    return false;
  }

  if (node.type === type) {
    return true;
  }

  const props = node.props as { children?: ReactNode };
  return treeContainsElementType(props.children, type);
};

const findElementByType = (
  node: ReactNode,
  type: ElementType,
): ReactNode | null => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElementByType(child, type);
      if (match) return match;
    }
    return null;
  }

  if (!isValidElement(node)) {
    return null;
  }

  if (node.type === type) {
    return node;
  }

  const props = node.props as { children?: ReactNode };
  return findElementByType(props.children, type);
};

const treeContainsStyleBackground = (
  node: ReactNode,
  background: string,
): boolean => {
  if (Array.isArray(node)) {
    return node.some((child) => treeContainsStyleBackground(child, background));
  }

  if (!isValidElement(node)) {
    return false;
  }

  const props = node.props as {
    children?: ReactNode;
    style?: { background?: string };
  };

  if (props.style?.background === background) {
    return true;
  }

  return treeContainsStyleBackground(props.children, background);
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

  it("includes the floating lines backdrop in the landing page tree", async () => {
    const mockedFetchStableRelease = jest.requireMock(
      "@/lib/release-feed/fetch-stable-release",
    ).fetchStableRelease as jest.Mock;

    mockedFetchStableRelease.mockRejectedValue(new Error("socket closed"));

    const page = await LandingPage({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(treeContainsElementType(page, FloatingLines)).toBe(true);
  });

  it("uses a restrained landing-theme gradient for the floating lines", async () => {
    const mockedFetchStableRelease = jest.requireMock(
      "@/lib/release-feed/fetch-stable-release",
    ).fetchStableRelease as jest.Mock;

    mockedFetchStableRelease.mockRejectedValue(new Error("socket closed"));

    const page = await LandingPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const floatingLines = findElementByType(page, FloatingLines);
    const props = isValidElement(floatingLines)
      ? (floatingLines.props as { linesGradient?: string[] })
      : {};

    expect(props.linesGradient).toEqual([
      "#FFFFFF",
      "#EFEFEC",
      "#B8B8B0",
      "#6B6B65",
    ]);
  });

  it("does not render the old hero spotlight layer", async () => {
    const section = await HeroSection({
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
      stars: null,
    });

    expect(treeContainsStyleBackground(section, "var(--hero-spotlight)")).toBe(
      false,
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

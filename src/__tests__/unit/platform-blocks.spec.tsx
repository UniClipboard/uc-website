import { render, screen, waitFor } from "@testing-library/react";

import {
  type PlatformBlock,
  PlatformBlocks,
} from "@/components/download/PlatformBlocks";

const blocks: PlatformBlock[] = [
  {
    os: "mac",
    label: "macOS",
    description: "Download for macOS",
    items: [],
  },
  {
    os: "win",
    label: "Windows",
    description: "Download for Windows",
    items: [],
  },
  {
    os: "linux",
    label: "Linux",
    description: "Download for Linux",
    items: [],
  },
];

describe("PlatformBlocks", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn().mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }),
    });
    Object.defineProperty(window.navigator, "platform", {
      configurable: true,
      value: "Win32",
    });
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    });
  });

  it("selects the detected platform automatically", async () => {
    render(
      <PlatformBlocks
        blocks={blocks}
        labels={{
          detected: "Detected",
          downloadAction: "Download",
          noDownloads: "No downloads",
          downloadsUnavailable: "Installer links could not be loaded",
          copy: "Copy",
          copied: "Copied",
          fallback: "All releases",
          versionPrefix: "Version",
        }}
        version="1.0.0"
        fallbackUrl="https://example.com/releases"
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("tab", { name: /Windows/ })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "Download for Windows",
    );
  });

  const labels = {
    detected: "Detected",
    downloadAction: "Download",
    noDownloads: "No downloads",
    downloadsUnavailable: "Installer links could not be loaded",
    copy: "Copy",
    copied: "Copied",
    fallback: "All releases",
    versionPrefix: "Version",
  };

  it("points at the release page instead of claiming there is no release when the feed failed", async () => {
    render(
      <PlatformBlocks
        blocks={blocks}
        labels={labels}
        version={null}
        fallbackUrl="https://github.com/uniclipboard/uniclipboard/releases/latest"
      />,
    );

    const panel = await screen.findByRole("tabpanel");
    expect(panel).toHaveTextContent("Installer links could not be loaded");
    expect(panel).not.toHaveTextContent("No downloads");
    expect(panel).not.toHaveTextContent(/Version v/);
    expect(screen.getByRole("link", { name: /All releases/ })).toHaveAttribute(
      "href",
      "https://github.com/uniclipboard/uniclipboard/releases/latest",
    );
  });

  it("lists the release installers with their version when the feed is available", async () => {
    render(
      <PlatformBlocks
        blocks={[
          {
            os: "win",
            label: "Windows",
            description: "Download for Windows",
            items: [
              {
                arch: "x64",
                ext: ".exe",
                url: "https://release.uniclipboard.app/artifacts/v0.19.4/UniClipboard_0.19.4_x64-setup.exe",
              },
            ],
          },
        ]}
        labels={labels}
        version="0.19.4"
        fallbackUrl="https://github.com/UniClipboard/UniClipboard/releases/tag/v0.19.4"
      />,
    );

    const panel = await screen.findByRole("tabpanel");
    expect(panel).toHaveTextContent("Version v0.19.4");
    expect(panel).not.toHaveTextContent("Installer links could not be loaded");
    expect(screen.getByRole("link", { name: /x64/ })).toHaveAttribute(
      "href",
      "https://release.uniclipboard.app/artifacts/v0.19.4/UniClipboard_0.19.4_x64-setup.exe",
    );
  });
});

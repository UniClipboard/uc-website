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
});

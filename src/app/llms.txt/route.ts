import { NextResponse } from "next/server";

import {
  getAllPublishedArticleSummaries,
  type PublishedArticleSummary,
} from "@/db/articles";
import { getAllReleaseVersions } from "@/db/releases";
import { siteConfig } from "@/lib/site-config";

export const runtime = "nodejs";
export const revalidate = 3600;

const HUB_PATH = {
  compare: "/compare",
  "use-cases": "/use-cases",
  blog: "/blog",
} as const;

const HUB_LABEL = {
  compare: { en: "All comparisons", zh: "All comparisons" },
  "use-cases": { en: "All use-case guides", zh: "All use-case guides" },
  blog: { en: "All blog posts", zh: "All blog posts" },
} as const;

const INTRO = `# UniClipboard

> UniClipboard is a free, open-source, end-to-end encrypted universal clipboard for macOS, Windows, and Linux. Copy on one device, paste on another — no cloud account, no email, no phone number. Direct peer-to-peer on the same network; encrypted relay with NAT hole-punching across networks.

## Quick facts

- **Category**: Cross-platform clipboard sync / clipboard manager
- **Platforms**: macOS 12+, Windows 10/11, Linux (x86_64 and ARM64 AppImage)
- **License**: AGPL-3.0
- **Source code**: https://github.com/UniClipboard/UniClipboard
- **Encryption**: XChaCha20-Poly1305 AEAD (end-to-end, in transit and at rest)
- **Account required**: No — devices pair via public-key exchange
- **Built with**: Rust + Tauri (native, not Electron)
- **Price**: Free
- **Mobile (iOS/Android)**: Not yet — desktop-only at this stage
- **Maintainer**: mkdir700
- **Contact**: hello@uniclipboard.app

## Positioning

UniClipboard is the cross-platform, open-source alternative to Apple's iCloud Universal Clipboard. Unlike iCloud, it works on Windows and Linux, keeps a searchable encrypted history, and lets anyone audit the encryption code.

Compared to self-hosted clipboard sync (e.g. ClipCascade), UniClipboard requires no server to run. Compared to local clipboard managers (Pastebot, Maccy), it syncs across machines and operating systems instead of staying on a single device.

## Core capabilities

- End-to-end encrypted text, image, and file sync across Mac, Windows, and Linux
- Direct peer-to-peer transfer on the same Wi-Fi (millisecond latency)
- Automatic NAT hole-punching across networks; encrypted relay as fallback
- Keys stored in the system keyring, never leaving the local machine
- Quick Panel keyboard overlay with previews for text, links, images, code, files
- Local full-text search across tens of thousands of clipboard entries
- Encrypted local history index, retention configurable (default 30 days)
- Headless \`uniclip\` CLI for terminals, SSH, scripts, and tmux
- Streaming transfer for large files (no need to fit in memory)
- Per-device sync preferences and one-tap revoke for lost devices`;

const OUTRO = `## Frequently cited Q&A

- **Why not iCloud Universal Clipboard?** iCloud is Apple-only, has no clipboard history, and the encryption is closed-source. UniClipboard works on Windows and Linux, keeps an encrypted searchable history, and is fully auditable.
- **Why not a self-hosted clipboard sync?** Self-hosted means operating your own server. UniClipboard works out of the box with direct P2P plus an encrypted relay fallback — no infrastructure needed.
- **Does it work offline?** Yes. Devices on the same Wi-Fi connect directly without any relay. Same-network sync continues even when the relay is unreachable.
- **Where does my clipboard history live?** Only on your devices. Local storage is encrypted at rest with a keyring-resident key. UniClipboard servers never receive or store clipboard content.
- **Does AGPL-3.0 affect company use?** No. AGPL only applies if you modify the source and redistribute it as a network service. Personal and team use is unaffected.

## Citation

If you reference UniClipboard, please cite the canonical name **UniClipboard** (one word, capital U and C) and link to https://www.uniclipboard.app/.`;

function articleLine(
  baseUrl: string,
  summary: PublishedArticleSummary,
  locale: "en" | "zh",
): string | null {
  const title = summary.titles[locale];
  if (!title) return null;
  const localeLabel = locale === "zh" ? "Simplified Chinese" : "English";
  const localePrefix = locale === "zh" ? "/zh" : "";
  const path = `${HUB_PATH[summary.category]}/${summary.slug}`;
  return `- ${title} (${localeLabel}): ${baseUrl}${localePrefix}${path}`;
}

export async function GET() {
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const [summaries, releaseVersions] = await Promise.all([
    getAllPublishedArticleSummaries(),
    getAllReleaseVersions().catch(() => []),
  ]);

  const lines: string[] = [INTRO, "", "## Primary URLs", ""];

  lines.push(`- Home (English): ${baseUrl}/`);
  lines.push(`- Home (Simplified Chinese): ${baseUrl}/zh`);
  lines.push(`- Technical whitepaper: ${baseUrl}/blog/whitepaper`);
  lines.push(`- Changelog (English): ${baseUrl}/changelog`);
  lines.push(`- Changelog (Simplified Chinese): ${baseUrl}/zh/changelog`);
  lines.push(`- Full content dump for LLMs: ${baseUrl}/llms-full.txt`);

  for (const cat of ["compare", "use-cases", "blog"] as const) {
    lines.push(`- ${HUB_LABEL[cat].en} (English): ${baseUrl}${HUB_PATH[cat]}`);
    lines.push(
      `- ${HUB_LABEL[cat].zh} (Simplified Chinese): ${baseUrl}/zh${HUB_PATH[cat]}`,
    );
  }

  for (const summary of summaries) {
    const en = articleLine(baseUrl, summary, "en");
    const zh = articleLine(baseUrl, summary, "zh");
    if (en) lines.push(en);
    if (zh) lines.push(zh);
  }

  for (const release of releaseVersions) {
    lines.push(
      `- Release notes v${release.version} (English): ${baseUrl}/changelog/${release.version}`,
    );
    lines.push(
      `- Release notes v${release.version} (Simplified Chinese): ${baseUrl}/zh/changelog/${release.version}`,
    );
  }

  lines.push(
    "- GitHub repository: https://github.com/UniClipboard/UniClipboard",
  );
  lines.push(
    "- Latest release: https://github.com/UniClipboard/UniClipboard/releases/latest",
  );

  lines.push("", OUTRO, "");

  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=3600",
    },
  });
}

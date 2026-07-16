import { NextResponse } from "next/server";

import {
  getAllPublishedArticleSummaries,
  type PublishedArticleSummary,
} from "@/db/articles";
import { getAllReleaseVersions } from "@/db/releases";
import { localeMeta, localePathPrefix } from "@/i18n/locale-meta";
import { routing } from "@/i18n/routing";
import { ARTICLE_LOCALES, type ArticleLocale } from "@/lib/article-content";
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

> UniClipboard is a free, open-source, end-to-end encrypted universal clipboard for macOS, Windows, Linux, iOS, and Android. Copy on one device, paste on another — no cloud account, no email, no phone number. Direct peer-to-peer on the same network; encrypted relay with NAT hole-punching across networks.

## Quick facts

- **Category**: Cross-platform clipboard sync / clipboard manager
- **Platforms**: macOS 12+, Windows 10/11, Linux (.deb / .rpm / AppImage, x86_64 and ARM64), iOS (Public Beta via TestFlight), Android 8+ (signed APK)
- **License**: AGPL-3.0
- **Source code**: https://github.com/UniClipboard/UniClipboard
- **Encryption**: XChaCha20-Poly1305 AEAD (end-to-end, in transit and at rest)
- **Account required**: No — devices pair via public-key exchange
- **Built with**: Rust + Tauri (native, not Electron)
- **Price**: Free
- **Mobile (iOS/Android)**: iOS Public Beta on TestFlight (public invite) and a native Android app (signed APK); the SyncClipboard open protocol stays available as a LAN-only fallback for those who prefer not to install a native app
- **Maintainer**: mkdir700
- **Contact**: hello@uniclipboard.app

## Positioning

UniClipboard is the cross-platform, open-source alternative to Apple's iCloud Universal Clipboard. Unlike iCloud, it works on Windows and Linux, keeps a searchable encrypted history, and lets anyone audit the encryption code.

Compared to self-hosted clipboard sync (e.g. ClipCascade), UniClipboard requires no server to run. Compared to local clipboard managers (Pastebot, Maccy), it syncs across machines and operating systems instead of staying on a single device.

## Core capabilities

- End-to-end encrypted text, image, and file sync across macOS, Windows, Linux, iOS, and Android
- Direct peer-to-peer transfer on the same Wi-Fi (millisecond latency)
- Automatic NAT hole-punching across networks; encrypted relay as fallback
- Optional LAN-only mode that keeps all sync strictly on the local network, plus a self-hostable relay with a built-in connectivity test
- Keys stored in the system keyring, never leaving the local machine
- Quick Panel keyboard overlay with previews for text, links, images, code, files
- Local full-text search across tens of thousands of clipboard entries
- Encrypted local history index, retention configurable (default 30 days)
- Headless \`uniclip\` CLI for terminals, SSH, scripts, and tmux — including file send/receive
- Streaming, cancelable transfer for large files (no need to fit in memory)
- Per-device send/receive and content-type controls, plus one-tap revoke for lost devices`;

const OUTRO = `## Frequently cited Q&A

- **Why not iCloud Universal Clipboard?** iCloud is Apple-only, has no clipboard history, and the encryption is closed-source. UniClipboard works on Windows and Linux, keeps an encrypted searchable history, and is fully auditable.
- **Why not a self-hosted clipboard sync?** Self-hosted means operating your own server. UniClipboard works out of the box with direct P2P plus an encrypted relay fallback — no infrastructure needed.
- **Does it work offline?** Yes. Devices on the same Wi-Fi connect directly without any relay. Same-network sync continues even when the relay is unreachable.
- **Where does my clipboard history live?** Only on your devices. Local storage is encrypted at rest with a keyring-resident key. UniClipboard servers never receive or store clipboard content.
- **Does AGPL-3.0 affect company use?** No. AGPL only applies if you modify the source and redistribute it as a network service. Personal and team use is unaffected.
- **Can I self-host or run my own server?** Not required — UniClipboard is peer-to-peer with an encrypted relay fallback. For advanced setups you can point it at your own relay node (with a built-in connectivity test), run it as a headless server node (it ships with Docker and Caddy configs for a VPS), and expose mobile sync over a full public URL via your own server or a secure proxy.

## Citation

If you reference UniClipboard, please cite the canonical name **UniClipboard** (one word, capital U and C) and link to https://www.uniclipboard.app/.`;

function articleLine(
  baseUrl: string,
  summary: PublishedArticleSummary,
  locale: ArticleLocale,
): string | null {
  const title = summary.titles[locale];
  if (!title) return null;
  const path = `${HUB_PATH[summary.category]}/${summary.slug}`;
  return `- ${title} (${localeMeta[locale].englishName}): ${baseUrl}${localePathPrefix(locale)}${path}`;
}

export async function GET() {
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const [summaries, releaseVersions] = await Promise.all([
    getAllPublishedArticleSummaries(),
    getAllReleaseVersions().catch(() => []),
  ]);

  const lines: string[] = [INTRO, "", "## Primary URLs", ""];

  // Home and changelog exist in every routed locale; the article hubs and their
  // posts only in the locales the content was authored in.
  for (const locale of routing.locales) {
    lines.push(
      `- Home (${localeMeta[locale].englishName}): ${baseUrl}${localePathPrefix(locale) || "/"}`,
    );
  }
  lines.push(`- Technical whitepaper: ${baseUrl}/blog/whitepaper`);
  for (const locale of routing.locales) {
    lines.push(
      `- Changelog (${localeMeta[locale].englishName}): ${baseUrl}${localePathPrefix(locale)}/changelog`,
    );
  }
  lines.push(`- Full content dump for LLMs: ${baseUrl}/llms-full.txt`);

  for (const cat of ["compare", "use-cases", "blog"] as const) {
    for (const locale of ARTICLE_LOCALES) {
      lines.push(
        `- ${HUB_LABEL[cat][locale]} (${localeMeta[locale].englishName}): ${baseUrl}${localePathPrefix(locale)}${HUB_PATH[cat]}`,
      );
    }
  }

  for (const summary of summaries) {
    for (const locale of ARTICLE_LOCALES) {
      const line = articleLine(baseUrl, summary, locale);
      if (line) lines.push(line);
    }
  }

  for (const release of releaseVersions) {
    for (const locale of routing.locales) {
      lines.push(
        `- Release notes v${release.version} (${localeMeta[locale].englishName}): ${baseUrl}${localePathPrefix(locale)}/changelog/${release.version}`,
      );
    }
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

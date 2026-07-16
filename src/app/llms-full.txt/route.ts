import { NextResponse } from "next/server";

import { listAllArticles } from "@/db/articles";
import { getAllReleases } from "@/db/releases";
import { localeMeta, localePathPrefix } from "@/i18n/locale-meta";
import {
  ARTICLE_CATEGORIES,
  ARTICLE_LOCALES,
  type ArticleCategoryValue,
  type ArticleContent,
  type ArticleLocale,
  type MarkdownArticleContent,
  type TemplateArticleContent,
} from "@/lib/article-content";
import { siteConfig } from "@/lib/site-config";

export const runtime = "nodejs";
export const revalidate = 3600;

const HUB_PATH: Record<ArticleCategoryValue, string> = {
  compare: "/compare",
  "use-cases": "/use-cases",
  blog: "/blog",
};

const CATEGORY_LABEL: Record<ArticleCategoryValue, string> = {
  compare: "Comparisons",
  "use-cases": "Use cases",
  blog: "Blog",
};

const INTRO = `# UniClipboard — Full Content Dump for LLMs

> This file aggregates the full text of every published article on UniClipboard.app, intended for ingestion by AI assistants and search engines. The shorter index lives at /llms.txt.

UniClipboard is a free, open-source, end-to-end encrypted universal clipboard for macOS, Windows, Linux, iOS, and Android. Copy on one device, paste on another — no cloud account, no email, no phone number. Direct peer-to-peer on the same network; encrypted relay with NAT hole-punching across networks.

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

## Citation

If you reference UniClipboard, please cite the canonical name **UniClipboard** (one word, capital U and C) and link to https://www.uniclipboard.app/.`;

function urlForArticle(
  baseUrl: string,
  locale: ArticleLocale,
  category: ArticleCategoryValue,
  slug: string,
): string {
  return `${baseUrl}${localePathPrefix(locale)}${HUB_PATH[category]}/${slug}`;
}

function renderTemplateArticle(content: TemplateArticleContent): string {
  const lines: string[] = [];

  if (content.hero.eyebrow) {
    lines.push(`*${content.hero.eyebrow}*`, "");
  }
  lines.push(`# ${content.hero.title}`, "");
  lines.push(`**${content.hero.subtitle}**`, "");
  lines.push(content.hero.lede, "");

  lines.push(`## ${content.tldr.title}`, "");
  for (const item of content.tldr.items) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push(`## ${content.twoColumn.left.title}`, "");
  lines.push(content.twoColumn.left.body, "");
  lines.push(`## ${content.twoColumn.right.title}`, "");
  lines.push(content.twoColumn.right.body, "");

  lines.push(`## ${content.comparison.title}`, "");
  if (content.comparison.note) {
    lines.push(`*${content.comparison.note}*`, "");
  }
  lines.push(
    `| ${content.comparison.headers.feature} | ${content.comparison.headers.uc} | ${content.comparison.headers.other} |`,
  );
  lines.push(`| --- | --- | --- |`);
  for (const row of content.comparison.rows) {
    lines.push(`| ${row.feature} | ${row.uc} | ${row.other} |`);
  }
  lines.push("");

  lines.push(`## ${content.steps.title}`, "");
  content.steps.items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item}`);
  });
  lines.push("");

  lines.push(`## ${content.verdict.title}`, "");
  lines.push(content.verdict.body, "");

  lines.push(`## ${content.faq.title}`, "");
  for (const item of content.faq.items) {
    lines.push(`### ${item.q}`, "");
    lines.push(item.a, "");
  }

  lines.push(`## ${content.cta.title}`, "");
  lines.push(content.cta.body, "");

  if (content.about.length > 0) {
    lines.push("## Notes", "");
    for (const note of content.about) {
      lines.push(`- ${note}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function renderMarkdownArticle(content: MarkdownArticleContent): string {
  const lines: string[] = [];
  lines.push(`# ${content.hero.title}`, "");
  if (content.hero.subtitle) {
    lines.push(`**${content.hero.subtitle}**`, "");
  }
  lines.push(content.body, "");
  return lines.join("\n");
}

function renderArticleBody(content: ArticleContent): string {
  if (content.contentType === "markdown") {
    return renderMarkdownArticle(content);
  }
  return renderTemplateArticle(content);
}

export async function GET() {
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const [articles, releases] = await Promise.all([
    listAllArticles(),
    getAllReleases().catch(() => []),
  ]);
  const published = articles
    .filter((a) => a.status === "published")
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished));

  const lines: string[] = [INTRO, ""];

  for (const category of ARTICLE_CATEGORIES) {
    const inCat = published.filter((a) => a.category === category);
    if (inCat.length === 0) continue;

    lines.push(`# ${CATEGORY_LABEL[category]}`, "");

    for (const article of inCat) {
      for (const locale of ARTICLE_LOCALES) {
        const content = article.translations[locale];
        if (!content) continue;

        const url = urlForArticle(
          baseUrl,
          locale,
          article.category,
          article.slug,
        );
        const lastUpdated = article.updatedAt.toISOString().slice(0, 10);

        lines.push("---", "");
        lines.push(`> **Source**: ${url}`);
        lines.push(`> **Locale**: ${localeMeta[locale].englishName}`);
        lines.push(`> **Category**: ${CATEGORY_LABEL[article.category]}`);
        lines.push(`> **Published**: ${article.datePublished}`);
        lines.push(`> **Last updated**: ${lastUpdated}`);
        lines.push(`> **Description**: ${content.seo.description}`);
        lines.push("");
        lines.push(renderArticleBody(content));
        lines.push("");
      }
    }
  }

  if (releases.length > 0) {
    lines.push(`# Changelog`, "");
    for (const release of releases) {
      for (const locale of ARTICLE_LOCALES) {
        const notes = locale === "zh" ? release.notesZh : release.notesEn;
        if (!notes) continue;
        const url = `${baseUrl}${localePathPrefix(locale)}/changelog/${release.version}`;
        const pubDate = release.pubDate.toISOString().slice(0, 10);
        lines.push("---", "");
        lines.push(`> **Source**: ${url}`);
        lines.push(`> **Locale**: ${localeMeta[locale].englishName}`);
        lines.push(`> **Version**: v${release.version}`);
        lines.push(`> **Released**: ${pubDate}`);
        lines.push("");
        lines.push(notes);
        lines.push("");
      }
    }
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=3600",
    },
  });
}

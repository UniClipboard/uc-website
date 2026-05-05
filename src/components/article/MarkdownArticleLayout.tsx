import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";
import { type Components, MarkdownAsync } from "react-markdown";
import rehypeShiki from "rehype-shiki";
import remarkGfm from "remark-gfm";

import { Article, BreadcrumbBar, JsonLd } from "@/components/article/sections";
import { AnimateIn } from "@/components/landing/AnimateIn";
import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";
import type {
  ArticleCategoryValue,
  ArticleLocale,
  MarkdownArticleContent,
} from "@/lib/article-content";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const localePathPrefix = (locale: string) =>
  locale === "en" ? "" : `/${locale}`;

const HUB_BASE_PATH: Partial<Record<ArticleCategoryValue, string>> = {
  blog: "/blog",
};

const HUB_NAMESPACE: Partial<Record<ArticleCategoryValue, string>> = {
  blog: "blogHub",
};

export type MarkdownArticleEntry = {
  slug: string;
  category: ArticleCategoryValue;
  datePublished: string;
};

type TocItem = {
  id: string;
  title: string;
};

const articlePagePath = (entry: MarkdownArticleEntry) =>
  `${HUB_BASE_PATH[entry.category] ?? "/blog"}/${entry.slug}`;

const headingPattern = /^ {0,3}##(?!#)\s+(.+?)(?:\s+#+)?\s*$/;
const fencePattern = /^ {0,3}(`{3,}|~{3,})/;

const plainTextFromMarkdown = (value: string) =>
  value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\\([\\`*_[\]{}()#+\-.!|>])/g, "$1")
    .trim();

const slugifyHeading = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "section";

const uniqueHeadingId = (title: string, seen: Map<string, number>) => {
  const base = slugifyHeading(title);
  const nextCount = (seen.get(base) ?? 0) + 1;
  seen.set(base, nextCount);
  return nextCount === 1 ? base : `${base}-${nextCount}`;
};

const extractTableOfContents = (markdown: string): TocItem[] => {
  const seen = new Map<string, number>();
  const toc: TocItem[] = [];
  let fenceMarker: "`" | "~" | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const fenceMatch = line.match(fencePattern);
    if (fenceMatch) {
      const marker = fenceMatch[1][0] as "`" | "~";
      if (!fenceMarker) {
        fenceMarker = marker;
      } else if (fenceMarker === marker) {
        fenceMarker = null;
      }
      continue;
    }

    if (fenceMarker) continue;

    const headingMatch = line.match(headingPattern);
    if (!headingMatch) continue;

    const title = plainTextFromMarkdown(headingMatch[1]);
    if (!title) continue;

    toc.push({ id: uniqueHeadingId(title, seen), title });
  }

  return toc;
};

const textFromReactNode = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(textFromReactNode).join("");
  }

  return "";
};

export async function buildMarkdownArticleMetadata(
  entry: MarkdownArticleEntry,
  content: MarkdownArticleContent,
  locale: string,
): Promise<Metadata> {
  const pagePath = articlePagePath(entry);
  const canonical = `${localePathPrefix(locale)}${pagePath}`;
  const keywords = content.seo.keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const ogImage = {
    url: locale === "zh" ? "/og-zh.jpg" : "/og-en.jpg",
    width: 1730,
    height: 909,
    alt: content.seo.ogAlt,
  };

  return {
    title: content.seo.title,
    description: content.seo.description,
    keywords,
    alternates: {
      canonical,
      languages: {
        en: pagePath,
        zh: `/zh${pagePath}`,
        "x-default": pagePath,
      },
    },
    openGraph: {
      title: content.seo.title,
      description: content.seo.description,
      url: `${siteConfig.url}${canonical}`,
      type: "article",
      siteName: siteConfig.brand,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: content.seo.title,
      description: content.seo.description,
      images: [ogImage],
    },
  };
}

const proseClasses = [
  "[&_h2]:mt-12",
  "[&_h2]:mb-5",
  "[&_h2]:text-[clamp(1.5rem,2.6vw,1.875rem)]",
  "[&_h2]:font-semibold",
  "[&_h2]:tracking-[-0.02em]",
  "[&_h2]:leading-[1.2]",
  "[&_h2]:text-foreground",
  "[&_h3]:mt-9",
  "[&_h3]:mb-3.5",
  "[&_h3]:text-[1.125rem]",
  "[&_h3]:font-semibold",
  "[&_h3]:tracking-[-0.01em]",
  "[&_h3]:text-foreground",
  "[&_p]:my-4",
  "[&_p]:text-[16px]",
  "[&_p]:leading-[1.7]",
  "[&_p]:text-foreground/90",
  "[&_a]:text-foreground",
  "[&_a]:underline",
  "[&_a]:underline-offset-4",
  "[&_a]:decoration-foreground/30",
  "hover:[&_a]:decoration-foreground",
  "[&_strong]:text-foreground",
  "[&_strong]:font-semibold",
  "[&_em]:italic",
  "[&_ul]:my-5",
  "[&_ul]:list-disc",
  "[&_ul]:pl-6",
  "[&_ul]:text-foreground/90",
  "[&_ol]:my-5",
  "[&_ol]:list-decimal",
  "[&_ol]:pl-6",
  "[&_ol]:text-foreground/90",
  "[&_li]:my-1.5",
  "[&_li]:leading-[1.65]",
  "[&_blockquote]:border-l-2",
  "[&_blockquote]:border-border",
  "[&_blockquote]:pl-5",
  "[&_blockquote]:my-6",
  "[&_blockquote]:text-muted-foreground",
  "[&_blockquote]:italic",
  "[&_code]:bg-bg2",
  "[&_code]:rounded",
  "[&_code]:px-1.5",
  "[&_code]:py-0.5",
  "[&_code]:font-mono",
  "[&_code]:text-[13px]",
  // Code blocks render with a constant dark surface so the Nord syntax theme
  // keeps high contrast in both light and dark site themes (same approach as
  // GitHub / Vercel / Stripe docs).
  "[&_pre]:bg-[#2e3440]",
  "[&_pre]:border",
  "[&_pre]:border-[#3b4252]",
  "[&_pre]:rounded-lg",
  "[&_pre]:p-5",
  "[&_pre]:my-6",
  "[&_pre]:overflow-x-auto",
  "[&_pre]:text-[13px]",
  "[&_pre]:leading-[1.6]",
  "[&_pre>code]:bg-transparent",
  "[&_pre>code]:p-0",
  "[&_table]:my-6",
  "[&_table]:w-full",
  "[&_table]:border-collapse",
  "[&_table]:text-sm",
  "[&_table]:border",
  "[&_table]:border-border",
  "[&_table]:rounded-lg",
  "[&_table]:overflow-hidden",
  "[&_th]:text-left",
  "[&_th]:px-4",
  "[&_th]:py-3",
  "[&_th]:bg-bg2",
  "[&_th]:font-semibold",
  "[&_th]:text-foreground",
  "[&_th]:border-b",
  "[&_th]:border-border",
  "[&_td]:px-4",
  "[&_td]:py-3",
  "[&_td]:border-b",
  "[&_td]:border-border",
  "[&_td]:text-foreground/90",
  "[&_tr:last-child_td]:border-b-0",
  "[&_hr]:my-10",
  "[&_hr]:border-border",
  "[&_img]:rounded-lg",
  "[&_img]:my-6",
  "[&_img]:max-w-full",
].join(" ");

export async function MarkdownArticleLayout({
  entry,
  content,
  locale,
}: {
  entry: MarkdownArticleEntry;
  content: MarkdownArticleContent;
  locale: ArticleLocale;
}) {
  const namespace = HUB_NAMESPACE[entry.category] ?? "blogHub";
  const hubT = await getTranslations({ locale, namespace });
  const breadcrumbHome = hubT("breadcrumbHome");
  const breadcrumbParent = hubT("breadcrumbCurrent");
  const tocLabel = hubT("tableOfContents");

  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const homePath = locale === "en" ? "/" : `/${locale}`;
  const pagePath = articlePagePath(entry);
  const canonical = `${localePathPrefix(locale)}${pagePath}`;
  const pageUrl = `${baseUrl}${canonical}`;
  const parentPath = HUB_BASE_PATH[entry.category] ?? "/blog";
  const parentUrl = `${baseUrl}${localePathPrefix(locale)}${parentPath}`;

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: content.seo.title,
    description: content.seo.description,
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    datePublished: entry.datePublished,
    dateModified: content.meta.lastUpdatedDate,
    mainEntityOfPage: pageUrl,
    author: { "@type": "Organization", name: siteConfig.brand, url: baseUrl },
    publisher: {
      "@type": "Organization",
      name: siteConfig.brand,
      url: baseUrl,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: breadcrumbHome,
        item: `${baseUrl}${homePath}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: breadcrumbParent,
        item: parentUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: content.meta.breadcrumbCurrent,
        item: pageUrl,
      },
    ],
  };

  const toc = extractTableOfContents(content.body);
  const hasToc = toc.length > 0;
  let renderedH2Index = 0;
  const markdownComponents: Components = {
    h2: ({ className, children, ...props }) => {
      const tocItem = toc[renderedH2Index];
      renderedH2Index += 1;
      const fallbackId = uniqueHeadingId(
        textFromReactNode(children),
        new Map<string, number>(),
      );

      return (
        <h2
          id={tocItem?.id ?? fallbackId}
          className={cn("scroll-mt-28", className)}
          {...props}
        >
          {children}
        </h2>
      );
    },
  };

  const renderedMarkdown = await MarkdownAsync({
    children: content.body,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypeShiki, { theme: "nord", useBackground: false }]],
    components: markdownComponents,
  });

  return (
    <>
      <Navigation />
      <Article>
        <section className="border-border bg-background border-b pt-28 pb-14 md:pt-36 md:pb-20">
          <div className="landing-shell">
            <BreadcrumbBar
              items={[
                { label: breadcrumbHome, href: "/" },
                { label: breadcrumbParent, href: parentPath },
                { label: content.meta.breadcrumbCurrent },
              ]}
            />
            <AnimateIn variant="fade-in" duration={0.5}>
              <p
                className="text-muted2 mb-3.5"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.06em",
                }}
              >
                <span>{content.meta.lastUpdatedLabel}</span>
                <span className="mx-1.5">·</span>
                <time dateTime={content.meta.lastUpdatedDate}>
                  {content.meta.lastUpdatedDate}
                </time>
              </p>
            </AnimateIn>
            <AnimateIn delay={0.05} duration={0.6}>
              <h1
                className="text-foreground mb-5"
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.25rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  maxWidth: 880,
                  textWrap: "balance",
                }}
              >
                {content.hero.title}
              </h1>
            </AnimateIn>
            {content.hero.subtitle && (
              <AnimateIn delay={0.1} duration={0.5}>
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: 18, lineHeight: 1.55, maxWidth: 720 }}
                >
                  {content.hero.subtitle}
                </p>
              </AnimateIn>
            )}
          </div>
        </section>

        <section className="bg-background border-border border-b py-[64px] md:py-[88px]">
          <div className="landing-shell">
            <div
              className={cn(
                "grid gap-10",
                hasToc
                  ? "lg:grid-cols-[minmax(0,760px)_220px] lg:items-start lg:justify-center xl:grid-cols-[minmax(0,760px)_260px]"
                  : "mx-auto max-w-[760px]",
              )}
            >
              <div className={cn("min-w-0", proseClasses)}>
                {renderedMarkdown}
              </div>
              {hasToc && (
                <aside className="order-first lg:sticky lg:top-24 lg:order-none">
                  <nav
                    aria-label={tocLabel}
                    className="border-border bg-bg2/50 rounded-lg border p-4 lg:bg-transparent"
                  >
                    <p
                      className="text-muted2 mb-3"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {tocLabel}
                    </p>
                    <ol className="m-0 list-none space-y-2 p-0">
                      {toc.map((item) => (
                        <li key={item.id} className="m-0">
                          <a
                            href={`#${item.id}`}
                            className="text-muted-foreground hover:text-foreground block text-sm leading-5 transition-colors"
                          >
                            {item.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                </aside>
              )}
            </div>
          </div>
        </section>
      </Article>
      <Footer />
      <JsonLd data={[blogPostingSchema, breadcrumbSchema]} />
    </>
  );
}

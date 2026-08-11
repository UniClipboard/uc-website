import { getTranslations } from "next-intl/server";

import {
  getAllPublishedSlugs,
  getArticle,
  getPublishedArticlesByCategory,
} from "@/db/articles";
import { getAllReleaseVersions, getReleaseByVersion } from "@/db/releases";
import { localePathPrefix } from "@/i18n/locale-meta";
import { routing } from "@/i18n/routing";
import {
  ARTICLE_LOCALES,
  type ArticleCategoryValue,
  type ArticleContent,
  type ArticleLocale,
  isArticleLocale,
  type TemplateArticleContent,
} from "@/lib/article-content";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 1800;
export const dynamicParams = false;

const CATEGORY_PATHS: Record<ArticleCategoryValue, string> = {
  compare: "compare",
  "use-cases": "use-cases",
  blog: "blog",
};

const CATEGORY_NAMESPACE: Record<ArticleCategoryValue, string> = {
  compare: "compareHub",
  "use-cases": "useCasesHub",
  blog: "blogHub",
};

type RouteContext = { params: Promise<{ path?: string[] }> };

const pageUrl = (path: string[]) =>
  `${siteConfig.url.replace(/\/$/, "")}/${path.join("/")}`.replace(/\/$/, "");

const markdownResponse = (body: string) =>
  new Response(body.trimEnd() + "\n", {
    headers: {
      "cache-control": "public, max-age=600, s-maxage=1800",
      "content-type": "text/markdown; charset=utf-8",
      vary: "Accept",
    },
  });

const notFound = () => new Response("Not Found", { status: 404 });

function renderTemplateArticle(content: TemplateArticleContent): string {
  const lines: string[] = [];

  if (content.hero.eyebrow) lines.push(`*${content.hero.eyebrow}*`, "");
  lines.push(`# ${content.hero.title}`, "", `**${content.hero.subtitle}**`, "");
  lines.push(content.hero.lede, "", `## ${content.tldr.title}`, "");
  lines.push(...content.tldr.items.map((item) => `- ${item}`), "");
  lines.push(
    `## ${content.twoColumn.left.title}`,
    "",
    content.twoColumn.left.body,
    "",
  );
  lines.push(
    `## ${content.twoColumn.right.title}`,
    "",
    content.twoColumn.right.body,
    "",
  );
  lines.push(`## ${content.comparison.title}`, "");
  if (content.comparison.note) lines.push(`*${content.comparison.note}*`, "");
  lines.push(
    `| ${content.comparison.headers.feature} | ${content.comparison.headers.uc} | ${content.comparison.headers.other} |`,
    "| --- | --- | --- |",
  );
  lines.push(
    ...content.comparison.rows.map(
      (row) => `| ${row.feature} | ${row.uc} | ${row.other} |`,
    ),
    "",
  );
  lines.push(`## ${content.steps.title}`, "");
  lines.push(
    ...content.steps.items.map((item, index) => `${index + 1}. ${item}`),
    "",
  );
  lines.push(`## ${content.verdict.title}`, "", content.verdict.body, "");
  lines.push(`## ${content.faq.title}`, "");
  for (const item of content.faq.items) {
    lines.push(`### ${item.q}`, "", item.a, "");
  }
  lines.push(`## ${content.cta.title}`, "", content.cta.body, "");
  if (content.about.length > 0) {
    lines.push("## Notes", "", ...content.about.map((note) => `- ${note}`), "");
  }
  return lines.join("\n");
}

const renderArticle = (content: ArticleContent) =>
  content.contentType === "markdown"
    ? `# ${content.hero.title}\n\n${content.body}`
    : renderTemplateArticle(content);

function splitLocale(path: string[]) {
  const [first, ...rest] = path;
  if (
    first &&
    routing.locales.includes(first as (typeof routing.locales)[number])
  ) {
    return { locale: first, rest };
  }
  return { locale: routing.defaultLocale, rest: path };
}

async function renderHome(locale: string, sourcePath: string[]) {
  const t = await getTranslations({ locale, namespace: "seo" });
  return [
    "# UniClipboard",
    "",
    t("description"),
    "",
    "## Primary links",
    "",
    `- [Download UniClipboard](${pageUrl([...sourcePath, "download"])})`,
    "- [Source code](https://github.com/UniClipboard/UniClipboard)",
    `- [Full content index](${pageUrl(["llms.txt"])})`,
  ].join("\n");
}

async function renderHub(
  locale: ArticleLocale,
  category: ArticleCategoryValue,
  sourcePath: string[],
) {
  const t = await getTranslations({
    locale,
    namespace: CATEGORY_NAMESPACE[category],
  });
  const articles = await getPublishedArticlesByCategory(category, locale);
  const prefix = localePathPrefix(locale);
  const path = CATEGORY_PATHS[category];

  const lines = [`# ${t("title")}`, "", t("subtitle"), "", "## Articles", ""];
  for (const article of articles) {
    const url = `${siteConfig.url.replace(/\/$/, "")}${prefix}/${path}/${article.slug}`;
    lines.push(
      `- [${article.content.hero.title}](${url}) - ${article.content.hero.subtitle}`,
    );
  }
  if (articles.length === 0) lines.push(t("emptyState"));
  lines.push("", `> Source: ${pageUrl(sourcePath)}`);
  return lines.join("\n");
}

async function renderArticlePage(
  locale: ArticleLocale,
  category: ArticleCategoryValue,
  slug: string,
  sourcePath: string[],
) {
  const article = await getArticle(category, slug, locale);
  if (!article) return null;
  return [
    `> Source: ${pageUrl(sourcePath)}`,
    `> Published: ${article.datePublished}`,
    `> Last updated: ${article.content.meta.lastUpdatedDate}`,
    "",
    renderArticle(article.content),
  ].join("\n");
}

async function renderChangelog(locale: string, sourcePath: string[]) {
  const t = await getTranslations({ locale, namespace: "changelogHub" });
  const releases = await Promise.all(
    (await getAllReleaseVersions()).map(async (release) => ({
      release,
      entry: await getReleaseByVersion(release.version),
    })),
  );
  const lines = [`# ${t("title")}`, "", t("subtitle"), ""];
  for (const { release, entry } of releases) {
    if (!entry) continue;
    const notes = locale === "zh" ? entry.notesZh : entry.notesEn;
    const url = `${siteConfig.url.replace(/\/$/, "")}${localePathPrefix(locale)}/changelog/${release.version}`;
    lines.push(`## [v${release.version}](${url})`, "", notes.trim(), "");
  }
  if (releases.length === 0) lines.push(t("emptyState"), "");
  lines.push(`> Source: ${pageUrl(sourcePath)}`);
  return lines.join("\n");
}

async function renderRelease(
  locale: string,
  version: string,
  sourcePath: string[],
) {
  const release = await getReleaseByVersion(version);
  if (!release) return null;
  const notes = locale === "zh" ? release.notesZh : release.notesEn;
  return [
    `> Source: ${pageUrl(sourcePath)}`,
    `> Released: ${release.pubDate.toISOString().slice(0, 10)}`,
    "",
    `# Release notes v${release.version}`,
    "",
    notes.replace(/^##\s+.+\s*\n+/m, "").trim(),
  ].join("\n");
}

async function renderInfoPage(
  locale: string,
  sourcePath: string[],
  namespace: "downloadPage" | "landing.sponsor",
  heading: string,
  links: string[],
) {
  const t = await getTranslations({ locale, namespace });
  return [
    `# ${heading}`,
    "",
    t("seoDescription"),
    "",
    "## Links",
    "",
    ...links,
    "",
    `> Source: ${pageUrl(sourcePath)}`,
  ].join("\n");
}

export async function generateStaticParams() {
  const articles = await getAllPublishedSlugs();
  const releases = await getAllReleaseVersions();
  const localePaths = routing.locales.map((locale) =>
    locale === routing.defaultLocale ? [] : [locale],
  );
  const articlePaths = articles.flatMap((article) =>
    ARTICLE_LOCALES.map((locale) => [
      ...(locale === routing.defaultLocale ? [] : [locale]),
      CATEGORY_PATHS[article.category],
      article.slug,
    ]),
  );
  const hubPaths = ARTICLE_LOCALES.flatMap((locale) =>
    (Object.values(CATEGORY_PATHS) as string[]).map((category) => [
      ...(locale === routing.defaultLocale ? [] : [locale]),
      category,
    ]),
  );
  const changelogPaths = releases.flatMap((release) =>
    localePaths.map((localePath) => [
      ...localePath,
      "changelog",
      release.version,
    ]),
  );

  return [
    ...localePaths,
    ...localePaths.flatMap((localePath) => [
      [...localePath, "download"],
      [...localePath, "sponsor"],
      [...localePath, "changelog"],
    ]),
    ...hubPaths,
    ...articlePaths,
    ...changelogPaths,
  ].map((path) => ({ path }));
}

export async function GET(_: Request, { params }: RouteContext) {
  const sourcePath = (await params).path ?? [];
  const { locale, rest } = splitLocale(sourcePath);

  if (rest.length === 0) {
    return markdownResponse(await renderHome(locale, sourcePath));
  }

  const [section, slug] = rest;
  if (section === "whitepaper" && rest.length === 1) {
    return Response.redirect(
      new URL(`${localePathPrefix(locale)}/blog/whitepaper`, siteConfig.url),
      308,
    );
  }

  if (section === "download" && rest.length === 1) {
    const t = await getTranslations({ locale, namespace: "downloadPage" });
    return markdownResponse(
      await renderInfoPage(
        locale,
        sourcePath,
        "downloadPage",
        t("hero.title"),
        [
          "- [Download latest release](https://github.com/UniClipboard/UniClipboard/releases/latest)",
          "- [iOS public beta](https://testflight.apple.com/join/SGiHUSGq)",
          "- [Android releases](https://github.com/UniClipboard/UniClipboard/releases/latest)",
        ],
      ),
    );
  }

  if (section === "sponsor" && rest.length === 1) {
    const t = await getTranslations({ locale, namespace: "landing.sponsor" });
    return markdownResponse(
      await renderInfoPage(
        locale,
        sourcePath,
        "landing.sponsor",
        t("hero.title"),
        [
          "- [Sponsor on GitHub](https://github.com/sponsors/mkdir700)",
          "- [UniClipboard source code](https://github.com/UniClipboard/UniClipboard)",
        ],
      ),
    );
  }

  if (section === "changelog") {
    const body =
      rest.length === 1
        ? await renderChangelog(locale, sourcePath)
        : rest.length === 2 && slug
          ? await renderRelease(locale, slug, sourcePath)
          : null;
    return body ? markdownResponse(body) : notFound();
  }

  const category = (
    Object.entries(CATEGORY_PATHS) as [ArticleCategoryValue, string][]
  ).find(([, path]) => path === section)?.[0];
  if (!category || !isArticleLocale(locale)) return notFound();

  const body =
    rest.length === 1
      ? await renderHub(locale, category, sourcePath)
      : rest.length === 2 && slug
        ? await renderArticlePage(locale, category, slug, sourcePath)
        : null;
  return body ? markdownResponse(body) : notFound();
}

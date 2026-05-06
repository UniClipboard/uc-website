import "server-only";

import rehypeShiki from "@shikijs/rehype";
import type { Element, Root } from "hast";
import { toHtml } from "hast-util-to-html";
import { toString as hastToString } from "hast-util-to-string";
import { unstable_cache } from "next/cache";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import { articleCacheTag } from "@/db/articles";
import type {
  ArticleCategoryValue,
  ArticleLocale,
} from "@/lib/article-content";

export type TocItem = {
  id: string;
  title: string;
};

export type RenderedArticle = {
  html: string;
  toc: TocItem[];
};

const slugifyHeading = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "section";

const headingIdPlugin = (toc: TocItem[]) => () => (tree: Root) => {
  const seen = new Map<string, number>();
  visit(tree, "element", (node: Element) => {
    if (node.tagName !== "h2") return;
    const title = hastToString(node).trim();
    if (!title) return;
    const base = slugifyHeading(title);
    const next = (seen.get(base) ?? 0) + 1;
    seen.set(base, next);
    const id = next === 1 ? base : `${base}-${next}`;
    node.properties = node.properties ?? {};
    node.properties.id = id;
    const existing = node.properties.className;
    const classes = Array.isArray(existing)
      ? existing.map(String)
      : typeof existing === "string"
        ? existing.split(/\s+/).filter(Boolean)
        : [];
    if (!classes.includes("scroll-mt-28")) classes.push("scroll-mt-28");
    node.properties.className = classes;
    toc.push({ id, title });
  });
};

async function renderArticleMarkdownRaw(
  body: string,
): Promise<RenderedArticle> {
  const toc: TocItem[] = [];
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeShiki, {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    })
    .use(headingIdPlugin(toc));
  const mdast = processor.parse(body);
  const hast = (await processor.run(mdast)) as Root;
  return { html: toHtml(hast), toc };
}

export const renderArticleMarkdown = (
  category: ArticleCategoryValue,
  slug: string,
  locale: ArticleLocale,
  lastUpdatedDate: string,
  body: string,
): Promise<RenderedArticle> =>
  unstable_cache(
    () => renderArticleMarkdownRaw(body),
    ["article-markdown", category, slug, locale, lastUpdatedDate],
    { tags: [articleCacheTag(category, slug)] },
  )();

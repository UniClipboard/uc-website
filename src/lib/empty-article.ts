import {
  type ArticleCategoryValue,
  type ArticleContent,
  CATEGORY_CONTENT_TYPE,
  type MarkdownArticleContent,
  type TemplateArticleContent,
} from "./article-content";

export function emptyTemplateContent(): TemplateArticleContent {
  return {
    contentType: "template",
    seo: { title: "", description: "", keywords: "", ogAlt: "" },
    hero: { eyebrow: "", title: "", subtitle: "", lede: "" },
    meta: {
      breadcrumbCurrent: "",
      lastUpdatedLabel: "Last updated",
      lastUpdatedDate: new Date().toISOString().slice(0, 10),
    },
    tldr: { eyebrow: "TL;DR", title: "", items: [""] },
    twoColumn: {
      left: { eyebrow: "", title: "", body: "" },
      right: { eyebrow: "", title: "", body: "" },
    },
    comparison: {
      eyebrow: "Side-by-side",
      title: "",
      note: "",
      headers: { feature: "Feature", uc: "UniClipboard", other: "" },
      rows: [{ feature: "", uc: "", other: "" }],
    },
    steps: { eyebrow: "", title: "", items: [""] },
    verdict: { eyebrow: "Verdict", title: "", body: "" },
    faq: { eyebrow: "FAQ", title: "", items: [{ q: "", a: "" }] },
    cta: {
      eyebrow: "",
      title: "",
      body: "",
      primary: "See downloads",
      secondary: "Read the whitepaper",
    },
    about: [],
  };
}

export function emptyMarkdownContent(): MarkdownArticleContent {
  return {
    contentType: "markdown",
    seo: { title: "", description: "", keywords: "", ogAlt: "" },
    hero: { title: "", subtitle: "" },
    meta: {
      breadcrumbCurrent: "",
      lastUpdatedLabel: "Last updated",
      lastUpdatedDate: new Date().toISOString().slice(0, 10),
    },
    body: "",
  };
}

export function emptyArticleContent(
  contentType: ArticleContent["contentType"],
): ArticleContent {
  return contentType === "markdown"
    ? emptyMarkdownContent()
    : emptyTemplateContent();
}

export function emptyContentForCategory(
  category: ArticleCategoryValue,
): ArticleContent {
  return emptyArticleContent(CATEGORY_CONTENT_TYPE[category]);
}

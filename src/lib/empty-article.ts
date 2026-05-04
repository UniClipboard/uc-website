import type { ArticleContent } from "./article-content";

export function emptyArticleContent(): ArticleContent {
  return {
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

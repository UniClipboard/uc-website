export type ArticleCategory = "compare" | "use-cases";

export type ArticleManifestEntry = {
  slug: string;
  category: ArticleCategory;
  namespace: string;
  datePublished: string;
};

export const articleManifest: ArticleManifestEntry[] = [
  {
    slug: "icloud-universal-clipboard",
    category: "compare",
    namespace: "compare.icloud",
    datePublished: "2026-05-04",
  },
  {
    slug: "maccy",
    category: "compare",
    namespace: "compare.maccy",
    datePublished: "2026-05-04",
  },
  {
    slug: "mac-to-windows-clipboard",
    category: "use-cases",
    namespace: "useCases.macToWindows",
    datePublished: "2026-05-04",
  },
];

export const articleHref = (entry: ArticleManifestEntry) =>
  `/${entry.category}/${entry.slug}`;

export const articlesByCategory = (category: ArticleCategory) =>
  articleManifest.filter((a) => a.category === category);

import { z } from "zod";

const nonEmpty = z.string().trim().min(1);

export const articleSeoSchema = z.object({
  title: nonEmpty,
  description: nonEmpty,
  keywords: nonEmpty,
  ogAlt: nonEmpty,
});

export const articleMetaSchema = z.object({
  breadcrumbCurrent: nonEmpty,
  lastUpdatedLabel: nonEmpty,
  lastUpdatedDate: nonEmpty,
});

// Template (compare / use-cases) — strict marketing-style hero with all fields
export const templateHeroSchema = z.object({
  eyebrow: nonEmpty,
  title: nonEmpty,
  subtitle: nonEmpty,
  lede: nonEmpty,
});

// Markdown (blog) — relaxed hero, only title is required
export const markdownHeroSchema = z.object({
  title: nonEmpty,
  subtitle: z.string().trim().default(""),
});

export const articleTldrSchema = z.object({
  eyebrow: nonEmpty,
  title: nonEmpty,
  items: z.array(nonEmpty).min(1),
});

export const articleTwoColumnSchema = z.object({
  left: z.object({
    eyebrow: nonEmpty,
    title: nonEmpty,
    body: nonEmpty,
  }),
  right: z.object({
    eyebrow: nonEmpty,
    title: nonEmpty,
    body: nonEmpty,
  }),
});

export const articleComparisonRowSchema = z.object({
  feature: nonEmpty,
  uc: nonEmpty,
  other: nonEmpty,
});

export const articleComparisonSchema = z.object({
  eyebrow: nonEmpty,
  title: nonEmpty,
  note: z.string().trim().default(""),
  headers: z.object({
    feature: nonEmpty,
    uc: nonEmpty,
    other: nonEmpty,
  }),
  rows: z.array(articleComparisonRowSchema).min(1),
});

export const articleStepsSchema = z.object({
  eyebrow: nonEmpty,
  title: nonEmpty,
  items: z.array(nonEmpty).min(1),
});

export const articleVerdictSchema = z.object({
  eyebrow: nonEmpty,
  title: nonEmpty,
  body: nonEmpty,
});

export const articleFaqItemSchema = z.object({
  q: nonEmpty,
  a: nonEmpty,
});

export const articleFaqSchema = z.object({
  eyebrow: nonEmpty,
  title: nonEmpty,
  items: z.array(articleFaqItemSchema).min(1),
});

export const articleCtaSchema = z.object({
  eyebrow: nonEmpty,
  title: nonEmpty,
  body: nonEmpty,
  primary: nonEmpty,
  secondary: nonEmpty,
});

export const articleHowToSchema = z.object({
  tools: z.array(nonEmpty).min(1),
  totalTime: z.string().trim().optional(),
});

export const templateArticleContentSchema = z.object({
  contentType: z.literal("template"),
  seo: articleSeoSchema,
  hero: templateHeroSchema,
  meta: articleMetaSchema,
  tldr: articleTldrSchema,
  twoColumn: articleTwoColumnSchema,
  comparison: articleComparisonSchema,
  steps: articleStepsSchema,
  verdict: articleVerdictSchema,
  faq: articleFaqSchema,
  cta: articleCtaSchema,
  about: z.array(nonEmpty).default([]),
  howTo: articleHowToSchema.optional(),
});

export const markdownArticleContentSchema = z.object({
  contentType: z.literal("markdown"),
  seo: articleSeoSchema,
  hero: markdownHeroSchema,
  meta: articleMetaSchema,
  body: nonEmpty,
});

// Backward-compat: legacy rows in DB don't have `contentType` — default to template.
export const articleContentSchema = z.preprocess(
  (val) => {
    if (
      val &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      !("contentType" in (val as Record<string, unknown>))
    ) {
      return { ...(val as Record<string, unknown>), contentType: "template" };
    }
    return val;
  },
  z.discriminatedUnion("contentType", [
    templateArticleContentSchema,
    markdownArticleContentSchema,
  ]),
);

export type TemplateArticleContent = z.infer<
  typeof templateArticleContentSchema
>;
export type MarkdownArticleContent = z.infer<
  typeof markdownArticleContentSchema
>;
export type ArticleContent = z.infer<typeof articleContentSchema>;

export type ArticleComparisonRow = z.infer<typeof articleComparisonRowSchema>;
export type ArticleFaqItem = z.infer<typeof articleFaqItemSchema>;

export const ARTICLE_CATEGORIES = ["compare", "use-cases", "blog"] as const;
export type ArticleCategoryValue = (typeof ARTICLE_CATEGORIES)[number];

// Each category currently maps to a single content type. Keep this as the
// source of truth so the editor / UI can derive the right form from category.
export const CATEGORY_CONTENT_TYPE: Record<
  ArticleCategoryValue,
  ArticleContent["contentType"]
> = {
  compare: "template",
  "use-cases": "template",
  blog: "markdown",
};

// Articles are authored per-locale in the DB, so this list is narrower than
// `routing.locales`: a locale the site's chrome is translated into does not
// automatically have article content. Routes under a category must 404 for
// locales absent here rather than render an empty hub.
export const ARTICLE_LOCALES = ["en", "zh"] as const;
export type ArticleLocale = (typeof ARTICLE_LOCALES)[number];

export const isArticleLocale = (locale: string): locale is ArticleLocale =>
  (ARTICLE_LOCALES as readonly string[]).includes(locale);

export const ARTICLE_STATUSES = ["draft", "published"] as const;
export type ArticleStatusValue = (typeof ARTICLE_STATUSES)[number];

export const articleSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(96)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i, {
    message: "slug must be lowercase letters, digits, and hyphens",
  });

export const articleUpsertSchema = z
  .object({
    slug: articleSlugSchema,
    category: z.enum(ARTICLE_CATEGORIES),
    datePublished: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "expected YYYY-MM-DD" }),
    status: z.enum(ARTICLE_STATUSES).default("draft"),
    translations: z.object({
      en: articleContentSchema,
      zh: articleContentSchema,
    }),
  })
  .refine(
    (data) => {
      const expected = CATEGORY_CONTENT_TYPE[data.category];
      return (
        data.translations.en.contentType === expected &&
        data.translations.zh.contentType === expected
      );
    },
    {
      message:
        "translations.contentType must match the category's content type",
      path: ["translations"],
    },
  );

export type ArticleUpsertInput = z.infer<typeof articleUpsertSchema>;

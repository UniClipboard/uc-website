import { z } from "zod";

const nonEmpty = z.string().trim().min(1);

export const articleSeoSchema = z.object({
  title: nonEmpty,
  description: nonEmpty,
  keywords: nonEmpty,
  ogAlt: nonEmpty,
});

export const articleHeroSchema = z.object({
  eyebrow: nonEmpty,
  title: nonEmpty,
  subtitle: nonEmpty,
  lede: nonEmpty,
});

export const articleMetaSchema = z.object({
  breadcrumbCurrent: nonEmpty,
  lastUpdatedLabel: nonEmpty,
  lastUpdatedDate: nonEmpty,
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

export const articleContentSchema = z.object({
  seo: articleSeoSchema,
  hero: articleHeroSchema,
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

export type ArticleContent = z.infer<typeof articleContentSchema>;
export type ArticleComparisonRow = z.infer<typeof articleComparisonRowSchema>;
export type ArticleFaqItem = z.infer<typeof articleFaqItemSchema>;

export const ARTICLE_CATEGORIES = ["compare", "use-cases"] as const;
export type ArticleCategoryValue = (typeof ARTICLE_CATEGORIES)[number];

export const ARTICLE_LOCALES = ["en", "zh"] as const;
export type ArticleLocale = (typeof ARTICLE_LOCALES)[number];

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

export const articleUpsertSchema = z.object({
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
});

export type ArticleUpsertInput = z.infer<typeof articleUpsertSchema>;

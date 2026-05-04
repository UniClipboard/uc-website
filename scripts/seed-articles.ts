import "dotenv/config";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm/sql";
import postgres from "postgres";

import { articles, articleTranslations } from "../src/db/schema";
import {
  type ArticleContent,
  articleContentSchema,
} from "../src/lib/article-content";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

type LegacyPayload = {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogAlt: string;
  breadcrumbCurrent: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  lede: string;
  tldrEyebrow: string;
  tldrTitle: string;
  tldrItems: string[];
  section1Eyebrow: string;
  section1Title: string;
  section1Body: string;
  section2Eyebrow: string;
  section2Title: string;
  section2Body: string;
  tableEyebrow: string;
  tableTitle: string;
  tableNote: string;
  tableHeader: { feature: string; uc: string; other: string };
  rows: { feature: string; uc: string; other: string }[];
  switchEyebrow: string;
  switchTitle: string;
  switchSteps: string[];
  verdictEyebrow: string;
  verdictTitle: string;
  verdictBody: string;
  faqEyebrow: string;
  faqTitle: string;
  faqItems: { q: string; a: string }[];
  ctaEyebrow: string;
  ctaTitle: string;
  ctaBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
  lastUpdatedLabel: string;
  lastUpdatedDate: string;
};

function transform(
  legacy: LegacyPayload,
  extras: { about?: string[]; howTo?: ArticleContent["howTo"] },
): ArticleContent {
  return {
    seo: {
      title: legacy.seoTitle,
      description: legacy.seoDescription,
      keywords: legacy.seoKeywords,
      ogAlt: legacy.ogAlt,
    },
    hero: {
      eyebrow: legacy.eyebrow,
      title: legacy.title,
      subtitle: legacy.subtitle,
      lede: legacy.lede,
    },
    meta: {
      breadcrumbCurrent: legacy.breadcrumbCurrent,
      lastUpdatedLabel: legacy.lastUpdatedLabel,
      lastUpdatedDate: legacy.lastUpdatedDate,
    },
    tldr: {
      eyebrow: legacy.tldrEyebrow,
      title: legacy.tldrTitle,
      items: legacy.tldrItems,
    },
    twoColumn: {
      left: {
        eyebrow: legacy.section1Eyebrow,
        title: legacy.section1Title,
        body: legacy.section1Body,
      },
      right: {
        eyebrow: legacy.section2Eyebrow,
        title: legacy.section2Title,
        body: legacy.section2Body,
      },
    },
    comparison: {
      eyebrow: legacy.tableEyebrow,
      title: legacy.tableTitle,
      note: legacy.tableNote ?? "",
      headers: legacy.tableHeader,
      rows: legacy.rows,
    },
    steps: {
      eyebrow: legacy.switchEyebrow,
      title: legacy.switchTitle,
      items: legacy.switchSteps,
    },
    verdict: {
      eyebrow: legacy.verdictEyebrow,
      title: legacy.verdictTitle,
      body: legacy.verdictBody,
    },
    faq: {
      eyebrow: legacy.faqEyebrow,
      title: legacy.faqTitle,
      items: legacy.faqItems,
    },
    cta: {
      eyebrow: legacy.ctaEyebrow,
      title: legacy.ctaTitle,
      body: legacy.ctaBody,
      primary: legacy.ctaPrimary,
      secondary: legacy.ctaSecondary,
    },
    about: extras.about ?? [],
    ...(extras.howTo ? { howTo: extras.howTo } : {}),
  };
}

type SeedSpec = {
  slug: string;
  category: "compare" | "use-cases";
  datePublished: string;
  enPath: (root: Record<string, unknown>) => LegacyPayload;
  zhPath: (root: Record<string, unknown>) => LegacyPayload;
  about?: string[];
  howTo?: ArticleContent["howTo"];
};

const pickEn = (root: Record<string, unknown>, path: string[]): LegacyPayload =>
  path.reduce<unknown>(
    (acc, key) => (acc as Record<string, unknown>)[key],
    root,
  ) as LegacyPayload;

const SEEDS: SeedSpec[] = [
  {
    slug: "icloud-universal-clipboard",
    category: "compare",
    datePublished: "2026-05-04",
    enPath: (r) => pickEn(r, ["compare", "icloud"]),
    zhPath: (r) => pickEn(r, ["compare", "icloud"]),
    about: ["iCloud Universal Clipboard"],
  },
  {
    slug: "maccy",
    category: "compare",
    datePublished: "2026-05-04",
    enPath: (r) => pickEn(r, ["compare", "maccy"]),
    zhPath: (r) => pickEn(r, ["compare", "maccy"]),
    about: ["Maccy"],
  },
  {
    slug: "mac-to-windows-clipboard",
    category: "use-cases",
    datePublished: "2026-05-04",
    enPath: (r) => pickEn(r, ["useCases", "macToWindows"]),
    zhPath: (r) => pickEn(r, ["useCases", "macToWindows"]),
    howTo: {
      totalTime: "PT5M",
      tools: [
        "Mac running macOS 12 or newer",
        "Windows 10 or 11 PC",
        "UniClipboard app",
      ],
    },
  },
];

async function main() {
  const enRoot = JSON.parse(
    readFileSync(resolve("messages/en.json"), "utf8"),
  ) as Record<string, unknown>;
  const zhRoot = JSON.parse(
    readFileSync(resolve("messages/zh.json"), "utf8"),
  ) as Record<string, unknown>;

  const client = postgres(url!, { max: 1 });
  const db = drizzle(client);

  for (const spec of SEEDS) {
    const enLegacy = spec.enPath(enRoot);
    const zhLegacy = spec.zhPath(zhRoot);
    const enContent = articleContentSchema.parse(
      transform(enLegacy, { about: spec.about, howTo: spec.howTo }),
    );
    const zhContent = articleContentSchema.parse(
      transform(zhLegacy, { about: spec.about, howTo: spec.howTo }),
    );

    const [existing] = await db
      .select()
      .from(articles)
      .where(
        sql`${articles.category} = ${spec.category} and ${articles.slug} = ${spec.slug}`,
      );

    let articleId: string;
    if (existing) {
      articleId = existing.id;
      await db
        .update(articles)
        .set({
          datePublished: spec.datePublished,
          status: "published",
          updatedAt: new Date(),
        })
        .where(sql`${articles.id} = ${articleId}`);
      console.log(`updated article ${spec.category}/${spec.slug}`);
    } else {
      const [inserted] = await db
        .insert(articles)
        .values({
          slug: spec.slug,
          category: spec.category,
          datePublished: spec.datePublished,
          status: "published",
        })
        .returning({ id: articles.id });
      articleId = inserted.id;
      console.log(`inserted article ${spec.category}/${spec.slug}`);
    }

    for (const [locale, payload] of [
      ["en", enContent],
      ["zh", zhContent],
    ] as const) {
      await db
        .insert(articleTranslations)
        .values({ articleId, locale, payload })
        .onConflictDoUpdate({
          target: [articleTranslations.articleId, articleTranslations.locale],
          set: { payload, updatedAt: new Date() },
        });
    }
  }

  console.log("Seed complete.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

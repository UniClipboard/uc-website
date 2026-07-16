import { MetadataRoute } from "next";

import { getAllPublishedSlugs } from "@/db/articles";
import { getAllReleaseVersions } from "@/db/releases";
import { env } from "@/env.mjs";
import { localePathPrefix } from "@/i18n/locale-meta";
import { routing } from "@/i18n/routing";
import { ARTICLE_LOCALES } from "@/lib/article-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (env.APP_URL || "https://www.uniclipboard.app").replace(
    /\/$/,
    "",
  );

  const [articles, releaseVersions] = await Promise.all([
    getAllPublishedSlugs(),
    getAllReleaseVersions().catch(() => []),
  ]);

  // Article routes exist only in the locales their content was authored in and
  // 404 elsewhere, so they are emitted for ARTICLE_LOCALES rather than every
  // routed locale. The rest of the site is translated for all of them.
  const pages = [
    { path: "", priority: 1, changeFrequency: "monthly" as const },
    { path: "download", priority: 0.95, changeFrequency: "weekly" as const },
    {
      path: "compare",
      priority: 0.85,
      changeFrequency: "monthly" as const,
      locales: ARTICLE_LOCALES,
    },
    {
      path: "use-cases",
      priority: 0.85,
      changeFrequency: "monthly" as const,
      locales: ARTICLE_LOCALES,
    },
    {
      path: "blog",
      priority: 0.85,
      changeFrequency: "weekly" as const,
      locales: ARTICLE_LOCALES,
    },
    { path: "changelog", priority: 0.8, changeFrequency: "weekly" as const },
    ...articles.map((article) => ({
      path: `${article.category}/${article.slug}`,
      priority: 0.9,
      changeFrequency: "monthly" as const,
      lastModified: article.updatedAt,
      locales: ARTICLE_LOCALES,
    })),
    ...releaseVersions.map((release) => ({
      path: `changelog/${release.version}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
      lastModified: release.updatedAt,
    })),
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    const locales: readonly string[] =
      "locales" in page && page.locales ? page.locales : routing.locales;

    for (const locale of locales) {
      const pathSegment = page.path ? `/${page.path}` : "";
      const url = `${baseUrl}${localePathPrefix(locale)}${pathSegment}`;

      sitemap.push({
        url: url || baseUrl,
        lastModified:
          "lastModified" in page && page.lastModified
            ? page.lastModified
            : new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
  }

  return sitemap;
}

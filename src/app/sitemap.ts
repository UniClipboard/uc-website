import { MetadataRoute } from "next";

import { getAllPublishedSlugs } from "@/db/articles";
import { getAllReleaseVersions } from "@/db/releases";
import { env } from "@/env.mjs";
import { routing } from "@/i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (env.APP_URL || "https://www.uniclipboard.app").replace(
    /\/$/,
    "",
  );

  const [articles, releaseVersions] = await Promise.all([
    getAllPublishedSlugs(),
    getAllReleaseVersions().catch(() => []),
  ]);

  const pages = [
    { path: "", priority: 1, changeFrequency: "monthly" as const },
    { path: "compare", priority: 0.85, changeFrequency: "monthly" as const },
    { path: "use-cases", priority: 0.85, changeFrequency: "monthly" as const },
    { path: "blog", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "changelog", priority: 0.8, changeFrequency: "weekly" as const },
    ...articles.map((article) => ({
      path: `${article.category}/${article.slug}`,
      priority: 0.9,
      changeFrequency: "monthly" as const,
      lastModified: article.updatedAt,
    })),
    ...releaseVersions.map((release) => ({
      path: `changelog/${release.version}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
      lastModified: release.updatedAt,
    })),
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const page of pages) {
      const localizedSegment =
        locale === routing.defaultLocale ? "" : `/${locale}`;
      const pathSegment = page.path ? `/${page.path}` : "";
      const url = `${baseUrl}${localizedSegment}${pathSegment}` || baseUrl;

      sitemap.push({
        url,
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

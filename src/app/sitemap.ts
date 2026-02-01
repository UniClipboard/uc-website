import { MetadataRoute } from "next";

import { env } from "@/env.mjs";
import { routing } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.APP_URL || "https://www.uniclipboard.app";

  const pages = [
    { path: "", priority: 1, changeFrequency: "monthly" as const },
    { path: "whitepaper", priority: 0.8, changeFrequency: "yearly" as const },
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const page of pages) {
      const url =
        locale === routing.defaultLocale
          ? `${baseUrl}${page.path}`
          : `${baseUrl}/${locale}${page.path}`;

      sitemap.push({
        url,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
  }

  return sitemap;
}

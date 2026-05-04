import { MetadataRoute } from "next";

import { env } from "@/env.mjs";
import { routing } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (env.APP_URL || "https://www.uniclipboard.app").replace(
    /\/$/,
    "",
  );

  const pages = [
    { path: "", priority: 1, changeFrequency: "monthly" as const },
    { path: "whitepaper", priority: 0.8, changeFrequency: "yearly" as const },
    {
      path: "compare/icloud-universal-clipboard",
      priority: 0.9,
      changeFrequency: "monthly" as const,
    },
    {
      path: "use-cases/mac-to-windows-clipboard",
      priority: 0.9,
      changeFrequency: "monthly" as const,
    },
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
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
  }

  return sitemap;
}

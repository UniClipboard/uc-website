import { MetadataRoute } from "next";

import { env } from "@/env.mjs";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.APP_URL || "https://www.uniclipboard.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

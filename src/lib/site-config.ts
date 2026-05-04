import { env } from "@/env.mjs";

export const siteConfig = {
  brand: "UniClipboard",
  url: env.APP_URL,
  verification: {
    google: env.GOOGLE_SITE_VERIFICATION_ID || "",
    bing: env.BING_SITE_VERIFICATION_ID || "",
    baidu: env.BAIDU_SITE_VERIFICATION_ID || "",
    yandex: env.YANDEX_SITE_VERIFICATION_ID || "",
  },
  analytics: {
    gaMeasurementId: env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
  },
};

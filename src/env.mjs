import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Database
    DATABASE_URL: z.string().optional(),

    // App URL
    APP_URL: z.string().url().optional().default("http://localhost:3000"),

    // Search engine site verification - all optional
    GOOGLE_SITE_VERIFICATION_ID: z.string().optional(),
    BING_SITE_VERIFICATION_ID: z.string().optional(),
    BAIDU_SITE_VERIFICATION_ID: z.string().optional(),
    YANDEX_SITE_VERIFICATION_ID: z.string().optional(),

    // Clerk
    CLERK_SECRET_KEY: z.string().optional(),

    // Admin allowlist - comma-separated email addresses
    ADMIN_EMAILS: z.string().optional(),

    // Cron secret for /api/cron/* (Vercel sets `Authorization: Bearer <secret>`)
    CRON_SECRET: z.string().optional(),
  },
  client: {
    // Google Analytics 4 measurement ID (e.g. G-XXXXXXXXXX)
    NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),

    // Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().optional().default("/admin/sign-in"),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().optional().default("/admin/sign-in"),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    APP_URL: process.env.APP_URL,
    GOOGLE_SITE_VERIFICATION_ID: process.env.GOOGLE_SITE_VERIFICATION_ID,
    BING_SITE_VERIFICATION_ID: process.env.BING_SITE_VERIFICATION_ID,
    BAIDU_SITE_VERIFICATION_ID: process.env.BAIDU_SITE_VERIFICATION_ID,
    YANDEX_SITE_VERIFICATION_ID: process.env.YANDEX_SITE_VERIFICATION_ID,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    CRON_SECRET: process.env.CRON_SECRET,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  },
  // Treat empty-string env vars (e.g. unset CI secrets passed through `env:`)
  // as undefined so optional URL/string fields don't fail format validation.
  emptyStringAsUndefined: true,
});

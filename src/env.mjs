import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Database - optional for landing page only
    DATABASE_URL: z.string().optional(),

    // App URL - optional, defaults to localhost
    APP_URL: z.string().url().optional().default("http://localhost:3000"),

    // Google verification - not required
    GOOGLE_SITE_VERIFICATION_ID: z.string().optional(),

    // GitHub OAuth - optional for landing page only
    GITHUB_ID: z.string().optional(),
    GITHUB_SECRET: z.string().optional(),

    // NextAuth - optional for landing page only
    NEXTAUTH_URL: z.string().url().optional(),
    NEXTAUTH_SECRET: z.string().optional(),

    // Stripe - optional for landing page only
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET_KEY: z.string().optional(),
    STRIPE_SUBSCRIPTION_PRICE_ID: z.string().optional(),
  },
  client: {
    // Stripe public key - optional for landing page only
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    APP_URL: process.env.APP_URL,
    GOOGLE_SITE_VERIFICATION_ID: process.env.GOOGLE_SITE_VERIFICATION_ID,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET_KEY: process.env.STRIPE_WEBHOOK_SECRET_KEY,
    STRIPE_SUBSCRIPTION_PRICE_ID: process.env.STRIPE_SUBSCRIPTION_PRICE_ID,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
});

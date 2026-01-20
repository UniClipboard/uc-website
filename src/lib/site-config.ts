import { env } from "@/env.mjs";

export const siteConfig = {
  title: "UniClipboard | Safe & Efficient Universal Clipboard",
  description:
    "Secure, fast, and seamless clipboard synchronization across all your devices. Move text and images between devices with end-to-end encryption.",
  keywords: [
    "UniClipboard",
    "clipboard",
    "cross-platform",
    "synchronization",
    "E2E encryption",
    "productivity",
  ],
  url: env.APP_URL,
  googleSiteVerificationId: env.GOOGLE_SITE_VERIFICATION_ID || "",
};

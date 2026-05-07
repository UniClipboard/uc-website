import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const STATIC_ASSET_PATTERN =
  "/:path*\\.(jpg|jpeg|png|webp|avif|svg|ico|woff|woff2)";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["@takumi-rs/core"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "@radix-ui/react-slot",
      "next-intl",
      "react-markdown",
    ],
  },
  async headers() {
    return [
      {
        source: STATIC_ASSET_PATTERN,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);

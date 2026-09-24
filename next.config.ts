import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const STATIC_ASSET_PATTERN =
  "/:path*\\.(jpg|jpeg|png|webp|avif|svg|ico|woff|woff2)";

// The /try page's tailcat wasm build. File names carry the pinned commit, so
// the files never change in place (see scripts/build-tailcat-wasm.sh).
const TAILCAT_ASSET_PATTERN = "/tailcat/:file*\\.(js|gz|wasm)";

const DOCS_ORIGIN =
  process.env.DOCS_ORIGIN ??
  (process.env.VERCEL_ENV === "preview"
    ? "https://preview.docs.uniclipboard.app"
    : "https://docs.uniclipboard.app");

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
    const immutable = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];
    return [
      { source: STATIC_ASSET_PATTERN, headers: immutable },
      { source: TAILCAT_ASSET_PATTERN, headers: immutable },
    ];
  },
  async redirects() {
    return [
      {
        source: "/docs",
        destination: DOCS_ORIGIN,
        permanent: true,
      },
      {
        source: "/docs/:path*",
        destination: `${DOCS_ORIGIN}/:path*`,
        permanent: true,
      },
      {
        source: "/install.sh",
        destination:
          "https://cdn.jsdelivr.net/gh/UniClipboard/UniClipboard@main/scripts/install.sh",
        permanent: false,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);

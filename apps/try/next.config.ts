import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const config: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  // Lint shared and app source with the repository's existing ESLint command;
  // this independent build does not install the website's lint toolchain.
  eslint: { ignoreDuringBuilds: true },
  experimental: { optimizePackageImports: ["lucide-react", "next-intl"] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
      {
        source: "/tailcat/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    // Compatibility on this origin too. No fragment in Location: the browser
    // inherits it, and the destination captures it before hydration.
    return [
      { source: "/try", destination: "/", permanent: false },
      { source: "/en/try", destination: "/", permanent: false },
      {
        source: "/:locale(zh|ru)/try",
        destination: "/:locale",
        permanent: false,
      },
    ];
  },
};
export default createNextIntlPlugin("./src/i18n/request.ts")(config);

import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Vendored Go runtime shim for the tailcat wasm; its hash is pinned in
  // public/tailcat/manifest.json, so it must never be auto-fixed.
  { ignores: ["public/tailcat/**"] },
  ...compat.config({
    extends: [
      "next/core-web-vitals",
      "next/typescript",
      "prettier",
      "plugin:jsx-a11y/recommended",
    ],
    plugins: ["simple-import-sort"],
    rules: {
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
    },
  }),
  // Public pages must stay static/ISR: reading request headers or cookies
  // anywhere in their render tree opts the page into per-request SSR.
  {
    files: ["src/app/[[]locale]/**", "src/components/**", "src/lib/**"],
    ignores: [
      "src/app/[[]locale]/admin/**",
      "src/app/[[]locale]/sponsor/invite/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/headers",
              message:
                "Public pages must stay static; do not read request headers or cookies (see AGENTS.md).",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;

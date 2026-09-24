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
];

export default eslintConfig;

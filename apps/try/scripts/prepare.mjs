// Materialize only shared transfer inputs. The originals remain the sole source
// of truth; generated copies are ignored. This keeps installs and module
// resolution local to this app, without installing the marketing site's deps.
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const app = fileURLToPath(new URL("../", import.meta.url));
const repo = path.resolve(app, "../..");
for (const source of [
  "src/components/try",
  "src/components/theme-provider.tsx",
  "src/lib/web-transfer",
  "src/lib/utils.ts",
  "src/i18n/locale-meta.ts",
  "src/i18n/routing.ts",
]) {
  const target = path.join(app, ".shared", source);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(path.join(repo, source), target, { recursive: true });
}
await mkdir(path.join(app, ".shared/messages"), { recursive: true });
for (const locale of ["en", "zh", "ru"]) {
  const messages = JSON.parse(
    await readFile(path.join(repo, `messages/${locale}.json`), "utf8"),
  );
  await writeFile(
    path.join(app, `.shared/messages/${locale}.json`),
    JSON.stringify({ try: messages.try, nav: messages.landing.navigation }),
  );
}
await mkdir(path.join(app, "public"), { recursive: true });
await cp(path.join(repo, "public/tailcat"), path.join(app, "public/tailcat"), {
  recursive: true,
});

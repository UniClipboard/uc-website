// Materialize only shared transfer inputs. The originals remain the sole source
// of truth; generated copies are ignored. This keeps installs and module
// resolution local to this app, without installing the marketing site's deps.
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const app = fileURLToPath(new URL("../", import.meta.url));
const repo = path.resolve(app, "../..");
await rm(path.join(app, ".shared"), { recursive: true, force: true });
// Every repository input read below must also be listed in `ignoreCommand` in
// ../vercel.json, or a change to it will not trigger a deployment.
for (const source of [
  "src/components/try",
  "src/components/theme-provider.tsx",
  "src/lib/web-transfer",
  "src/lib/utils.ts",
]) {
  const target = path.join(app, ".shared", source);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(path.join(repo, source), target, { recursive: true });
}
// This app loads fonts for its own, wider locale set (src/components/fonts.ts).
await rm(path.join(app, ".shared/src/components/try/fonts.ts"));
await mkdir(path.join(app, ".shared/messages"), { recursive: true });
// en/zh/ru come from the website's message files, which the website's own
// /try page also renders. Locales only this site offers live in ./messages.
const read = async (file) => JSON.parse(await readFile(file, "utf8"));
const bundles = {};
for (const locale of ["en", "zh", "ru"]) {
  const messages = await read(path.join(repo, `messages/${locale}.json`));
  bundles[locale] = { try: messages.try, nav: messages.landing.navigation };
}
for (const file of await readdir(path.join(app, "messages"))) {
  bundles[path.basename(file, ".json")] = await read(
    path.join(app, "messages", file),
  );
}

// Every locale must carry the English key set with the same placeholders and
// tags, so a missing or broken translation fails the build instead of
// rendering a raw key. Only the nav keys this site uses are required.
const navKeys = ["language", "theme", "themeSystem", "themeLight", "themeDark"];
const flatten = (value, prefix = "") =>
  typeof value === "string"
    ? { [prefix]: value }
    : Object.assign(
        {},
        ...Object.entries(value).map(([k, v]) =>
          flatten(v, prefix ? `${prefix}.${k}` : k),
        ),
      );
const tokens = (text) =>
  [...text.matchAll(/\{(\w+)|<(\/?\w+)>/g)]
    .map((m) => m[1] ?? m[2])
    .sort()
    .join();
const pick = (bundle) => ({
  try: bundle.try,
  nav: Object.fromEntries(navKeys.map((k) => [k, bundle.nav?.[k]])),
});
const reference = flatten(pick(bundles.en));
const problems = [];
for (const [locale, bundle] of Object.entries(bundles)) {
  const flat = flatten(pick(bundle));
  for (const [key, text] of Object.entries(reference)) {
    if (typeof flat[key] !== "string" || !flat[key].trim())
      problems.push(`${locale}: missing ${key}`);
    else if (tokens(flat[key]) !== tokens(text))
      problems.push(`${locale}: placeholders differ in ${key}`);
  }
  for (const key of Object.keys(flat))
    if (!(key in reference)) problems.push(`${locale}: unknown ${key}`);
  await writeFile(
    path.join(app, `.shared/messages/${locale}.json`),
    JSON.stringify(pick(bundle)),
  );
}
if (problems.length) {
  console.error(`Message check failed:\n${problems.join("\n")}`);
  process.exit(1);
}
await mkdir(path.join(app, "public"), { recursive: true });
await cp(path.join(repo, "public/tailcat"), path.join(app, "public/tailcat"), {
  recursive: true,
});

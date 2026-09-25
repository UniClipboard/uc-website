/**
 * @jest-environment node
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Guards patches/next@*.patch: Google Fonts intermittently answers with an
// extensionless `/l/font?kit=` URL (vercel/next.js#99114), which made the
// unpatched loader fail the production build with
// "TypeError: Cannot read properties of null (reading '1')".
//
// The real loader runs in a child Node process: the next/jest preset maps
// every `@next/font` path to a stub inside Jest.
const HARNESS = `
const fs = require("node:fs");
const path = require("node:path");
const [dist, dir] = process.argv.slice(2);
const { getFontAxes } = require(path.join(dist, "get-font-axes.js"));
const { getGoogleFontsUrl } = require(path.join(dist, "get-google-fonts-url.js"));

const weights = ["400", "500", "600", "700"];
const url = getGoogleFontsUrl(
  "Inter Tight",
  getFontAxes("Inter Tight", weights, ["normal"], undefined),
  "swap",
);
// With mocked responses, a font URL starting with "/" is read from disk.
const woff = path.join(dir, "kit-woff");
fs.writeFileSync(woff, "wOFFdata");
const face = (subset, src) =>
  "/* " + subset + " */\\n@font-face {\\n  font-family: 'Inter Tight';\\n" +
  "  src: url(" + src + ") format('woff2');\\n}";
const css = [
  face("latin-ext", "https://fonts.gstatic.com/s/intertight/v1/a.woff2"),
  face("latin", "https://fonts.gstatic.com/l/font?kit=abc&skey=def&v=v1"),
  face("latin", woff),
].join("\\n");
const mock = path.join(dir, "mock.json");
fs.writeFileSync(mock, JSON.stringify({ [url]: css }));
process.env.NEXT_FONT_GOOGLE_MOCKED_RESPONSES = mock;

const exts = [];
require(path.join(dist, "loader.js"))
  .default({
    functionName: "Inter_Tight",
    data: [{ subsets: ["latin"], weight: weights, display: "swap" }],
    isDev: false,
    isServer: true,
    emitFontFile: (_buffer, ext) => {
      exts.push(ext);
      return "/_next/static/media/" + exts.length + "." + ext;
    },
  })
  .then(
    (result) => console.log(JSON.stringify({ exts, css: result.css })),
    (error) => console.log(JSON.stringify({ error: String(error) })),
  );
`;

describe("next/font/google loader", () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "next-font-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("self-hosts extensionless Google font URLs instead of failing", () => {
    const harness = path.join(dir, "harness.cjs");
    fs.writeFileSync(harness, HARNESS);
    const dist = path.join(
      process.cwd(),
      "node_modules/next/dist/compiled/@next/font/dist/google",
    );
    const run = spawnSync(process.execPath, [harness, dist, dir], {
      encoding: "utf8",
    });
    const output = JSON.parse(run.stdout);

    expect(output.error).toBeUndefined();
    expect(output.exts).toEqual(["woff2", "woff2", "woff"]);
    expect(output.css).not.toContain("fonts.gstatic.com");
  });
});

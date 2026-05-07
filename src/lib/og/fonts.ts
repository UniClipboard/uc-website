import "server-only";

const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

type GoogleFontSpec = {
  family: string;
  axes?: string;
  weight: number;
  style?: "normal" | "italic";
  text?: string;
};

const memo = new Map<string, Promise<ArrayBuffer>>();

const buildCssUrl = (spec: GoogleFontSpec) => {
  // Google Fonts CSS2 requires literal `:` and `@` in the family parameter,
  // so we build the URL by hand instead of going through URLSearchParams
  // (which percent-encodes those characters and gets rejected with 400).
  const family = spec.family.replace(/ /g, "+");
  const axes = spec.axes ?? `wght@${spec.weight}`;
  const params = [`family=${family}:${axes}`, "display=swap"];
  if (spec.text) params.push(`text=${encodeURIComponent(spec.text)}`);
  return `https://fonts.googleapis.com/css2?${params.join("&")}`;
};

const fetchGoogleFont = (spec: GoogleFontSpec): Promise<ArrayBuffer> => {
  const cssUrl = buildCssUrl(spec);
  const cached = memo.get(cssUrl);
  if (cached) return cached;

  const promise = (async () => {
    const cssRes = await fetch(cssUrl, {
      headers: { "User-Agent": CHROME_UA },
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!cssRes.ok) throw new Error(`Google Fonts CSS ${cssRes.status}`);
    const css = await cssRes.text();
    const fontUrl = css.match(/url\((https?:[^)]+)\)/)?.[1];
    if (!fontUrl) throw new Error(`Could not find font URL in: ${cssUrl}`);
    const fontRes = await fetch(fontUrl, {
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!fontRes.ok) throw new Error(`Font binary ${fontRes.status}`);
    return fontRes.arrayBuffer();
  })();

  memo.set(cssUrl, promise);
  promise.catch(() => memo.delete(cssUrl));
  return promise;
};

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight?: number;
  style?: "normal" | "italic";
};

export async function loadOgFonts(
  locale: string,
  cjkText: string,
): Promise<OgFont[]> {
  const tasks: Array<Promise<OgFont>> = [
    fetchGoogleFont({ family: "Inter Tight", weight: 600 }).then((data) => ({
      name: "Inter Tight",
      data,
      weight: 600,
    })),
    fetchGoogleFont({ family: "Inter Tight", weight: 700 }).then((data) => ({
      name: "Inter Tight",
      data,
      weight: 700,
    })),
    fetchGoogleFont({
      family: "Cormorant Garamond",
      axes: "ital,wght@1,600",
      weight: 600,
      style: "italic",
    }).then((data) => ({
      name: "Cormorant Garamond",
      data,
      weight: 600,
      style: "italic",
    })),
  ];

  if (locale === "zh" && cjkText.trim()) {
    tasks.push(
      fetchGoogleFont({
        family: "Noto Sans SC",
        weight: 700,
        text: cjkText,
      }).then((data) => ({ name: "Noto Sans SC", data, weight: 700 })),
      fetchGoogleFont({
        family: "Noto Sans SC",
        weight: 500,
        text: cjkText,
      }).then((data) => ({ name: "Noto Sans SC", data, weight: 500 })),
    );
  }

  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === "rejected") {
      console.warn("[og/fonts] font load failed:", r.reason);
    }
  }
  return results
    .filter(
      (r): r is PromiseFulfilledResult<OgFont> => r.status === "fulfilled",
    )
    .map((r) => r.value);
}

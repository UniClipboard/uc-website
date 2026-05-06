import "server-only";

import rehypeShiki from "@shikijs/rehype";
import type { Root } from "hast";
import { toHtml } from "hast-util-to-html";
import { unstable_cache } from "next/cache";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { RELEASES_CACHE_TAG } from "./changelog-sync";

async function renderRaw(body: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeShiki, {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    });
  const mdast = processor.parse(body);
  const hast = (await processor.run(mdast)) as Root;
  return toHtml(hast);
}

export const renderChangelogMarkdown = (
  cacheKey: string,
  body: string,
): Promise<string> =>
  unstable_cache(() => renderRaw(body), ["changelog-md", cacheKey], {
    tags: [RELEASES_CACHE_TAG],
  })();

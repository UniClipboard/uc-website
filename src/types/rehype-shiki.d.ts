declare module "rehype-shiki" {
  import type { Plugin } from "unified";

  type RehypeShikiOptions = {
    theme?: string;
    useBackground?: boolean;
  };

  const rehypeShiki: Plugin<[RehypeShikiOptions?]>;

  export default rehypeShiki;
}

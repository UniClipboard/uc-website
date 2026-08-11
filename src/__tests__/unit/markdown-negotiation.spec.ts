import { acceptsMarkdown } from "@/lib/markdown-negotiation";

describe("markdown content negotiation", () => {
  it("selects markdown only when the request accepts text/markdown", () => {
    expect(acceptsMarkdown("text/markdown")).toBe(true);
    expect(acceptsMarkdown("text/html, text/markdown;q=0.8")).toBe(true);
    expect(acceptsMarkdown("text/html, application/xhtml+xml")).toBe(false);
    expect(acceptsMarkdown("text/markdown;q=0")).toBe(false);
  });
});

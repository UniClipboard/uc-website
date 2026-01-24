import { promises as fs } from "node:fs";
import path from "node:path";

import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const markdownComponents: Components = {
  h1: ({ className, children, ...props }) => (
    <h1
      className={cn(
        "text-foreground mb-10 text-4xl font-bold tracking-tight sm:text-5xl lg:leading-[1.1]",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ className, children, ...props }) => (
    <h2
      className={cn(
        "text-foreground mt-16 mb-6 text-2xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ className, children, ...props }) => (
    <h3
      className={cn(
        "text-foreground mt-10 mb-4 text-xl font-medium",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn("text-foreground/90 mb-8 text-lg leading-8", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "text-muted-foreground marker:text-primary/50 my-6 ml-6 list-disc space-y-3",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "text-muted-foreground marker:text-foreground my-6 ml-6 list-decimal space-y-3 marker:font-medium",
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("pl-2", className)} {...props} />
  ),
  a: ({ className, children, ...props }) => (
    <a
      className={cn(
        "text-primary decoration-primary/30 hover:decoration-primary font-medium underline underline-offset-4 transition-colors",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "border-primary/20 text-muted-foreground my-8 border-l-4 pl-6 italic",
        className,
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "bg-muted text-foreground rounded-md px-1.5 py-0.5 font-mono text-sm font-medium",
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "glass-panel my-8 overflow-x-auto rounded-xl p-4 text-sm",
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("border-border my-12", className)} {...props} />
  ),
};

const WhitepaperPage = async () => {
  const t = await getTranslations("whitepaper");
  const filePath = path.join(process.cwd(), "content", "whitepaper.md");
  const content = await fs.readFile(filePath, "utf8");

  return (
    <div className="bg-background paper-texture selection:bg-primary/20 min-h-screen">
      <Navigation />
      <main className="relative pt-32 pb-24">
        <article className="mx-auto max-w-[720px] px-6">
          <div className="mb-8 flex items-center">
            <Link
              className="text-muted-foreground hover:text-foreground group inline-flex items-center text-sm font-medium transition-colors"
              href="/"
            >
              <ArrowLeft className="mr-2 size-4 transition-transform group-hover:-translate-x-1" />
              {t("backToHome")}
            </Link>
          </div>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default WhitepaperPage;

import type { Metadata } from "next";

import {
  type ArticleConfig,
  ArticleLayout,
  buildArticleMetadata,
} from "@/components/article/ArticleLayout";

const config: ArticleConfig = {
  pagePath: "/use-cases/mac-to-windows-clipboard",
  namespace: "useCases.macToWindows",
  breadcrumbMiddleKey: "breadcrumbCategory",
  datePublished: "2026-05-04",
  howTo: {
    totalTime: "PT5M",
    tools: [
      "Mac running macOS 12 or newer",
      "Windows 10 or 11 PC",
      "UniClipboard app",
    ],
  },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildArticleMetadata(config, locale);
}

const MacToWindowsPage = async ({ params }: PageProps) => {
  const { locale } = await params;
  return <ArticleLayout config={config} locale={locale} />;
};

export default MacToWindowsPage;

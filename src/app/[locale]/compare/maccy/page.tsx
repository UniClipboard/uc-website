import type { Metadata } from "next";

import {
  type ArticleConfig,
  ArticleLayout,
  buildArticleMetadata,
} from "@/components/article/ArticleLayout";

const config: ArticleConfig = {
  pagePath: "/compare/maccy",
  namespace: "compare.maccy",
  breadcrumbMiddleKey: "breadcrumbCompare",
  datePublished: "2026-05-04",
  about: ["Maccy"],
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

const MaccyComparePage = async ({ params }: PageProps) => {
  const { locale } = await params;
  return <ArticleLayout config={config} locale={locale} />;
};

export default MaccyComparePage;

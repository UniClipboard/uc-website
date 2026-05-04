import type { Metadata } from "next";

import {
  ArticleHubLayout,
  buildHubMetadata,
  type HubConfig,
} from "@/components/article/ArticleHubLayout";

const config: HubConfig = {
  category: "compare",
  pagePath: "/compare",
  namespace: "compareHub",
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildHubMetadata(config, locale);
}

const CompareHubPage = async ({ params }: PageProps) => {
  const { locale } = await params;
  return <ArticleHubLayout config={config} locale={locale} />;
};

export default CompareHubPage;

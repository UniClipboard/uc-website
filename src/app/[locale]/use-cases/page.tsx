import type { Metadata } from "next";

import {
  ArticleHubLayout,
  buildHubMetadata,
  type HubConfig,
} from "@/components/article/ArticleHubLayout";

const config: HubConfig = {
  category: "use-cases",
  pagePath: "/use-cases",
  namespace: "useCasesHub",
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

const UseCasesHubPage = async ({ params }: PageProps) => {
  const { locale } = await params;
  return <ArticleHubLayout config={config} locale={locale} />;
};

export default UseCasesHubPage;

import type { Metadata } from "next";

import {
  ArticleHubLayout,
  buildHubMetadata,
  type HubConfig,
} from "@/components/article/ArticleHubLayout";

const config: HubConfig = {
  category: "blog",
  pagePath: "/blog",
  namespace: "blogHub",
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildHubMetadata(config, locale);
}

const BlogHubPage = async ({ params }: PageProps) => {
  const { locale } = await params;
  return <ArticleHubLayout config={config} locale={locale} />;
};

export default BlogHubPage;

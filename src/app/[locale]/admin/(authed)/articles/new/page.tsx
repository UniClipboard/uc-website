import { ArticleEditor } from "@/components/admin/ArticleEditor";
import {
  ARTICLE_CATEGORIES,
  type ArticleCategoryValue,
} from "@/lib/article-content";
import { emptyContentForCategory } from "@/lib/empty-article";

export const metadata = { title: "New article · Admin" };

export default async function NewArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: queryCategory } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const category: ArticleCategoryValue = (
    ARTICLE_CATEGORIES as readonly string[]
  ).includes(queryCategory ?? "")
    ? (queryCategory as ArticleCategoryValue)
    : "compare";

  return (
    <ArticleEditor
      mode="create"
      initial={{
        slug: "",
        category,
        datePublished: today,
        status: "draft",
        translations: {
          en: emptyContentForCategory(category),
          zh: emptyContentForCategory(category),
        },
      }}
    />
  );
}

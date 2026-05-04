import { notFound } from "next/navigation";

import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { getArticleWithAllTranslations } from "@/db/articles";
import { emptyContentForCategory } from "@/lib/empty-article";

export const metadata = { title: "Edit article · Admin" };

const dynamic = "force-dynamic";
export { dynamic };

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleWithAllTranslations(id);
  if (!article) notFound();

  return (
    <ArticleEditor
      mode="edit"
      articleId={article.id}
      initial={{
        slug: article.slug,
        category: article.category,
        datePublished: article.datePublished,
        status: article.status,
        translations: {
          en:
            article.translations.en ??
            emptyContentForCategory(article.category),
          zh:
            article.translations.zh ??
            emptyContentForCategory(article.category),
        },
      }}
    />
  );
}

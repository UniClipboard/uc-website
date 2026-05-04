import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { emptyArticleContent } from "@/lib/empty-article";

export const metadata = { title: "New article · Admin" };

export default function NewArticlePage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <ArticleEditor
      mode="create"
      initial={{
        slug: "",
        category: "compare",
        datePublished: today,
        status: "draft",
        translations: {
          en: emptyArticleContent(),
          zh: emptyArticleContent(),
        },
      }}
    />
  );
}

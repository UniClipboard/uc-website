import Link from "next/link";

import { DeleteArticleButton } from "@/components/admin/DeleteArticleButton";
import { NewArticleButton } from "@/components/admin/NewArticleButton";
import { listAllArticles } from "@/db/articles";

export const metadata = { title: "Articles · Admin" };

const dynamic = "force-dynamic";
export { dynamic };

export default async function AdminArticlesPage() {
  const items = await listAllArticles();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Articles</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {items.length} total · published articles render at /compare/[slug]
            and /use-cases/[slug]
          </p>
        </div>
        <NewArticleButton />
      </div>

      {items.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-lg border p-12 text-center text-sm">
          No articles yet. Create one to get started.
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-border bg-bg2 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Translations</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((article) => {
                const enTitle = article.translations.en?.hero.title;
                const zhTitle = article.translations.zh?.hero.title;
                const displayTitle =
                  enTitle ?? zhTitle ?? `(no title) — ${article.slug}`;
                const hasEn = Boolean(article.translations.en);
                const hasZh = Boolean(article.translations.zh);
                return (
                  <tr
                    key={article.id}
                    className="border-border border-b last:border-b-0"
                  >
                    <td className="text-foreground px-4 py-3 font-medium">
                      {displayTitle}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {article.category}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      <code className="font-mono text-xs">{article.slug}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          article.status === "published"
                            ? "bg-green-500/15 text-green-700 dark:text-green-400"
                            : "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
                        }`}
                      >
                        {article.status}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">
                      <span
                        className={hasEn ? "text-foreground" : "opacity-40"}
                      >
                        EN
                      </span>
                      {" · "}
                      <span
                        className={hasZh ? "text-foreground" : "opacity-40"}
                      >
                        ZH
                      </span>
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">
                      {article.updatedAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="flex items-center gap-3 px-4 py-3 text-xs">
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="hover:text-foreground"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/${article.category}/${article.slug}`}
                        target="_blank"
                        className="hover:text-foreground"
                      >
                        View
                      </Link>
                      <DeleteArticleButton id={article.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

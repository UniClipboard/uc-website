import { getTranslations } from "next-intl/server";

export async function AudienceSection({ locale: _locale }: { locale: string }) {
  const t = await getTranslations("landing.audience");

  const audiences = [
    { key: "developer" },
    { key: "creator" },
    { key: "designer" },
    { key: "admin" },
    { key: "geek" },
  ];

  return (
    <section className="bg-gray-light border-gray-mid celestial-pattern overflow-hidden border-t py-32 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col items-center gap-16">
          <h2 className="text-charcoal text-center text-3xl leading-tight font-extrabold md:text-5xl dark:text-slate-100">
            {t("title")}
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {audiences.map((audience) => (
              <span
                key={audience.key}
                className="border-gray-mid rounded-xl border bg-white px-8 py-4 text-sm font-bold tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {t(audience.key)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

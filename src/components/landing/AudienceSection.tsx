import { getTranslations } from "next-intl/server";

export async function AudienceSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.audience");

  const audiences = [
    { key: "developer" },
    { key: "creator" },
    { key: "designer" },
    { key: "admin" },
    { key: "geek" },
  ];

  return (
    <section className="py-32 bg-gray-light dark:bg-slate-900/50 overflow-hidden border-t border-gray-mid dark:border-slate-700 celestial-pattern">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col gap-16 items-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-center text-charcoal dark:text-slate-100 leading-tight">
            {t("title")}
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {audiences.map((audience) => (
              <span key={audience.key} className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-gray-mid dark:border-slate-700 rounded-xl font-bold text-sm tracking-wide">
                {t(audience.key)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

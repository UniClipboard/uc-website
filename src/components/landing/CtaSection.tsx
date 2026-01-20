import { getTranslations } from "next-intl/server";
import { getFormUrl } from "@/lib/form-config";

export async function CtaSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.cta");
  const formUrl = getFormUrl(locale as "zh" | "en");

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-32">
      <div className="bg-gray-dark dark:bg-slate-950 text-white rounded-[2rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/[0.03] rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col items-center gap-10 max-w-xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-silver-accent text-[10px] font-bold uppercase tracking-[0.2em]">
            {t("badge")}
          </span>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            {t("title")}
          </h2>
          <p className="text-lg text-slate-400 font-medium leading-relaxed">
            {t("description")}
          </p>
          <form action={formUrl} method="get" target="_blank" className="w-full">
            <div className="w-full flex flex-col sm:flex-row gap-3 p-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
              <input name="email" type="email" required placeholder={t("placeholder")} className="flex-grow h-14 px-6 rounded-xl border-none bg-white text-gray-dark focus:ring-2 focus:ring-silver-accent outline-none font-bold text-base" />
              <button type="submit" className="h-14 px-8 bg-white text-gray-dark font-bold text-base rounded-xl hover:bg-gray-mid transition-all whitespace-nowrap">
                {t("button")}
              </button>
            </div>
          </form>
          <p className="text-xs font-bold text-slate-500 italic">
            {t("note")}
          </p>
        </div>
      </div>
    </section>
  );
}

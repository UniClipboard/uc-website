import { getTranslations } from "next-intl/server";
import { getFormUrl } from "@/lib/form-config";
import { Bolt, Plus, Copy } from "lucide-react";

export async function HeroSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.hero");
  const formUrl = getFormUrl(locale as "zh" | "en");

  return (
    <section className="relative min-h-screen bg-white dark:bg-slate-900 paper-texture celestial-pattern flex items-center justify-center pt-32 pb-20">
      <div className="max-w-[900px] mx-auto px-6 text-center relative z-10">
        <div className="flex flex-col items-center gap-8">
          <span className="inline-block px-4 py-1.5 bg-gray-mid/30 dark:bg-slate-800/30 border border-gray-mid dark:border-slate-700 rounded-full text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            {t("badge")}
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight text-charcoal dark:text-slate-100">
            {t("title")} <span className="text-silver-accent">{t("highlight")}</span>
          </h1>
          <p className="text-lg md:text-xl font-medium text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {t("description")}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <a href={formUrl} target="_blank" rel="noopener noreferrer" className="px-10 py-4 bg-gray-dark text-white rounded-xl font-bold text-lg shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all">
              {t("primaryCta")}
            </a>
            <a href="#" className="px-10 py-4 bg-white dark:bg-slate-800 border border-gray-mid dark:border-slate-700 text-gray-dark dark:text-slate-100 rounded-xl font-bold text-lg hover:bg-gray-light dark:hover:bg-slate-700 transition-all">
              {t("secondaryCta")}
            </a>
          </div>
        </div>
      </div>
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-4 text-slate-300 dark:text-slate-700 opacity-20">
        <Bolt className="size-10" />
        <Plus className="size-10" />
        <Copy className="size-10" />
      </div>
    </section>
  );
}

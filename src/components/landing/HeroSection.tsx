import { Bolt, Copy, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getFormUrl } from "@/lib/form-config";

export async function HeroSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.hero");
  const formUrl = getFormUrl(locale as "zh" | "en");

  return (
    <section className="paper-texture celestial-pattern relative flex min-h-screen items-center justify-center bg-white pt-32 pb-20 dark:bg-slate-900">
      <div className="relative z-10 mx-auto max-w-[900px] px-6 text-center">
        <div className="flex flex-col items-center gap-8">
          <span className="bg-gray-mid/30 border-gray-mid inline-block rounded-full border px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-400">
            {t("badge")}
          </span>
          <h1 className="text-charcoal text-5xl leading-[1.1] font-extrabold tracking-tight md:text-7xl dark:text-slate-100">
            {t("title")}{" "}
            <span className="text-silver-accent">{t("highlight")}</span>
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed font-medium text-slate-500 md:text-xl dark:text-slate-400">
            {t("description")}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-dark rounded-xl px-10 py-4 text-lg font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800"
            >
              {t("primaryCta")}
            </a>
            <button className="border-gray-mid text-gray-dark hover:bg-gray-light rounded-xl border bg-white px-10 py-4 text-lg font-bold transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
              {t("secondaryCta")}
            </button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-20 left-1/2 flex -translate-x-1/2 gap-4 text-slate-300 opacity-20 dark:text-slate-700">
        <Bolt className="size-10" />
        <Plus className="size-10" />
        <Copy className="size-10" />
      </div>
    </section>
  );
}

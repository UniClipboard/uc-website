import { getFormUrl } from "@/lib/form-config";
import { getTranslations } from "next-intl/server";

export async function CtaSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.cta");
  const formUrl = getFormUrl(locale as "zh" | "en");

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-32">
      <div className="bg-gray-dark relative overflow-hidden rounded-[2rem] p-12 text-center text-white shadow-2xl md:p-24 dark:bg-slate-950">
        <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03]"></div>
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/[0.03]"></div>
        <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-10">
          <span className="text-silver-accent inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase">
            {t("badge")}
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            {t("title")}
          </h2>
          <p className="text-lg leading-relaxed font-medium text-slate-400">
            {t("description")}
          </p>
          <form
            action={formUrl}
            method="get"
            target="_blank"
            className="w-full"
          >
            <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl sm:flex-row">
              <input
                name="email"
                type="email"
                required
                placeholder={t("placeholder")}
                className="text-gray-dark focus:ring-silver-accent h-14 flex-grow rounded-xl border-none bg-white px-6 text-base font-bold outline-none focus:ring-2"
              />
              <button
                type="submit"
                className="text-gray-dark hover:bg-gray-mid h-14 rounded-xl bg-white px-8 text-base font-bold whitespace-nowrap transition-all"
              >
                {t("button")}
              </button>
            </div>
          </form>
          <p className="text-xs font-bold text-slate-500 italic">{t("note")}</p>
        </div>
      </div>
    </section>
  );
}

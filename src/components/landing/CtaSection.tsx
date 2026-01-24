import { getTranslations } from "next-intl/server";

import { getFormUrl } from "@/lib/form-config";

export async function CtaSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.cta");
  const formUrl = getFormUrl(locale as "zh" | "en");

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-32">
      <div className="bg-gray-dark relative overflow-hidden rounded-[2rem] p-12 text-center text-white shadow-2xl md:p-24">
        <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5"></div>
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/5"></div>
        <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-10">
          <h2 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            {t("title")}
          </h2>
          <p className="text-silver-accent text-lg leading-relaxed font-medium">
            {t("description")}
          </p>
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary hover:bg-primary/90 inline-flex h-14 items-center justify-center rounded-xl px-8 text-base font-bold whitespace-nowrap text-white transition-all"
          >
            {t("button")}
          </a>
          <p className="text-silver-accent/60 text-xs font-bold italic">
            {t("note")}
          </p>
        </div>
      </div>
    </section>
  );
}

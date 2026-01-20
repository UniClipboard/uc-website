import { ShieldCheck } from "lucide-react";

import { getTranslations } from "next-intl/server";

export async function TrustSection({ locale: _locale }: { locale: string }) {
  const t = await getTranslations("landing.trust");

  return (
    <section
      id="trust"
      className="bg-gray-dark relative overflow-hidden py-32 text-white dark:bg-slate-950"
    >
      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center gap-10 px-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <ShieldCheck className="text-silver-accent size-10" />
        </div>
        <div className="max-w-2xl">
          <span className="text-silver-accent mb-6 inline-block rounded-full bg-white/10 px-4 py-1 text-[10px] font-bold tracking-[0.2em] uppercase">
            {t("badge")}
          </span>
          <h2 className="mb-6 text-4xl font-extrabold tracking-tight md:text-5xl">
            {t("title")}
          </h2>
          <p className="text-xl leading-relaxed font-medium text-slate-400">
            {t("description")}
          </p>
        </div>
        <button className="text-gray-dark hover:bg-gray-mid rounded-xl bg-white px-10 py-4 text-sm font-bold shadow-xl transition-all">
          {t("cta")}
        </button>
      </div>
      <div className="absolute top-0 right-0 h-full w-1/3 skew-x-12 bg-white/[0.02]"></div>
      <div className="absolute bottom-0 left-0 h-1/2 w-1/4 -rotate-12 bg-white/[0.02]"></div>
    </section>
  );
}

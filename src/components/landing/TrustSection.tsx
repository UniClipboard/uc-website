import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";

export async function TrustSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.trust");

  return (
    <section id="trust" className="bg-gray-dark dark:bg-slate-950 text-white py-32 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 text-center flex flex-col items-center gap-10 relative z-10">
        <div className="size-20 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
          <ShieldCheck className="size-10 text-silver-accent" />
        </div>
        <div className="max-w-2xl">
          <span className="inline-block px-4 py-1 bg-white/10 rounded-full text-silver-accent text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            {t("badge")}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            {t("title")}
          </h2>
          <p className="text-xl text-slate-400 leading-relaxed font-medium">
            {t("description")}
          </p>
        </div>
        <a href="#" className="bg-white text-gray-dark text-sm px-10 py-4 rounded-xl font-bold hover:bg-gray-mid transition-all shadow-xl">
          {t("cta")}
        </a>
      </div>
      <div className="absolute top-0 right-0 w-1/3 h-full bg-white/[0.02] skew-x-12"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-white/[0.02] -rotate-12"></div>
    </section>
  );
}

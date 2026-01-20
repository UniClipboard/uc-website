import { getTranslations } from "next-intl/server";
import { Zap, Sparkles, Shield, History } from "lucide-react";

const features = [
  { icon: Zap, key: "fast" },
  { icon: Sparkles, key: "minimalist" },
  { icon: Shield, key: "privacy" },
  { icon: History, key: "history" },
];

export async function FeaturesSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.features");

  return (
    <section id="features" className="bg-gray-light dark:bg-slate-900/50 py-32 relative celestial-pattern border-y border-gray-mid dark:border-slate-700">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-24 max-w-2xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-white dark:bg-slate-800 border border-gray-mid dark:border-slate-700 rounded-full text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            {t("badge")}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-charcoal dark:text-slate-100 mb-6">
            {t("title")}
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.key} className="group p-10 bg-white dark:bg-slate-800 rounded-card border border-gray-mid dark:border-slate-700 hover:border-silver-accent transition-all flex flex-col gap-6 shadow-sm">
                <div className="size-14 bg-gray-light dark:bg-slate-700 rounded-xl flex items-center justify-center text-silver-accent group-hover:bg-gray-dark group-hover:text-white transition-all">
                  <Icon className="size-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-gray-dark dark:text-slate-100">
                    {t(`${feature.key}.title`)}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                    {t(`${feature.key}.description`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

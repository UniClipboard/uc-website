import { History, Shield, Sparkles, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";

const features = [
  { icon: Zap, key: "fast" },
  { icon: Sparkles, key: "minimalist" },
  { icon: Shield, key: "privacy" },
  { icon: History, key: "history" },
];

export async function FeaturesSection({
  locale: _locale,
}: {
  locale: string;
}) {
  const t = await getTranslations("landing.features");

  return (
    <section
      id="features"
      className="bg-gray-light celestial-pattern border-gray-mid relative border-y py-32 dark:border-slate-700 dark:bg-slate-900/50"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mx-auto mb-24 max-w-2xl text-center">
          <span className="border-gray-mid mb-6 inline-block rounded-full border bg-white px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
            {t("badge")}
          </span>
          <h2 className="text-charcoal mb-6 text-4xl font-extrabold tracking-tight md:text-5xl dark:text-slate-100">
            {t("title")}
          </h2>
          <p className="text-lg leading-relaxed font-medium text-slate-500 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="group rounded-card border-gray-mid hover:border-silver-accent flex flex-col gap-6 border bg-white p-10 shadow-sm transition-all dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="bg-gray-light text-silver-accent group-hover:bg-gray-dark flex size-14 items-center justify-center rounded-xl transition-all group-hover:text-white dark:bg-slate-700">
                  <Icon className="size-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-gray-dark text-2xl font-bold dark:text-slate-100">
                    {t(`${feature.key}.title`)}
                  </h3>
                  <p className="text-lg leading-relaxed text-slate-500 dark:text-slate-400">
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

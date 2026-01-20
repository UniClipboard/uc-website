import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";

export async function RoadmapSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.roadmap");

  const nowAvailable = [
    { key: "richText", icon: CheckCircle2 },
    { key: "images", icon: CheckCircle2 },
    { key: "crossPlatform", icon: CheckCircle2 },
  ];

  const comingSoon = [
    { key: "mobile", icon: null },
    { key: "largeFiles", icon: null },
    { key: "team", icon: null },
  ];

  return (
    <section id="roadmap" className="py-32 bg-white dark:bg-slate-900 paper-texture celestial-pattern">
      <div className="max-w-[1000px] mx-auto px-6">
        <div className="text-center mb-24 flex flex-col items-center">
          <span className="inline-block px-4 py-1.5 bg-gray-light dark:bg-slate-800 border border-gray-mid dark:border-slate-700 rounded-full text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            {t("badge")}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-charcoal dark:text-slate-100">
            {t("title")}
          </h2>
        </div>
        <div className="space-y-12">
          <div className="bg-gray-light/50 dark:bg-slate-800/30 p-10 rounded-card border border-gray-mid dark:border-slate-700 hover:border-silver-accent transition-all">
            <div className="flex items-center gap-3 mb-8">
              <span className="px-3 py-1 bg-gray-dark text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                {t("nowAvailable.label")}
              </span>
              <div className="h-[1px] flex-grow bg-gray-mid dark:bg-slate-700"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {nowAvailable.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.key} className="space-y-2">
                    <p className="font-bold text-gray-dark dark:text-slate-100 flex items-center gap-2">
                      <Icon className="text-silver-accent" /> {t(`nowAvailable.${feature.key}.title`)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t(`nowAvailable.${feature.key}.description`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-10 rounded-card border border-gray-mid dark:border-slate-700 border-dashed">
            <div className="flex items-center gap-3 mb-8">
              <span className="px-3 py-1 bg-gray-mid text-slate-500 text-[10px] font-bold rounded-md uppercase tracking-wider">
                {t("comingSoon.label")}
              </span>
              <div className="h-[1px] flex-grow bg-gray-mid/50 dark:bg-slate-700/50"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {comingSoon.map((feature) => (
                <div key={feature.key} className="space-y-2 opacity-60">
                  <p className="font-bold text-gray-dark dark:text-slate-100">
                    {t(`comingSoon.${feature.key}.title`)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t(`comingSoon.${feature.key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

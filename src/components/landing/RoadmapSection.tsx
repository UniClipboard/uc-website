import { CheckCircle2 } from "lucide-react";

import { getTranslations } from "next-intl/server";

export async function RoadmapSection({ locale: _locale }: { locale: string }) {
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
    <section
      id="roadmap"
      className="paper-texture celestial-pattern bg-white py-32 dark:bg-slate-900"
    >
      <div className="mx-auto max-w-[1000px] px-6">
        <div className="mb-24 flex flex-col items-center text-center">
          <span className="bg-gray-light border-gray-mid mb-6 inline-block rounded-full border px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
            {t("badge")}
          </span>
          <h2 className="text-charcoal text-4xl font-extrabold tracking-tight md:text-5xl dark:text-slate-100">
            {t("title")}
          </h2>
        </div>
        <div className="space-y-12">
          <div className="bg-gray-light/50 rounded-card border-gray-mid hover:border-silver-accent border p-10 transition-all dark:border-slate-700 dark:bg-slate-800/30">
            <div className="mb-8 flex items-center gap-3">
              <span className="bg-gray-dark rounded-md px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase">
                {t("nowAvailable.label")}
              </span>
              <div className="bg-gray-mid h-[1px] flex-grow dark:bg-slate-700"></div>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {nowAvailable.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.key} className="space-y-2">
                    <p className="text-gray-dark flex items-center gap-2 font-bold dark:text-slate-100">
                      <Icon className="text-silver-accent" />{" "}
                      {t(`nowAvailable.${feature.key}.title`)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t(`nowAvailable.${feature.key}.description`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-card border-gray-mid border border-dashed bg-white p-10 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-8 flex items-center gap-3">
              <span className="bg-gray-mid rounded-md px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {t("comingSoon.label")}
              </span>
              <div className="bg-gray-mid/50 h-[1px] flex-grow dark:bg-slate-700/50"></div>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {comingSoon.map((feature) => (
                <div key={feature.key} className="space-y-2 opacity-60">
                  <p className="text-gray-dark font-bold dark:text-slate-100">
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

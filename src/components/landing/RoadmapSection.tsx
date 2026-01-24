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
      className="paper-texture celestial-pattern bg-background py-32"
    >
      <div className="mx-auto max-w-[1000px] px-6">
        <div className="mb-24 flex flex-col items-center text-center">
          <h2 className="text-foreground text-4xl font-extrabold tracking-tight md:text-5xl">
            {t("title")}
          </h2>
        </div>
        <div className="space-y-12">
          <div className="bg-muted/50 rounded-card border-border hover:border-primary border p-10 transition-all">
            <div className="mb-8 flex items-center gap-3">
              <span className="bg-primary text-primary-foreground rounded-md px-3 py-1 text-[10px] font-bold tracking-wider uppercase">
                {t("nowAvailable.label")}
              </span>
              <div className="bg-border h-[1px] flex-grow"></div>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {nowAvailable.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.key} className="space-y-2">
                    <p className="text-foreground flex items-center gap-2 font-bold">
                      <Icon className="text-primary" />{" "}
                      {t(`nowAvailable.${feature.key}.title`)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t(`nowAvailable.${feature.key}.description`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-card border-border bg-card border border-dashed p-10">
            <div className="mb-8 flex items-center gap-3">
              <span className="bg-muted text-muted-foreground rounded-md px-3 py-1 text-[10px] font-bold tracking-wider uppercase">
                {t("comingSoon.label")}
              </span>
              <div className="bg-border/50 h-[1px] flex-grow"></div>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {comingSoon.map((feature) => (
                <div key={feature.key} className="space-y-2 opacity-60">
                  <p className="text-foreground font-bold">
                    {t(`comingSoon.${feature.key}.title`)}
                  </p>
                  <p className="text-muted-foreground text-sm">
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

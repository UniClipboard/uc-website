import { History, Shield, Sparkles, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";

const features = [
  { icon: Zap, key: "fast" },
  { icon: Sparkles, key: "minimalist" },
  { icon: Shield, key: "privacy" },
  { icon: History, key: "history" },
];

export async function FeaturesSection() {
  const t = await getTranslations("landing.features");

  return (
    <section
      id="features"
      className="bg-muted celestial-pattern border-border relative overflow-hidden border-y py-32"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-foreground mb-8 text-4xl font-extrabold tracking-tight md:text-5xl">
            {t("title")}
          </h2>

          <div className="bg-border/70 mx-auto mb-8 h-px w-24" />

          <p className="text-muted-foreground text-lg leading-relaxed font-medium">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.key}
                className="bg-card border-border hover:border-primary/30 group rounded-xl border p-6 transition-all"
              >
                <div className="mb-3 flex items-center gap-4">
                  <div className="bg-primary/10 text-primary group-hover:bg-primary flex h-10 w-10 items-center justify-center rounded-lg transition-colors group-hover:text-white">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-foreground text-lg font-bold tracking-tight">
                    {t(`${feature.key}.title`)}
                  </h3>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(`${feature.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <a
            href="#cta"
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground inline-flex h-10 items-center justify-center rounded-lg px-6 text-sm font-medium transition-colors"
          >
            {t("cta.button")}
          </a>
          <p className="text-muted-foreground text-xs">{t("cta.note")}</p>
        </div>
      </div>
    </section>
  );
}

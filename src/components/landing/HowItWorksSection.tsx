import { ClipboardCopy, Download, Link } from "lucide-react";
import { getTranslations } from "next-intl/server";

const steps = [
  { icon: Download, key: "step1" },
  { icon: Link, key: "step2" },
  { icon: ClipboardCopy, key: "step3" },
];

export async function HowItWorksSection() {
  const t = await getTranslations("landing.howItWorks");

  return (
    <section
      id="how-it-works"
      className="bg-background celestial-pattern border-border relative border-b py-32"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mx-auto mb-24 max-w-2xl text-center">
          <h2 className="text-foreground mb-6 text-4xl font-extrabold tracking-tight md:text-5xl">
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed font-medium">
            {t("subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.key}
                className="group rounded-card border-border hover:border-primary bg-card flex flex-col gap-6 border p-8 shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground flex size-12 items-center justify-center rounded-xl transition-all">
                    <Icon className="size-6" />
                  </div>
                  <span className="text-muted-foreground/10 group-hover:text-primary/10 text-6xl font-black transition-colors select-none">
                    0{index + 1}
                  </span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-foreground text-2xl font-bold">
                    {t(`${step.key}.title`)}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {t(`${step.key}.description`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <a
            href="#cta"
            className="text-primary hover:text-primary/80 inline-flex items-center text-base font-semibold transition-colors"
          >
            {t("cta")}
          </a>
        </div>
      </div>
    </section>
  );
}

import { Bolt, Copy, Github, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getFormUrl } from "@/lib/form-config";

export async function HeroSection({ locale }: { locale: string }) {
  const t = await getTranslations("landing.hero");
  const formUrl = getFormUrl(locale as "zh" | "en");

  return (
    <section className="paper-texture celestial-pattern bg-background relative flex min-h-screen items-center justify-center pt-32 pb-20">
      <div className="relative z-10 mx-auto max-w-[900px] px-6 text-center">
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-foreground text-5xl leading-[1.1] font-extrabold tracking-tight md:text-7xl">
            {t("title")} <span className="text-primary">{t("highlight")}</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed font-medium md:text-xl">
            {t("description")}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-10 py-4 text-lg font-bold shadow-lg transition-all"
            >
              {t("primaryCta")}
            </a>
            <a
              href="https://github.com/UniClipboard/UniClipboard"
              target="_blank"
              rel="noopener noreferrer"
              className="border-border text-foreground hover:bg-accent bg-card flex items-center gap-2 rounded-xl border px-10 py-4 text-lg font-bold transition-all"
            >
              <Github className="size-5" />
              {t("secondaryCta")}
            </a>
          </div>
        </div>
      </div>
      <div className="text-muted-foreground/20 absolute bottom-20 left-1/2 flex -translate-x-1/2 gap-4 opacity-20">
        <Bolt className="size-10" />
        <Plus className="size-10" />
        <Copy className="size-10" />
      </div>
    </section>
  );
}

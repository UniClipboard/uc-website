import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function FaqSection() {
  const t = await getTranslations("landing.faq");
  const items = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <section
      id="faq"
      className="bg-background border-border border-t py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="mx-auto max-w-3xl space-y-4">
          {items.map((num) => (
            <details
              key={num}
              className="group border-border bg-card hover:border-primary/50 overflow-hidden rounded-lg border transition-all"
            >
              <summary className="text-foreground flex cursor-pointer list-none items-center justify-between p-6 font-medium transition-colors [&::-webkit-details-marker]:hidden">
                <span className="text-lg font-semibold">
                  {t(`item${num}.q`)}
                </span>
                <ChevronDown className="text-muted-foreground size-5 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="border-border border-t px-6 pt-4 pb-6">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {t(`item${num}.a`)}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

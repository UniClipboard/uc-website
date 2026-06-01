import { getLocale, getTranslations } from "next-intl/server";

import { getDocsHref } from "@/lib/docs-href";

import { FaqAccordion, type FaqItem } from "./FaqAccordion";

export async function FaqSection() {
  const t = await getTranslations("landing.faq");
  const locale = await getLocale();
  const docsHref = getDocsHref(locale);
  const items: FaqItem[] = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
    const item: FaqItem = {
      q: t(`item${i}.q`),
      a: t(`item${i}.a`),
    };
    if (i === 5) {
      const localePathPrefix = locale === "en" ? "" : `/${locale}`;
      item.cta = {
        label: t("item5.downloadCta"),
        href: `${localePathPrefix}/download`,
      };
    }
    return item;
  });

  return (
    <section
      id="faq"
      className="border-border bg-background border-b py-[100px]"
    >
      <div className="landing-shell">
        <div className="grid items-start gap-10 md:grid-cols-[1.2fr_1.6fr] md:gap-14">
          <div>
            <p className="landing-kicker">{t("eyebrow")}</p>
            <h2
              className="text-foreground mt-3.5 mb-[18px]"
              style={{
                fontSize: "clamp(2rem, 3.6vw, 2.5rem)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
              }}
            >
              {t("title")}
            </h2>
            <p className="text-muted-foreground mt-2 text-[14px] leading-relaxed">
              {t("docsHelpLede")}{" "}
              <a
                href={docsHref}
                className="text-foreground underline decoration-[var(--muted2)] underline-offset-[5px] transition-colors hover:decoration-current"
              >
                {t("docsHelpCta")}
              </a>
            </p>
          </div>
          <div className="relative">
            <span
              id="faq-mobile"
              aria-hidden
              className="pointer-events-none absolute -top-24"
            />
            <FaqAccordion items={items} />
          </div>
        </div>
      </div>
    </section>
  );
}

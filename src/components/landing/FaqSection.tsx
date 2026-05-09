import { getTranslations } from "next-intl/server";

import { FaqAccordion, type FaqItem } from "./FaqAccordion";

export async function FaqSection() {
  const t = await getTranslations("landing.faq");
  const items: FaqItem[] = [1, 2, 3, 4, 5, 6, 7].map((i) => {
    const item: FaqItem = {
      q: t(`item${i}.q`),
      a: t(`item${i}.a`),
    };
    if (i === 5) {
      item.cta = {
        label: t("item5.waitlistCta"),
        href: t("item5.waitlistMailto"),
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
          </div>
          <FaqAccordion items={items} />
        </div>
      </div>
    </section>
  );
}

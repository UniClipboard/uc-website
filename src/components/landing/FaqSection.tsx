import { getTranslations } from "next-intl/server";

import { FaqAccordion } from "./FaqAccordion";

export async function FaqSection() {
  const t = await getTranslations("landing.faq");
  const items = [1, 2, 3, 4, 5].map((i) => ({
    q: t(`item${i}.q`),
    a: t(`item${i}.a`),
  }));

  return (
    <section id="faq" className="border-border bg-bg2 border-b py-[100px]">
      <div className="landing-shell">
        <div
          className="grid items-start gap-14"
          style={{ gridTemplateColumns: "1fr 1.6fr" }}
        >
          <div>
            <p className="landing-kicker">{t("eyebrow")}</p>
            <h2
              className="text-foreground mt-3.5 mb-[18px]"
              style={{
                fontSize: 40,
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

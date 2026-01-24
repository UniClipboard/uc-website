import { getTranslations } from "next-intl/server";

export async function AudienceSection({ locale: _locale }: { locale: string }) {
  const t = await getTranslations("landing.audience");

  const audiences = [
    { key: "developer" },
    { key: "creator" },
    { key: "designer" },
    { key: "admin" },
    { key: "geek" },
  ];

  return (
    <section className="bg-muted border-border celestial-pattern overflow-hidden border-t py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col items-center gap-16">
          <h2 className="text-foreground text-center text-3xl leading-tight font-extrabold md:text-5xl">
            {t("title")}
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {audiences.map((audience) => (
              <span
                key={audience.key}
                className="border-border bg-card text-muted-foreground rounded-xl border px-8 py-4 text-sm font-bold tracking-wide"
              >
                {t(audience.key)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

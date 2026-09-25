import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <main className="landing-shell min-h-screen py-32">
      <h1 className="text-4xl">{t("notFound")}</h1>
      <p className="my-6">{t("unavailable")}</p>
      <Link href="/" className="underline">
        {t("home")}
      </Link>
    </main>
  );
}

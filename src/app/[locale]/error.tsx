"use client";
import { useTranslations } from "next-intl";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <main className="landing-shell min-h-screen py-32">
      <h1 className="text-4xl">{t("title")}</h1>
      <p className="my-6">{t("description")}</p>
      <button onClick={reset} className="min-h-11 rounded border px-6">
        {t("retry")}
      </button>
    </main>
  );
}

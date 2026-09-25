import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TryTransfer } from "@/components/try/TryTransfer";
import { localeAlternates, localePathPrefix } from "@/i18n/locale-meta";

import { Header } from "../../components/Header";

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "try" });
  return {
    title: t("seoTitle"),
    description: t("seoDescription"),
    alternates: {
      canonical: localePathPrefix(locale) || "/",
      languages: localeAlternates("/"),
    },
  };
}
export default async function Page({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "try.footer" });
  return (
    <>
      <Header />
      <div className="try-frame">
        <main className="try-main">
          <TryTransfer linkPath="" />
        </main>
        <p className="try-foot">
          <span>
            {t("demo")} · {t("e2e")} · {t("notApp")} ·
          </span>
          <span>
            <a
              href={`https://www.uniclipboard.app${localePathPrefix(locale)}/download`}
            >
              {t("getApp")}
            </a>{" "}
            {t("forSync")}
          </span>
          <span aria-hidden>·</span>
          <a
            href="https://github.com/tailscale/tailcat/blob/83921d7141b80db20fd733ee195c805d2721e489/LICENSE"
            rel="noopener noreferrer"
          >
            {t("license")}
          </a>
        </p>
      </div>
    </>
  );
}

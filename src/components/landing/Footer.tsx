import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { AnimateIn } from "./AnimateIn";

export async function Footer() {
  const t = await getTranslations("landing.footer");

  return (
    <footer className="pb-12">
      <div className="landing-shell">
        <AnimateIn variant="fade-in">
          <div className="flex flex-col gap-6 border-t border-[color:var(--border)] pt-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em]">
                UniClipboard
              </p>
              <p className="text-muted-foreground mt-1.5 text-sm leading-6">
                {t("tagline")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <a
                className="text-muted-foreground hover:text-foreground transition-colors"
                href="https://github.com/UniClipboard/UniClipboard"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("github")}
              </a>
              <a
                className="text-muted-foreground hover:text-foreground transition-colors"
                href="https://x.com/UniClipboard"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("twitter")}
              </a>
              <Link
                className="text-muted-foreground hover:text-foreground transition-colors"
                href="/whitepaper"
              >
                {t("whitepaper")}
              </Link>
              <a
                className="text-muted-foreground hover:text-foreground transition-colors"
                href="#download"
              >
                {t("download")}
              </a>
            </div>

            <p className="text-muted-foreground text-sm">{t("copyright")}</p>
          </div>
        </AnimateIn>
      </div>
    </footer>
  );
}

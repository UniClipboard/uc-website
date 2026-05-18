import { ArrowRight, ArrowUpRight, Download } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { StableReleaseViewModel } from "@/lib/release-feed/normalize-release";

import { AnimateIn } from "./AnimateIn";

type FinalDownloadCtaProps = {
  release: StableReleaseViewModel;
};

export async function FinalDownloadCta({ release }: FinalDownloadCtaProps) {
  const t = await getTranslations("landing.finalCta");

  const versionLine =
    release.status === "ok" && release.version !== "unavailable"
      ? `${t("versionPrefix")} v${release.version} · ${t("platformsLine")}`
      : t("platformsLine");

  return (
    <section
      id="get-started"
      className="relative overflow-hidden"
      style={{
        background: "#0A0A0B",
        color: "#FAFAFA",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 70%)",
        }}
      />
      <div className="landing-shell relative py-[80px] md:py-[120px]">
        <div className="mx-auto flex max-w-[760px] flex-col items-center text-center">
          <AnimateIn delay={0.06} duration={0.6}>
            <h2
              className="mb-4"
              style={{
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                textWrap: "balance",
                color: "#FAFAFA",
              }}
            >
              {t("title")}
            </h2>
          </AnimateIn>
          <AnimateIn delay={0.12} duration={0.5}>
            <p
              className="mb-9"
              style={{
                fontSize: 16.5,
                lineHeight: 1.6,
                maxWidth: 560,
                color: "rgba(250,250,250,0.72)",
              }}
            >
              {t("subtitle")}
            </p>
          </AnimateIn>
          <AnimateIn delay={0.18} duration={0.55}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/download"
                className="group inline-flex items-center gap-2 rounded-full px-5 py-3 transition-colors"
                style={{
                  background: "#FAFAFA",
                  color: "#0A0A0B",
                  fontSize: 14.5,
                  fontWeight: 600,
                  letterSpacing: "-0.005em",
                }}
              >
                <Download size={15} strokeWidth={2} />
                <span>{t("primary")}</span>
                <ArrowRight
                  size={14}
                  strokeWidth={2}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <a
                href="https://github.com/UniClipboard/UniClipboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 transition-colors hover:bg-white/[0.06]"
                style={{
                  border: "1px solid rgba(250,250,250,0.18)",
                  color: "#FAFAFA",
                  fontSize: 14.5,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}
              >
                <span>{t("secondary")}</span>
                <ArrowUpRight size={14} strokeWidth={2} />
              </a>
            </div>
          </AnimateIn>
          <AnimateIn delay={0.24} duration={0.5}>
            <p
              className="mt-8"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                letterSpacing: "0.04em",
                color: "rgba(250,250,250,0.48)",
              }}
            >
              {versionLine}
            </p>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}

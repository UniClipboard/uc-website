import { ArrowUpRight, Github } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AnimateIn } from "@/components/landing/AnimateIn";
import { GITHUB_REPO_URL, SPONSOR_CHANNELS } from "@/lib/sponsors";

export async function SponsorCta() {
  const t = await getTranslations("landing.sponsor.cta");

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#0A0A0B", color: "#FAFAFA" }}
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
            <div className="flex w-full max-w-xs flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
              {SPONSOR_CHANNELS.map((channel, i) => (
                <a
                  key={channel.id}
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 transition-colors sm:w-auto"
                  style={
                    i === 0
                      ? {
                          background: "#FAFAFA",
                          color: "#0A0A0B",
                          fontSize: 14.5,
                          fontWeight: 600,
                          letterSpacing: "-0.005em",
                        }
                      : {
                          border: "1px solid rgba(250,250,250,0.18)",
                          color: "#FAFAFA",
                          fontSize: 14.5,
                          fontWeight: 500,
                          letterSpacing: "-0.005em",
                        }
                  }
                >
                  <span>{i === 0 ? t("primary") : channel.label}</span>
                  <ArrowUpRight
                    size={14}
                    strokeWidth={2}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </a>
              ))}
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 transition-colors hover:bg-white/[0.06] sm:w-auto"
                style={{
                  border: "1px solid rgba(250,250,250,0.18)",
                  color: "#FAFAFA",
                  fontSize: 14.5,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}
              >
                <Github size={15} strokeWidth={2} />
                <span>{t("secondary")}</span>
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
              {t("note")}
            </p>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}

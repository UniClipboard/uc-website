import type { LucideIcon } from "lucide-react";
import {
  Command,
  FileText,
  History,
  Network,
  RefreshCw,
  Shield,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";

import { AnimateIn, StaggerChild, StaggerIn } from "./AnimateIn";
import { EncryptionFlow } from "./illustrations/EncryptionFlow";
import { NetworkFlow } from "./illustrations/NetworkFlow";
import { PowerFlow } from "./illustrations/PowerFlow";

type Hero = {
  ns: "h1" | "h2" | "h3";
  Illustration: () => ReactElement;
  animated?: boolean;
};

const heroes: Hero[] = [
  { ns: "h1", Illustration: EncryptionFlow, animated: true },
  { ns: "h2", Illustration: NetworkFlow, animated: true },
  { ns: "h3", Illustration: PowerFlow, animated: true },
];

type More = { icon: LucideIcon; key: string };
const moreItems: More[] = [
  { icon: Command, key: "f1" },
  { icon: RefreshCw, key: "f4" },
  { icon: FileText, key: "f6" },
  { icon: Network, key: "f5" },
  { icon: Shield, key: "f7" },
  { icon: History, key: "f9" },
];

function HeroBlock({
  t,
  ns,
  Illustration,
  animated,
  flip,
  isLast,
}: {
  t: (k: string) => string;
  ns: Hero["ns"];
  Illustration: () => ReactElement;
  animated?: boolean;
  flip: boolean;
  isLast: boolean;
}) {
  const media = (
    <AnimateIn delay={0.08} duration={0.6}>
      <div
        className="border-border bg-bg2 relative overflow-hidden rounded-[18px] border"
        style={{
          aspectRatio: "16 / 10",
          backgroundImage:
            "repeating-linear-gradient(135deg, var(--hair2) 0 1px, transparent 1px 16px)",
        }}
      >
        <div
          className={
            animated
              ? "text-foreground absolute inset-0 flex items-center justify-center"
              : "text-foreground pointer-events-none absolute inset-0 flex items-center justify-center opacity-40"
          }
        >
          <Illustration />
        </div>
      </div>
    </AnimateIn>
  );

  const text = (
    <div>
      <AnimateIn variant="fade-in" duration={0.5}>
        <p className="landing-kicker">{t(`${ns}.eyebrow`)}</p>
      </AnimateIn>
      <AnimateIn delay={0.05} duration={0.5}>
        <h3
          className="text-foreground mt-3.5 mb-[18px]"
          style={{
            fontSize: "clamp(1.75rem, 3.2vw, 2.25rem)",
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            textWrap: "balance",
          }}
        >
          {t(`${ns}.title`)}
        </h3>
      </AnimateIn>
      <AnimateIn delay={0.1} duration={0.5}>
        <p
          className="text-muted-foreground mb-7"
          style={{ fontSize: 17, lineHeight: 1.55, maxWidth: 460 }}
        >
          {t(`${ns}.lede`)}
        </p>
      </AnimateIn>
      <AnimateIn delay={0.15} duration={0.5}>
        <ul className="border-border flex list-none flex-col gap-3.5 border-t p-0 pt-[18px]">
          {[1, 2, 3].map((i) => (
            <li
              key={i}
              className="grid items-baseline gap-3.5"
              style={{ gridTemplateColumns: "20px 1fr" }}
            >
              <span
                className="text-muted2"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  paddingTop: 2,
                }}
              >
                {String(i).padStart(2, "0")}
              </span>
              <span>
                <span
                  className="text-foreground"
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {t(`${ns}.b${i}Title`)}
                </span>
                <span
                  className="text-muted-foreground ml-2.5"
                  style={{ fontSize: 14, lineHeight: 1.55 }}
                >
                  {t(`${ns}.b${i}Desc`)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </AnimateIn>
    </div>
  );

  return (
    <div
      className="grid items-center gap-10 py-12 md:grid-cols-2 md:gap-16 md:py-16"
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--border)",
      }}
    >
      {flip ? (
        <>
          {media}
          {text}
        </>
      ) : (
        <>
          {text}
          {media}
        </>
      )}
    </div>
  );
}

export async function FeaturesSection() {
  const t = await getTranslations("landing.features");
  const tMore = await getTranslations("landing.features.more");

  return (
    <section
      id="features"
      className="border-border bg-background border-b py-[100px]"
    >
      <div className="landing-shell">
        <AnimateIn variant="fade-in" duration={0.5}>
          <p className="landing-kicker">{t("eyebrow")}</p>
        </AnimateIn>
        <AnimateIn delay={0.06} duration={0.6}>
          <h2
            className="text-foreground mt-3.5 mb-14"
            style={{
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              maxWidth: 720,
              textWrap: "balance",
            }}
          >
            {t("title")}
          </h2>
        </AnimateIn>

        <div>
          {heroes.map((h, i) => (
            <HeroBlock
              key={h.ns}
              t={t}
              ns={h.ns}
              Illustration={h.Illustration}
              animated={h.animated}
              flip={i % 2 === 1}
              isLast={i === heroes.length - 1}
            />
          ))}
        </div>

        <div className="mt-24">
          <AnimateIn variant="fade-in" duration={0.5}>
            <p className="landing-kicker" style={{ color: "var(--muted2)" }}>
              {t("moreEyebrow")}
            </p>
          </AnimateIn>
          <AnimateIn delay={0.06} duration={0.5}>
            <h3
              className="text-foreground mt-3 mb-9"
              style={{
                fontSize: "clamp(1.5rem, 2.4vw, 1.75rem)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {t("moreTitle")}
            </h3>
          </AnimateIn>

          <StaggerIn
            stagger={0.06}
            className="border-border grid grid-cols-1 border-t border-l sm:grid-cols-2 md:grid-cols-3"
          >
            {moreItems.map((it) => {
              const Icon = it.icon;
              return (
                <StaggerChild key={it.key}>
                  <div className="border-border group relative flex h-full flex-col gap-2.5 border-r border-b p-6 transition-colors duration-300 hover:bg-[var(--hair2)]">
                    <div className="bg-bg2 group-hover:bg-foreground mb-1.5 flex size-7 items-center justify-center rounded-[7px] transition-all duration-300 group-hover:scale-105">
                      <Icon
                        className="text-foreground group-hover:text-background size-[15px] transition-colors duration-300"
                        strokeWidth={1.6}
                      />
                    </div>
                    <div
                      className="text-foreground transition-transform duration-300 group-hover:translate-x-0.5"
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        letterSpacing: "-0.005em",
                      }}
                    >
                      {tMore(`${it.key}Title`)}
                    </div>
                    <div
                      className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300"
                      style={{ fontSize: 13, lineHeight: 1.55 }}
                    >
                      {tMore(`${it.key}Desc`)}
                    </div>
                  </div>
                </StaggerChild>
              );
            })}
          </StaggerIn>
        </div>
      </div>
    </section>
  );
}

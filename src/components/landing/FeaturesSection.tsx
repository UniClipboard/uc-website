import type { LucideIcon } from "lucide-react";
import {
  Bolt,
  Code,
  Image as ImageIcon,
  Laptop,
  Network,
  Search,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";

import { AnimateIn, StaggerChild, StaggerIn } from "./AnimateIn";

type Hero = {
  ns: "h1" | "h2" | "h3";
  Illustration: () => ReactElement;
};

const heroes: Hero[] = [
  { ns: "h1", Illustration: IllSimple },
  { ns: "h2", Illustration: IllPrivacy },
  { ns: "h3", Illustration: IllNetwork },
];

type More = { icon: LucideIcon; key: string };
const moreItems: More[] = [
  { icon: Laptop, key: "f1" },
  { icon: Search, key: "f4" },
  { icon: Bolt, key: "f6" },
  { icon: ImageIcon, key: "f5" },
  { icon: Code, key: "f7" },
  { icon: Network, key: "f9" },
];

function IllSimple() {
  return (
    <svg
      width="320"
      height="200"
      viewBox="0 0 320 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="20"
        y="40"
        width="120"
        height="120"
        rx="10"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="180"
        y="40"
        width="120"
        height="120"
        rx="10"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M140 100 H180"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeDasharray="4 4"
      />
      <text
        x="55"
        y="105"
        fontFamily="ui-monospace, monospace"
        fontSize="14"
        fill="currentColor"
      >
        ⌘C
      </text>
      <text
        x="215"
        y="105"
        fontFamily="ui-monospace, monospace"
        fontSize="14"
        fill="currentColor"
      >
        ⌘V
      </text>
    </svg>
  );
}

function IllPrivacy() {
  return (
    <svg
      width="340"
      height="200"
      viewBox="0 0 340 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="10"
        y="70"
        width="80"
        height="60"
        rx="8"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="250"
        y="70"
        width="80"
        height="60"
        rx="8"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="140"
        y="80"
        width="60"
        height="40"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeDasharray="3 3"
      />
      <text
        x="148"
        y="105"
        fontFamily="ui-monospace, monospace"
        fontSize="11"
        fill="currentColor"
      >
        0xA3F1…
      </text>
      <path d="M90 100 H140" stroke="currentColor" strokeWidth="1.6" />
      <path d="M200 100 H250" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="170" cy="50" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M165 50 V46 a5 5 0 0 1 10 0 V50"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
    </svg>
  );
}

function IllNetwork() {
  return (
    <svg
      width="340"
      height="200"
      viewBox="0 0 340 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="20"
        y="30"
        width="80"
        height="50"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="240"
        y="30"
        width="80"
        height="50"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="130"
        y="120"
        width="80"
        height="50"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M100 55 H240" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M60 80 Q60 130 130 145"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeDasharray="4 4"
        fill="none"
      />
      <path
        d="M280 80 Q280 130 210 145"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeDasharray="4 4"
        fill="none"
      />
      <text
        x="150"
        y="145"
        fontFamily="ui-monospace, monospace"
        fontSize="10"
        fill="currentColor"
      >
        relay
      </text>
    </svg>
  );
}

function HeroBlock({
  t,
  ns,
  Illustration,
  flip,
  isLast,
}: {
  t: (k: string) => string;
  ns: Hero["ns"];
  Illustration: () => ReactElement;
  flip: boolean;
  isLast: boolean;
}) {
  const media = (
    <AnimateIn delay={0.08} duration={0.6}>
      <div
        className="border-border bg-bg2 relative flex items-end justify-between overflow-hidden rounded-[18px] border p-[18px]"
        style={{
          aspectRatio: "16 / 10",
          backgroundImage:
            "repeating-linear-gradient(135deg, var(--hair2) 0 1px, transparent 1px 16px)",
        }}
      >
        <div className="text-foreground pointer-events-none absolute inset-0 flex items-center justify-center opacity-25">
          <Illustration />
        </div>
        <div
          className="text-muted2 relative"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.04em",
          }}
        >
          {`// ${t(`${ns}.mediaCaption`)}`}
        </div>
        <div
          className="text-muted2 relative"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.04em",
          }}
        >
          16 : 10
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
            fontSize: 36,
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
      className="grid items-center gap-16 py-16"
      style={{
        gridTemplateColumns: "1fr 1fr",
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
              fontSize: 44,
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
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {t("moreTitle")}
            </h3>
          </AnimateIn>

          <StaggerIn
            stagger={0.06}
            className="border-border grid grid-cols-3 border-t border-l"
          >
            {moreItems.map((it) => {
              const Icon = it.icon;
              return (
                <StaggerChild key={it.key}>
                  <div className="border-border flex h-full flex-col gap-2.5 border-r border-b p-6">
                    <div className="bg-bg2 mb-1.5 flex size-7 items-center justify-center rounded-[7px]">
                      <Icon
                        className="text-foreground size-[15px]"
                        strokeWidth={1.6}
                      />
                    </div>
                    <div
                      className="text-foreground"
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        letterSpacing: "-0.005em",
                      }}
                    >
                      {tMore(`${it.key}Title`)}
                    </div>
                    <div
                      className="text-muted-foreground"
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

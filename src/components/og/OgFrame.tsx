import type { CSSProperties } from "react";

const PALETTE = {
  background: "#fafaf8",
  bg2: "#f2f2f0",
  foreground: "#0a0a0a",
  muted: "#6b6b65",
  muted2: "#9a9a93",
  border: "#e5e5e0",
  card: "#ffffff",
  accent: "#6366f1",
};

const FONT_SERIF = "Cormorant Garamond";

const fontSans = (locale?: string) =>
  locale === "zh" ? "Noto Sans SC, Inter Tight" : "Inter Tight, Noto Sans SC";

type OgFrameProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  footer?: string;
  locale?: string;
};

const cjkTextStyle = (locale?: string): CSSProperties =>
  locale === "zh" ? { letterSpacing: 0, lineHeight: 1.18 } : {};

export function OgFrame({
  eyebrow,
  title,
  subtitle,
  footer,
  locale,
}: OgFrameProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: PALETTE.background,
        fontFamily: fontSans(locale),
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(ellipse 70% 55% at 50% -10%, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0) 60%), radial-gradient(ellipse 120% 80% at 50% 110%, rgba(10,10,10,0.05) 0%, rgba(10,10,10,0) 65%)`,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(10,10,10,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.6,
          display: "flex",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: PALETTE.muted,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                display: "flex",
                width: 28,
                height: 2,
                background: PALETTE.foreground,
              }}
            />
            <span style={{ display: "flex" }}>{eyebrow}</span>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 36,
              color: PALETTE.foreground,
              fontSize: 84,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              maxWidth: 1040,
              ...cjkTextStyle(locale),
            }}
          >
            {title}
          </div>

          {subtitle ? (
            <div
              style={{
                display: "flex",
                marginTop: 28,
                color: PALETTE.muted,
                fontSize: 30,
                fontWeight: 500,
                lineHeight: 1.4,
                maxWidth: 980,
                ...cjkTextStyle(locale),
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 28,
            borderTop: `1px solid ${PALETTE.border}`,
            color: PALETTE.foreground,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 14,
            }}
          >
            <span
              style={{
                display: "flex",
                fontFamily: FONT_SERIF,
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: 44,
                letterSpacing: "-0.015em",
                color: PALETTE.foreground,
              }}
            >
              UniClipboard
            </span>
            <span
              style={{
                display: "flex",
                width: 6,
                height: 6,
                borderRadius: 999,
                background: PALETTE.accent,
                alignSelf: "center",
              }}
            />
            <span
              style={{
                display: "flex",
                color: PALETTE.muted,
                fontSize: 22,
                fontWeight: 500,
                ...cjkTextStyle(locale),
              }}
            >
              {footer ?? "uniclipboard.app"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            {["mac", "win", "linux"].map((label) => (
              <span
                key={label}
                style={{
                  display: "flex",
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: `1px solid ${PALETTE.border}`,
                  background: PALETTE.card,
                  color: PALETTE.foreground,
                  fontSize: 18,
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png" as const;

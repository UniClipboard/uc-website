import { Clipboard, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";

function XGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: "block" }}
    >
      <path
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Z"
        fill="currentColor"
      />
    </svg>
  );
}

export async function Footer() {
  const t = await getTranslations("landing.footer");

  return (
    <footer
      style={{
        background: "var(--footer-bg)",
        color: "var(--footer-fg)",
        padding: "72px 0 56px",
      }}
    >
      <div className="landing-shell">
        <div className="grid items-start gap-10 sm:grid-cols-2 md:grid-cols-[1.7fr_1fr_1fr_1.1fr]">
          {/* Wordmark + thanks blurb */}
          <div>
            <div className="mb-[18px] flex items-center gap-2.5">
              <div
                className="flex size-7 items-center justify-center rounded-[7px]"
                style={{
                  background: "var(--footer-fg)",
                  color: "var(--footer-bg)",
                }}
              >
                <Clipboard size={15} strokeWidth={1.6} />
              </div>
              <span className="wordmark text-[22px]">UniClipboard</span>
            </div>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--footer-fg-muted)",
                maxWidth: 360,
                margin: 0,
              }}
            >
              {t("thanksDesc")}
            </p>
          </div>

          {/* Project links */}
          <div>
            <div
              className="mb-[18px]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--footer-fg-faint)",
              }}
            >
              {t("linksTitle")}
            </div>
            <div className="flex flex-col gap-2 text-[13px]">
              {[
                {
                  href: "https://github.com/UniClipboard/UniClipboard",
                  label: t("repo"),
                },
                {
                  href: "https://github.com/UniClipboard/UniClipboard/issues",
                  label: t("issues"),
                },
                {
                  href: "https://github.com/UniClipboard/UniClipboard/releases",
                  label: t("releases"),
                },
                {
                  href: "https://github.com/UniClipboard/UniClipboard#readme",
                  label: t("docs"),
                },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--footer-fg)",
                    textDecoration: "none",
                    opacity: 0.85,
                  }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Legal / license */}
          <div>
            <div
              className="mb-[18px]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--footer-fg-faint)",
              }}
            >
              {t("legalTitle")}
            </div>
            <div
              className="mb-1.5"
              style={{
                fontSize: 13,
                color: "var(--footer-fg)",
                opacity: 0.85,
              }}
            >
              {t("license")}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--footer-fg-muted)",
              }}
            >
              {t("madeBy")}
            </div>
          </div>

          {/* Contact */}
          <div>
            <div
              className="mb-[18px]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--footer-fg-faint)",
              }}
            >
              {t("contactTitle")}
            </div>
            <div className="flex flex-col gap-1">
              <a
                href="https://x.com/uniclipboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 py-2"
                style={{
                  color: "var(--footer-fg)",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <span
                  className="inline-flex size-[26px] items-center justify-center rounded-[7px]"
                  style={{
                    border: "1px solid var(--footer-hair)",
                    color: "var(--footer-fg)",
                  }}
                >
                  <XGlyph size={12} />
                </span>
                <span>{t("twitter")}</span>
              </a>
              <a
                href="mailto:hello@uniclipboard.app"
                className="inline-flex items-center gap-2.5 py-2"
                style={{
                  color: "var(--footer-fg)",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <span
                  className="inline-flex size-[26px] items-center justify-center rounded-[7px]"
                  style={{
                    border: "1px solid var(--footer-hair)",
                    color: "var(--footer-fg)",
                  }}
                >
                  <Mail size={13} strokeWidth={1.6} />
                </span>
                <span>{t("email")}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Rule */}
        <div
          className="mt-14 flex items-center justify-between pt-[22px]"
          style={{
            borderTop: "1px solid var(--footer-hair)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--footer-fg-faint)",
            letterSpacing: "0.05em",
          }}
        >
          <span>{t("copyright")}</span>
          <span>{t("rustNote")}</span>
        </div>
      </div>
    </footer>
  );
}

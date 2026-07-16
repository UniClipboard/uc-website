import { Clipboard, Mail } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { localePathPrefix } from "@/i18n/locale-meta";
import { getDocsHref } from "@/lib/docs-href";

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

function BilibiliGlyph({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: "block" }}
    >
      <path
        d="M18.223 3.086a1.25 1.25 0 0 1 0 1.768L17.08 5.997l.831.001a3.5 3.5 0 0 1 3.5 3.5v8a3.5 3.5 0 0 1-3.5 3.5h-12a3.5 3.5 0 0 1-3.5-3.5v-8a3.5 3.5 0 0 1 3.5-3.5l.83-.001-1.142-1.143a1.25 1.25 0 1 1 1.768-1.768L9.732 5.999h4.535l2.188-2.913a1.25 1.25 0 0 1 1.768 0ZM17.911 8.5h-12a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1Zm-9.286 2.97a1.25 1.25 0 0 1 1.25 1.25v1.06a1.25 1.25 0 1 1-2.5 0v-1.06a1.25 1.25 0 0 1 1.25-1.25Zm6.75 0a1.25 1.25 0 0 1 1.25 1.25v1.06a1.25 1.25 0 1 1-2.5 0v-1.06a1.25 1.25 0 0 1 1.25-1.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

export async function Footer() {
  const t = await getTranslations("landing.footer");
  const locale = await getLocale();
  const docsHref = getDocsHref(locale);
  const sponsorHref = `${localePathPrefix(locale)}/sponsor`;

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
            <div className="flex flex-col gap-1 text-[13px]">
              {[
                {
                  href: "https://github.com/UniClipboard/UniClipboard",
                  label: t("repo"),
                  external: true,
                },
                {
                  href: "https://github.com/UniClipboard/UniClipboard/issues",
                  label: t("issues"),
                  external: true,
                },
                {
                  href: "https://github.com/UniClipboard/UniClipboard/releases",
                  label: t("releases"),
                  external: true,
                },
                {
                  href: docsHref,
                  label: t("docs"),
                  external: false,
                },
                {
                  href: sponsorHref,
                  label: t("sponsor"),
                  external: false,
                },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  {...(l.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="inline-flex min-h-8 items-center"
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

          {/* Tech stack — thanks to the open source projects we build on */}
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
              {t("stackTitle")}
            </div>
            <div className="flex flex-col gap-1 text-[13px]">
              {[
                { href: "https://www.rust-lang.org/", label: "Rust" },
                { href: "https://tauri.app/", label: "Tauri" },
                { href: "https://www.iroh.computer/", label: "iroh" },
                { href: "https://ui.shadcn.com/", label: "shadcn/ui" },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-8 items-center"
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
                className="inline-flex min-h-8 items-center gap-2.5"
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
                href="https://x.com/mkdir700"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-2.5"
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
                <span>{t("authorTwitter")}</span>
              </a>
              <a
                href="https://space.bilibili.com/473609649"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-2.5"
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
                  <BilibiliGlyph size={13} />
                </span>
                <span>{t("bilibili")}</span>
              </a>
              <a
                href="mailto:hello@uniclipboard.app"
                className="inline-flex min-h-8 items-center gap-2.5"
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

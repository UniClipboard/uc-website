import { Check, ChevronRight, X } from "lucide-react";
import type { ReactNode } from "react";

import { AnimateIn } from "@/components/landing/AnimateIn";
import { Link } from "@/i18n/navigation";

type Crumb = { label: string; href?: string };

export function BreadcrumbBar({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="text-muted2 mb-7 flex flex-wrap items-center gap-1.5 text-[12px]"
      style={{ letterSpacing: "0.04em" }}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-muted-foreground" : undefined}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight aria-hidden className="size-3.5" />}
          </span>
        );
      })}
    </nav>
  );
}

export type ArticleHeroProps = {
  breadcrumbs: Crumb[];
  eyebrow: string;
  title: string;
  subtitle: string;
  lede: string;
  lastUpdatedLabel: string;
  lastUpdatedDate: string;
};

export function ArticleHero({
  breadcrumbs,
  eyebrow,
  title,
  subtitle,
  lede,
  lastUpdatedLabel,
  lastUpdatedDate,
}: ArticleHeroProps) {
  return (
    <section className="border-border bg-background border-b pt-28 pb-14 md:pt-36 md:pb-20">
      <div className="landing-shell">
        <BreadcrumbBar items={breadcrumbs} />
        <AnimateIn variant="fade-in" duration={0.5}>
          <p className="landing-kicker">{eyebrow}</p>
        </AnimateIn>
        <AnimateIn delay={0.05} duration={0.6}>
          <h1
            className="text-foreground mt-3.5 mb-5"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              maxWidth: 880,
              textWrap: "balance",
            }}
          >
            {title}
          </h1>
        </AnimateIn>
        <AnimateIn delay={0.1} duration={0.5}>
          <p
            className="text-muted-foreground"
            style={{ fontSize: 18, lineHeight: 1.55, maxWidth: 720 }}
          >
            {subtitle}
          </p>
        </AnimateIn>
        <AnimateIn delay={0.18} duration={0.5}>
          <p
            className="text-foreground/85 mt-7"
            style={{ fontSize: 17, lineHeight: 1.65, maxWidth: 760 }}
          >
            {lede}
          </p>
        </AnimateIn>
        <AnimateIn delay={0.24} duration={0.5}>
          <p
            className="text-muted2 mt-8 inline-flex items-center gap-2"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.06em",
            }}
          >
            <span>{lastUpdatedLabel}</span>
            <span>·</span>
            <time dateTime={lastUpdatedDate}>{lastUpdatedDate}</time>
          </p>
        </AnimateIn>
      </div>
    </section>
  );
}

type SectionTone = "default" | "alt";

const sectionToneClass: Record<SectionTone, string> = {
  default: "bg-background",
  alt: "bg-bg2",
};

export function TldrSection({
  eyebrow,
  title,
  items,
  tone = "alt",
}: {
  eyebrow: string;
  title: string;
  items: string[];
  tone?: SectionTone;
}) {
  return (
    <section
      className={`border-border border-b py-[72px] md:py-[100px] ${sectionToneClass[tone]}`}
    >
      <div className="landing-shell">
        <div className="grid items-start gap-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
          <div>
            <p className="landing-kicker">{eyebrow}</p>
            <h2
              className="text-foreground mt-3.5"
              style={{
                fontSize: "clamp(1.75rem, 3.4vw, 2.25rem)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              {title}
            </h2>
          </div>
          <ul className="border-border flex list-none flex-col gap-3.5 border-t p-0 pt-5">
            {items.map((item, i) => (
              <li
                key={i}
                className="grid items-baseline gap-3.5"
                style={{ gridTemplateColumns: "24px 1fr" }}
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
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="text-foreground/90"
                  style={{ fontSize: 16, lineHeight: 1.55 }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

type Pane = { eyebrow: string; title: string; body: string };

export function TwoColumnSection({
  left,
  right,
  tone = "default",
}: {
  left: Pane;
  right: Pane;
  tone?: SectionTone;
}) {
  return (
    <section
      className={`border-border border-b py-[72px] md:py-[100px] ${sectionToneClass[tone]}`}
    >
      <div className="landing-shell">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          {[left, right].map((pane, i) => (
            <div key={i}>
              <p className="landing-kicker">{pane.eyebrow}</p>
              <h2
                className="text-foreground mt-3.5 mb-5"
                style={{
                  fontSize: "clamp(1.5rem, 2.8vw, 2rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                {pane.title}
              </h2>
              <p
                className="text-muted-foreground"
                style={{ fontSize: 16, lineHeight: 1.65 }}
              >
                {pane.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export type ComparisonRow = {
  feature: string;
  uc: string;
  other: string;
};

export function ComparisonTable({
  eyebrow,
  title,
  featureHeader,
  ucHeader,
  otherHeader,
  rows,
  note,
  tone = "default",
}: {
  eyebrow: string;
  title: string;
  featureHeader: string;
  ucHeader: string;
  otherHeader: string;
  rows: ComparisonRow[];
  note?: string;
  tone?: SectionTone;
}) {
  return (
    <section
      className={`border-border border-b py-[72px] md:py-[100px] ${sectionToneClass[tone]}`}
    >
      <div className="landing-shell">
        <p className="landing-kicker">{eyebrow}</p>
        <h2
          className="text-foreground mt-3.5 mb-9"
          style={{
            fontSize: "clamp(1.75rem, 3.4vw, 2.25rem)",
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            maxWidth: 720,
            textWrap: "balance",
          }}
        >
          {title}
        </h2>
        <div className="border-border overflow-x-auto rounded-[14px] border">
          <table
            className="w-full border-collapse text-left"
            style={{ minWidth: 640 }}
          >
            <thead>
              <tr className="border-border bg-bg2 border-b">
                <th
                  scope="col"
                  className="text-muted2 px-5 py-4"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    fontWeight: 500,
                    textTransform: "uppercase",
                  }}
                >
                  {featureHeader}
                </th>
                <th
                  scope="col"
                  className="text-foreground px-5 py-4"
                  style={{ fontSize: 14, fontWeight: 600 }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Check
                      aria-hidden
                      className="text-foreground size-[14px]"
                      strokeWidth={2.4}
                    />
                    {ucHeader}
                  </span>
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-5 py-4"
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <X
                      aria-hidden
                      className="text-muted2 size-[14px]"
                      strokeWidth={2}
                    />
                    {otherHeader}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-border border-b last:border-b-0">
                  <th
                    scope="row"
                    className="text-foreground px-5 py-4 align-top"
                    style={{ fontSize: 14, fontWeight: 600 }}
                  >
                    {row.feature}
                  </th>
                  <td
                    className="text-foreground/90 px-5 py-4 align-top"
                    style={{ fontSize: 14, lineHeight: 1.55 }}
                  >
                    {row.uc}
                  </td>
                  <td
                    className="text-muted-foreground px-5 py-4 align-top"
                    style={{ fontSize: 14, lineHeight: 1.55 }}
                  >
                    {row.other}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {note && (
          <p
            className="text-muted2 mt-4"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.04em",
            }}
          >
            {note}
          </p>
        )}
      </div>
    </section>
  );
}

export function StepsSection({
  eyebrow,
  title,
  steps,
  tone = "alt",
}: {
  eyebrow: string;
  title: string;
  steps: string[];
  tone?: SectionTone;
}) {
  return (
    <section
      className={`border-border border-b py-[72px] md:py-[100px] ${sectionToneClass[tone]}`}
    >
      <div className="landing-shell">
        <div className="grid items-start gap-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
          <div>
            <p className="landing-kicker">{eyebrow}</p>
            <h2
              className="text-foreground mt-3.5"
              style={{
                fontSize: "clamp(1.75rem, 3.4vw, 2.25rem)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
                textWrap: "balance",
              }}
            >
              {title}
            </h2>
          </div>
          <ol className="border-border flex list-none flex-col gap-5 border-t p-0 pt-5">
            {steps.map((step, i) => (
              <li
                key={i}
                className="grid items-baseline gap-3.5"
                style={{ gridTemplateColumns: "28px 1fr" }}
              >
                <span
                  className="text-foreground"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    letterSpacing: "0.04em",
                    fontWeight: 600,
                    paddingTop: 1,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="text-foreground/90"
                  style={{ fontSize: 16, lineHeight: 1.65 }}
                >
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function VerdictSection({
  eyebrow,
  title,
  body,
  tone = "default",
}: {
  eyebrow: string;
  title: string;
  body: string;
  tone?: SectionTone;
}) {
  return (
    <section
      className={`border-border border-b py-[72px] md:py-[100px] ${sectionToneClass[tone]}`}
    >
      <div className="landing-shell">
        <div className="mx-auto" style={{ maxWidth: 760 }}>
          <p className="landing-kicker">{eyebrow}</p>
          <h2
            className="text-foreground mt-3.5 mb-6"
            style={{
              fontSize: "clamp(1.75rem, 3.4vw, 2.25rem)",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}
          >
            {title}
          </h2>
          <p
            className="text-foreground/90"
            style={{ fontSize: 18, lineHeight: 1.65 }}
          >
            {body}
          </p>
        </div>
      </div>
    </section>
  );
}

export type FaqItem = { q: string; a: string };

export function FaqGrid({
  eyebrow,
  title,
  items,
  tone = "default",
}: {
  eyebrow: string;
  title: string;
  items: FaqItem[];
  tone?: SectionTone;
}) {
  return (
    <section
      className={`border-border border-b py-[72px] md:py-[100px] ${sectionToneClass[tone]}`}
    >
      <div className="landing-shell">
        <div className="grid items-start gap-10 md:grid-cols-[1fr_1.6fr] md:gap-14">
          <div>
            <p className="landing-kicker">{eyebrow}</p>
            <h2
              className="text-foreground mt-3.5"
              style={{
                fontSize: "clamp(1.75rem, 3.4vw, 2.25rem)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
              }}
            >
              {title}
            </h2>
          </div>
          <div className="border-border border-t">
            {items.map((item, i) => (
              <div key={i} className="border-border border-b py-6">
                <h3
                  className="text-foreground mb-2"
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                    lineHeight: 1.4,
                  }}
                >
                  {item.q}
                </h3>
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: 15, lineHeight: 1.65 }}
                >
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

type CtaButton = { label: string; href: string };

export function CtaCard({
  eyebrow,
  title,
  body,
  primary,
  secondary,
  tone = "alt",
}: {
  eyebrow: string;
  title: string;
  body: string;
  primary: CtaButton;
  secondary?: CtaButton;
  tone?: SectionTone;
}) {
  return (
    <section
      className={`border-border border-b py-[72px] md:py-[100px] ${sectionToneClass[tone]}`}
    >
      <div className="landing-shell">
        <div
          className="border-border bg-background mx-auto rounded-[18px] border p-8 md:p-12"
          style={{ maxWidth: 880 }}
        >
          <p className="landing-kicker">{eyebrow}</p>
          <h2
            className="text-foreground mt-3.5 mb-4"
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {title}
          </h2>
          <p
            className="text-muted-foreground mb-7"
            style={{ fontSize: 16, lineHeight: 1.6 }}
          >
            {body}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={primary.href}
              className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
            >
              {primary.label}
              <ChevronRight aria-hidden className="size-3.5" />
            </Link>
            {secondary && (
              <Link
                href={secondary.href}
                className="border-border text-foreground hover:bg-bg2 inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors"
              >
                {secondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function JsonLd({ data }: { data: unknown[] | unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export type { Crumb, Pane };

export function Article({ children }: { children: ReactNode }) {
  return <main>{children}</main>;
}

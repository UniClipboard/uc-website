import { Check, Minus, X } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { AnimateIn } from "./AnimateIn";

type Verdict = "yes" | "no" | "partial" | "neutral";

type RowConfig = {
  key: string;
  verdicts: Record<Tool, Verdict>;
};

type Tool = "uc" | "icloud" | "selfhost" | "manager";

const tools: Tool[] = ["uc", "icloud", "selfhost", "manager"];

const rows: RowConfig[] = [
  {
    key: "crossPlatform",
    verdicts: { uc: "yes", icloud: "no", selfhost: "partial", manager: "no" },
  },
  {
    key: "e2e",
    verdicts: {
      uc: "yes",
      icloud: "partial",
      selfhost: "partial",
      manager: "neutral",
    },
  },
  {
    key: "infra",
    verdicts: { uc: "yes", icloud: "yes", selfhost: "no", manager: "yes" },
  },
  {
    key: "history",
    verdicts: {
      uc: "yes",
      icloud: "no",
      selfhost: "partial",
      manager: "yes",
    },
  },
  {
    key: "noAccount",
    verdicts: {
      uc: "yes",
      icloud: "no",
      selfhost: "partial",
      manager: "yes",
    },
  },
  {
    key: "transport",
    verdicts: {
      uc: "yes",
      icloud: "partial",
      selfhost: "partial",
      manager: "neutral",
    },
  },
  {
    key: "price",
    verdicts: {
      uc: "yes",
      icloud: "yes",
      selfhost: "partial",
      manager: "no",
    },
  },
];

function VerdictGlyph({ verdict }: { verdict: Verdict }) {
  if (verdict === "yes")
    return (
      <span
        aria-hidden
        className="inline-flex size-[18px] items-center justify-center rounded-full"
        style={{
          background: "var(--foreground)",
          color: "var(--background)",
        }}
      >
        <Check size={11} strokeWidth={2.5} />
      </span>
    );
  if (verdict === "no")
    return (
      <span
        aria-hidden
        className="border-border bg-bg2 text-muted2 inline-flex size-[18px] items-center justify-center rounded-full border"
      >
        <X size={11} strokeWidth={2.2} />
      </span>
    );
  if (verdict === "partial")
    return (
      <span
        aria-hidden
        className="border-border bg-bg2 text-muted inline-flex size-[18px] items-center justify-center rounded-full border"
      >
        <Minus size={11} strokeWidth={2.2} />
      </span>
    );
  return (
    <span
      aria-hidden
      className="text-muted2 inline-flex size-[18px] items-center justify-center"
    >
      ·
    </span>
  );
}

type CellTexts = {
  uc: string;
  icloud: string;
  selfhost: string;
  manager: string;
};

export async function ComparisonSection() {
  const t = await getTranslations("landing.comparison");

  const toolLabels: Record<Tool, string> = {
    uc: t("tools.uc"),
    icloud: t("tools.icloud"),
    selfhost: t("tools.selfhost"),
    manager: t("tools.manager"),
  };

  const rowData: Array<{
    key: string;
    label: string;
    cells: CellTexts;
    verdicts: Record<Tool, Verdict>;
  }> = rows.map((r) => ({
    key: r.key,
    label: t(`rows.${r.key}.label`),
    cells: {
      uc: t(`rows.${r.key}.uc`),
      icloud: t(`rows.${r.key}.icloud`),
      selfhost: t(`rows.${r.key}.selfhost`),
      manager: t(`rows.${r.key}.manager`),
    },
    verdicts: r.verdicts,
  }));

  return (
    <section
      id="compare"
      className="border-border bg-background border-b py-[100px]"
    >
      <div className="landing-shell">
        <AnimateIn variant="fade-in" duration={0.5}>
          <p className="landing-kicker">{t("eyebrow")}</p>
        </AnimateIn>
        <AnimateIn delay={0.06} duration={0.6}>
          <h2
            className="text-foreground mt-3.5 mb-4"
            style={{
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              maxWidth: 760,
              textWrap: "balance",
            }}
          >
            {t("title")}
          </h2>
        </AnimateIn>
        <AnimateIn delay={0.1} duration={0.5}>
          <p
            className="text-muted-foreground mb-12"
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              maxWidth: 640,
              textWrap: "pretty",
            }}
          >
            {t("subtitle")}
          </p>
        </AnimateIn>

        {/* Desktop table */}
        <AnimateIn delay={0.14} duration={0.6}>
          <div className="border-border bg-card hidden overflow-hidden rounded-[18px] border md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-border bg-bg2 border-b">
                  <th
                    scope="col"
                    className="text-muted2 px-5 py-4 text-left"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      fontWeight: 500,
                      width: "28%",
                    }}
                  >
                    &nbsp;
                  </th>
                  {tools.map((tool) => (
                    <ToolHeader
                      key={tool}
                      label={toolLabels[tool]}
                      highlight={tool === "uc"}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowData.map((row, i) => (
                  <tr
                    key={row.key}
                    className={
                      i < rowData.length - 1 ? "border-border border-b" : ""
                    }
                  >
                    <th
                      scope="row"
                      className="text-foreground px-5 py-4 text-left"
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        letterSpacing: "-0.005em",
                      }}
                    >
                      {row.label}
                    </th>
                    {tools.map((tool) => (
                      <td
                        key={tool}
                        className="px-5 py-4"
                        style={{
                          background:
                            tool === "uc" ? "var(--bg2)" : "transparent",
                        }}
                      >
                        <Cell
                          verdict={row.verdicts[tool]}
                          text={row.cells[tool]}
                          highlight={tool === "uc"}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimateIn>

        {/* Mobile cards */}
        <div className="flex flex-col gap-3 md:hidden">
          {tools.map((tool) => (
            <AnimateIn key={tool} variant="fade-up" duration={0.5}>
              <div
                className="rounded-[14px] border p-4"
                style={{
                  borderColor:
                    tool === "uc" ? "var(--foreground)" : "var(--border)",
                  background: tool === "uc" ? "var(--bg2)" : "var(--card)",
                }}
              >
                <div
                  className="text-foreground mb-3"
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {toolLabels[tool]}
                  {tool === "uc" && (
                    <span
                      className="text-muted2 ml-2"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      this
                    </span>
                  )}
                </div>
                <ul className="flex flex-col gap-2">
                  {rowData.map((row) => (
                    <li
                      key={row.key}
                      className="grid items-start gap-2"
                      style={{ gridTemplateColumns: "20px 1fr auto" }}
                    >
                      <VerdictGlyph verdict={row.verdicts[tool]} />
                      <span
                        className="text-muted-foreground"
                        style={{ fontSize: 13, lineHeight: 1.5 }}
                      >
                        {row.label}
                      </span>
                      <span
                        className="text-foreground text-right"
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          letterSpacing: "-0.005em",
                        }}
                      >
                        {row.cells[tool]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateIn>
          ))}
        </div>

        <p
          className="text-muted2 mt-7"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.04em",
          }}
        >
          {t("footnote")}
        </p>
      </div>
    </section>
  );
}

function ToolHeader({
  label,
  highlight,
}: {
  label: string;
  highlight: boolean;
}): ReactNode {
  return (
    <th
      scope="col"
      className="px-5 py-4 text-left"
      style={{
        background: highlight ? "var(--foreground)" : "transparent",
        color: highlight ? "var(--background)" : "var(--foreground)",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "-0.005em",
        width: "18%",
      }}
    >
      {label}
    </th>
  );
}

function Cell({
  verdict,
  text,
  highlight,
}: {
  verdict: Verdict;
  text: string;
  highlight: boolean;
}): ReactNode {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-px shrink-0">
        <VerdictGlyph verdict={verdict} />
      </span>
      <span
        className={highlight ? "text-foreground" : "text-muted-foreground"}
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          fontWeight: highlight ? 500 : 400,
          letterSpacing: "-0.005em",
        }}
      >
        {text}
      </span>
    </div>
  );
}

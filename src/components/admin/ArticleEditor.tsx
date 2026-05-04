"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  ARTICLE_CATEGORIES,
  ARTICLE_LOCALES,
  ARTICLE_STATUSES,
  type ArticleContent,
  type ArticleLocale,
  type ArticleUpsertInput,
} from "@/lib/article-content";

type Props = {
  mode: "create" | "edit";
  articleId?: string;
  initial: ArticleUpsertInput;
};

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  hint?: string;
};

function Field({
  label,
  value,
  onChange,
  multiline,
  placeholder,
  hint,
}: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-foreground text-xs font-medium">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="border-border bg-background focus:border-foreground rounded-md border px-3 py-2 text-sm transition-colors outline-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="border-border bg-background focus:border-foreground rounded-md border px-3 py-2 text-sm transition-colors outline-none"
        />
      )}
      {hint && (
        <span className="text-muted-foreground text-[11px]">{hint}</span>
      )}
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border rounded-lg border p-5">
      <h3 className="text-foreground mb-4 text-sm font-semibold">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function ListField({
  label,
  values,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div className="md:col-span-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-foreground text-xs font-medium">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...values, ""])}
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          + Add
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-muted-foreground mt-2 w-6 text-right font-mono text-[10px]">
              {String(i + 1).padStart(2, "0")}
            </span>
            {multiline ? (
              <textarea
                value={v}
                onChange={(e) => {
                  const next = [...values];
                  next[i] = e.target.value;
                  onChange(next);
                }}
                rows={2}
                placeholder={placeholder}
                className="border-border bg-background focus:border-foreground flex-1 rounded-md border px-3 py-2 text-sm transition-colors outline-none"
              />
            ) : (
              <input
                value={v}
                onChange={(e) => {
                  const next = [...values];
                  next[i] = e.target.value;
                  onChange(next);
                }}
                placeholder={placeholder}
                className="border-border bg-background focus:border-foreground flex-1 rounded-md border px-3 py-2 text-sm transition-colors outline-none"
              />
            )}
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="text-muted-foreground mt-2 text-xs hover:text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentForm({
  content,
  onChange,
}: {
  content: ArticleContent;
  onChange: (c: ArticleContent) => void;
}) {
  const update = <K extends keyof ArticleContent>(
    key: K,
    value: ArticleContent[K],
  ) => onChange({ ...content, [key]: value });

  return (
    <div className="flex flex-col gap-5">
      <Section title="SEO / OpenGraph">
        <Field
          label="SEO title"
          value={content.seo.title}
          onChange={(v) => update("seo", { ...content.seo, title: v })}
        />
        <Field
          label="OG alt"
          value={content.seo.ogAlt}
          onChange={(v) => update("seo", { ...content.seo, ogAlt: v })}
        />
        <div className="md:col-span-2">
          <Field
            label="SEO description"
            value={content.seo.description}
            multiline
            onChange={(v) => update("seo", { ...content.seo, description: v })}
          />
        </div>
        <div className="md:col-span-2">
          <Field
            label="SEO keywords (comma-separated)"
            value={content.seo.keywords}
            multiline
            onChange={(v) => update("seo", { ...content.seo, keywords: v })}
          />
        </div>
      </Section>

      <Section title="Hero">
        <Field
          label="Eyebrow"
          value={content.hero.eyebrow}
          onChange={(v) => update("hero", { ...content.hero, eyebrow: v })}
        />
        <Field
          label="Title (H1)"
          value={content.hero.title}
          onChange={(v) => update("hero", { ...content.hero, title: v })}
        />
        <div className="md:col-span-2">
          <Field
            label="Subtitle"
            value={content.hero.subtitle}
            multiline
            onChange={(v) => update("hero", { ...content.hero, subtitle: v })}
          />
        </div>
        <div className="md:col-span-2">
          <Field
            label="Lede (intro paragraph)"
            value={content.hero.lede}
            multiline
            onChange={(v) => update("hero", { ...content.hero, lede: v })}
          />
        </div>
      </Section>

      <Section title="Meta / breadcrumb">
        <Field
          label="Breadcrumb (current page label)"
          value={content.meta.breadcrumbCurrent}
          onChange={(v) =>
            update("meta", { ...content.meta, breadcrumbCurrent: v })
          }
        />
        <Field
          label="Last updated label"
          value={content.meta.lastUpdatedLabel}
          onChange={(v) =>
            update("meta", { ...content.meta, lastUpdatedLabel: v })
          }
        />
        <Field
          label="Last updated date (YYYY-MM-DD)"
          value={content.meta.lastUpdatedDate}
          onChange={(v) =>
            update("meta", { ...content.meta, lastUpdatedDate: v })
          }
        />
      </Section>

      <Section title="TL;DR">
        <Field
          label="Eyebrow"
          value={content.tldr.eyebrow}
          onChange={(v) => update("tldr", { ...content.tldr, eyebrow: v })}
        />
        <Field
          label="Title"
          value={content.tldr.title}
          onChange={(v) => update("tldr", { ...content.tldr, title: v })}
        />
        <ListField
          label="Bullet items"
          values={content.tldr.items}
          onChange={(v) => update("tldr", { ...content.tldr, items: v })}
          multiline
        />
      </Section>

      <Section title="Two-column section">
        <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
          <div className="border-border flex flex-col gap-3 rounded-md border p-3">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase">
              Left
            </span>
            <Field
              label="Eyebrow"
              value={content.twoColumn.left.eyebrow}
              onChange={(v) =>
                update("twoColumn", {
                  ...content.twoColumn,
                  left: { ...content.twoColumn.left, eyebrow: v },
                })
              }
            />
            <Field
              label="Title"
              value={content.twoColumn.left.title}
              onChange={(v) =>
                update("twoColumn", {
                  ...content.twoColumn,
                  left: { ...content.twoColumn.left, title: v },
                })
              }
            />
            <Field
              label="Body"
              value={content.twoColumn.left.body}
              multiline
              onChange={(v) =>
                update("twoColumn", {
                  ...content.twoColumn,
                  left: { ...content.twoColumn.left, body: v },
                })
              }
            />
          </div>
          <div className="border-border flex flex-col gap-3 rounded-md border p-3">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase">
              Right
            </span>
            <Field
              label="Eyebrow"
              value={content.twoColumn.right.eyebrow}
              onChange={(v) =>
                update("twoColumn", {
                  ...content.twoColumn,
                  right: { ...content.twoColumn.right, eyebrow: v },
                })
              }
            />
            <Field
              label="Title"
              value={content.twoColumn.right.title}
              onChange={(v) =>
                update("twoColumn", {
                  ...content.twoColumn,
                  right: { ...content.twoColumn.right, title: v },
                })
              }
            />
            <Field
              label="Body"
              value={content.twoColumn.right.body}
              multiline
              onChange={(v) =>
                update("twoColumn", {
                  ...content.twoColumn,
                  right: { ...content.twoColumn.right, body: v },
                })
              }
            />
          </div>
        </div>
      </Section>

      <Section title="Comparison table">
        <Field
          label="Eyebrow"
          value={content.comparison.eyebrow}
          onChange={(v) =>
            update("comparison", { ...content.comparison, eyebrow: v })
          }
        />
        <Field
          label="Title"
          value={content.comparison.title}
          onChange={(v) =>
            update("comparison", { ...content.comparison, title: v })
          }
        />
        <div className="md:col-span-2">
          <Field
            label="Note (footer, optional)"
            value={content.comparison.note}
            onChange={(v) =>
              update("comparison", { ...content.comparison, note: v })
            }
          />
        </div>
        <Field
          label="Header: Feature column"
          value={content.comparison.headers.feature}
          onChange={(v) =>
            update("comparison", {
              ...content.comparison,
              headers: { ...content.comparison.headers, feature: v },
            })
          }
        />
        <Field
          label="Header: UC column"
          value={content.comparison.headers.uc}
          onChange={(v) =>
            update("comparison", {
              ...content.comparison,
              headers: { ...content.comparison.headers, uc: v },
            })
          }
        />
        <div className="md:col-span-2">
          <Field
            label="Header: Other column"
            value={content.comparison.headers.other}
            onChange={(v) =>
              update("comparison", {
                ...content.comparison,
                headers: { ...content.comparison.headers, other: v },
              })
            }
          />
        </div>

        <div className="md:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-foreground text-xs font-medium">Rows</span>
            <button
              type="button"
              onClick={() =>
                update("comparison", {
                  ...content.comparison,
                  rows: [
                    ...content.comparison.rows,
                    { feature: "", uc: "", other: "" },
                  ],
                })
              }
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              + Add row
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {content.comparison.rows.map((row, i) => (
              <div
                key={i}
                className="border-border grid grid-cols-[1fr_1fr_1fr_auto] gap-2 rounded-md border p-2"
              >
                <input
                  value={row.feature}
                  placeholder="Feature"
                  onChange={(e) => {
                    const next = [...content.comparison.rows];
                    next[i] = { ...next[i], feature: e.target.value };
                    update("comparison", { ...content.comparison, rows: next });
                  }}
                  className="border-border bg-background focus:border-foreground rounded-md border px-2 py-1.5 text-xs outline-none"
                />
                <input
                  value={row.uc}
                  placeholder="UC"
                  onChange={(e) => {
                    const next = [...content.comparison.rows];
                    next[i] = { ...next[i], uc: e.target.value };
                    update("comparison", { ...content.comparison, rows: next });
                  }}
                  className="border-border bg-background focus:border-foreground rounded-md border px-2 py-1.5 text-xs outline-none"
                />
                <input
                  value={row.other}
                  placeholder="Other"
                  onChange={(e) => {
                    const next = [...content.comparison.rows];
                    next[i] = { ...next[i], other: e.target.value };
                    update("comparison", { ...content.comparison, rows: next });
                  }}
                  className="border-border bg-background focus:border-foreground rounded-md border px-2 py-1.5 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = content.comparison.rows.filter(
                      (_, idx) => idx !== i,
                    );
                    update("comparison", { ...content.comparison, rows: next });
                  }}
                  className="text-muted-foreground px-2 text-xs hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Steps / How-to">
        <Field
          label="Eyebrow"
          value={content.steps.eyebrow}
          onChange={(v) => update("steps", { ...content.steps, eyebrow: v })}
        />
        <Field
          label="Title"
          value={content.steps.title}
          onChange={(v) => update("steps", { ...content.steps, title: v })}
        />
        <ListField
          label="Steps"
          values={content.steps.items}
          onChange={(v) => update("steps", { ...content.steps, items: v })}
          multiline
        />
      </Section>

      <Section title="Verdict">
        <Field
          label="Eyebrow"
          value={content.verdict.eyebrow}
          onChange={(v) =>
            update("verdict", { ...content.verdict, eyebrow: v })
          }
        />
        <Field
          label="Title"
          value={content.verdict.title}
          onChange={(v) => update("verdict", { ...content.verdict, title: v })}
        />
        <div className="md:col-span-2">
          <Field
            label="Body"
            value={content.verdict.body}
            multiline
            onChange={(v) => update("verdict", { ...content.verdict, body: v })}
          />
        </div>
      </Section>

      <Section title="FAQ">
        <Field
          label="Eyebrow"
          value={content.faq.eyebrow}
          onChange={(v) => update("faq", { ...content.faq, eyebrow: v })}
        />
        <Field
          label="Title"
          value={content.faq.title}
          onChange={(v) => update("faq", { ...content.faq, title: v })}
        />
        <div className="md:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-foreground text-xs font-medium">
              FAQ items
            </span>
            <button
              type="button"
              onClick={() =>
                update("faq", {
                  ...content.faq,
                  items: [...content.faq.items, { q: "", a: "" }],
                })
              }
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              + Add Q&A
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {content.faq.items.map((item, i) => (
              <div
                key={i}
                className="border-border flex flex-col gap-2 rounded-md border p-3"
              >
                <div className="flex items-start gap-2">
                  <input
                    value={item.q}
                    placeholder="Question"
                    onChange={(e) => {
                      const next = [...content.faq.items];
                      next[i] = { ...next[i], q: e.target.value };
                      update("faq", { ...content.faq, items: next });
                    }}
                    className="border-border bg-background focus:border-foreground flex-1 rounded-md border px-3 py-2 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = content.faq.items.filter(
                        (_, idx) => idx !== i,
                      );
                      update("faq", { ...content.faq, items: next });
                    }}
                    className="text-muted-foreground px-2 text-xs hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  value={item.a}
                  placeholder="Answer"
                  rows={3}
                  onChange={(e) => {
                    const next = [...content.faq.items];
                    next[i] = { ...next[i], a: e.target.value };
                    update("faq", { ...content.faq, items: next });
                  }}
                  className="border-border bg-background focus:border-foreground rounded-md border px-3 py-2 text-sm outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="CTA">
        <Field
          label="Eyebrow"
          value={content.cta.eyebrow}
          onChange={(v) => update("cta", { ...content.cta, eyebrow: v })}
        />
        <Field
          label="Title"
          value={content.cta.title}
          onChange={(v) => update("cta", { ...content.cta, title: v })}
        />
        <div className="md:col-span-2">
          <Field
            label="Body"
            value={content.cta.body}
            multiline
            onChange={(v) => update("cta", { ...content.cta, body: v })}
          />
        </div>
        <Field
          label="Primary button label"
          value={content.cta.primary}
          onChange={(v) => update("cta", { ...content.cta, primary: v })}
        />
        <Field
          label="Secondary button label"
          value={content.cta.secondary}
          onChange={(v) => update("cta", { ...content.cta, secondary: v })}
        />
      </Section>

      <Section title="Schema.org extras">
        <ListField
          label="About (additional SoftwareApplication names for JSON-LD)"
          values={content.about ?? []}
          onChange={(v) => update("about", v)}
          placeholder="e.g. Maccy"
        />
        <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
          <Field
            label="HowTo totalTime (ISO 8601, e.g. PT5M) — optional"
            value={content.howTo?.totalTime ?? ""}
            onChange={(v) =>
              update(
                "howTo",
                v
                  ? {
                      tools: content.howTo?.tools ?? [],
                      totalTime: v,
                    }
                  : content.howTo
                    ? { ...content.howTo, totalTime: undefined }
                    : undefined,
              )
            }
            hint="Leave blank to drop HowTo schema"
          />
          <ListField
            label="HowTo tools — optional"
            values={content.howTo?.tools ?? []}
            onChange={(v) =>
              update(
                "howTo",
                v.length > 0
                  ? {
                      tools: v,
                      totalTime: content.howTo?.totalTime,
                    }
                  : undefined,
              )
            }
          />
        </div>
      </Section>
    </div>
  );
}

export function ArticleEditor({ mode, articleId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeLocale, setActiveLocale] = useState<ArticleLocale>("en");
  const [state, setState] = useState<ArticleUpsertInput>(initial);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const url =
        mode === "create"
          ? "/api/admin/articles"
          : `/api/admin/articles/${articleId}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          setError(json.details ?? json.error ?? text);
        } catch {
          setError(text);
        }
        return;
      }
      router.push("/admin/articles");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-foreground text-2xl font-semibold">
          {mode === "create" ? "New article" : "Edit article"}
        </h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="bg-foreground text-background rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <section className="border-border grid gap-4 rounded-lg border p-5 md:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-foreground text-xs font-medium">Slug</span>
          <input
            value={state.slug}
            onChange={(e) =>
              setState((s) => ({ ...s, slug: e.target.value.toLowerCase() }))
            }
            placeholder="kebab-case-slug"
            className="border-border bg-background focus:border-foreground rounded-md border px-3 py-2 font-mono text-sm outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-foreground text-xs font-medium">Category</span>
          <select
            value={state.category}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                category: e.target.value as ArticleUpsertInput["category"],
              }))
            }
            className="border-border bg-background focus:border-foreground rounded-md border px-3 py-2 text-sm outline-none"
          >
            {ARTICLE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-foreground text-xs font-medium">
            Date published
          </span>
          <input
            type="date"
            value={state.datePublished}
            onChange={(e) =>
              setState((s) => ({ ...s, datePublished: e.target.value }))
            }
            className="border-border bg-background focus:border-foreground rounded-md border px-3 py-2 text-sm outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-foreground text-xs font-medium">Status</span>
          <select
            value={state.status}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                status: e.target.value as ArticleUpsertInput["status"],
              }))
            }
            className="border-border bg-background focus:border-foreground rounded-md border px-3 py-2 text-sm outline-none"
          >
            {ARTICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="border-border flex border-b">
        {ARTICLE_LOCALES.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => setActiveLocale(loc)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              activeLocale === loc
                ? "border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            {loc.toUpperCase()} content
          </button>
        ))}
      </div>

      <ContentForm
        key={activeLocale}
        content={state.translations[activeLocale]}
        onChange={(c) =>
          setState((s) => ({
            ...s,
            translations: { ...s.translations, [activeLocale]: c },
          }))
        }
      />

      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="bg-foreground text-background rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

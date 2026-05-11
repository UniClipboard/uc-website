"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  id: string;
  version: string;
  pubDate: string;
  notesEn: string;
  notesZh: string;
  manualOverride: boolean;
};

export function ChangelogEditor({
  id,
  version,
  pubDate,
  notesEn: initialEn,
  notesZh: initialZh,
  manualOverride: initialOverride,
}: Props) {
  const router = useRouter();
  const [notesEn, setNotesEn] = useState(initialEn);
  const [notesZh, setNotesZh] = useState(initialZh);
  const [override, setOverride] = useState(initialOverride);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty =
    notesEn !== initialEn ||
    notesZh !== initialZh ||
    override !== initialOverride;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const payload: {
      notesEn?: string;
      notesZh?: string;
      manualOverride?: boolean;
    } = {};
    if (notesEn !== initialEn) payload.notesEn = notesEn;
    if (notesZh !== initialZh) payload.notesZh = notesZh;
    if (override !== initialOverride) payload.manualOverride = override;

    if (Object.keys(payload).length === 0) return;

    startTransition(async () => {
      const res = await fetch(`/api/admin/releases/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? `保存失败：${res.status}`);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-muted-foreground mb-1 text-xs">
            <Link
              href="/admin/changelog"
              className="hover:text-foreground transition-colors"
            >
              ← 返回 changelog 列表
            </Link>
          </div>
          <h1 className="text-foreground font-mono text-2xl font-semibold">
            v{version}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs">
            发布于 {pubDate.slice(0, 10)} ·{" "}
            {initialOverride ? (
              <span className="text-amber-600 dark:text-amber-400">
                已手动覆盖（sync 不会重写）
              </span>
            ) : (
              <span>自动同步状态</span>
            )}
          </p>
        </div>
        <Link
          href={`/changelog/${version}`}
          target="_blank"
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          在前台查看 ↗
        </Link>
      </div>

      <form onSubmit={save} className="space-y-5">
        <section className="border-border rounded-lg border p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-foreground text-sm font-semibold">
              English notes
            </h2>
            <span className="text-muted-foreground font-mono text-[11px]">
              {notesEn.length} chars
            </span>
          </div>
          <textarea
            value={notesEn}
            onChange={(e) => setNotesEn(e.target.value)}
            rows={18}
            className="border-border bg-background text-foreground focus:border-foreground w-full rounded border px-3 py-2 font-mono text-sm transition-colors outline-none"
            placeholder="## 1.2.3&#10;&#10;### Features&#10;&#10;- ..."
          />
        </section>

        <section className="border-border rounded-lg border p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-foreground text-sm font-semibold">
              中文 notes
            </h2>
            <span className="text-muted-foreground font-mono text-[11px]">
              {notesZh.length} chars
            </span>
          </div>
          <textarea
            value={notesZh}
            onChange={(e) => setNotesZh(e.target.value)}
            rows={18}
            className="border-border bg-background text-foreground focus:border-foreground w-full rounded border px-3 py-2 font-mono text-sm transition-colors outline-none"
            placeholder="## 1.2.3&#10;&#10;### 新增&#10;&#10;- ..."
          />
        </section>

        <section className="border-border bg-bg2/40 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <input
              id="cl-manual-override"
              type="checkbox"
              checked={override}
              onChange={(e) => setOverride(e.target.checked)}
              className="mt-0.5"
            />
            <label htmlFor="cl-manual-override" className="cursor-pointer">
              <span className="text-foreground block text-sm font-medium">
                保护手动编辑
              </span>
              <span className="text-muted-foreground mt-0.5 block text-xs">
                勾选后，sync 不会用 stable.json 重写 notes。任何 notes
                修改在保存时会自动勾选此项。
              </span>
            </label>
          </div>
        </section>

        {error && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {saved && !error && (
          <p className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-400">
            已保存。
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending || !dirty}
            className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {pending ? "保存中..." : "保存"}
          </button>
          <Link
            href="/admin/changelog"
            className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}

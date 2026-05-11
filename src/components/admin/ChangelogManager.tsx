"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Row = {
  id: string;
  version: string;
  pubDate: string;
  manualOverride: boolean;
  updatedAt: string;
};

type SyncResult =
  | { status: "inserted"; version: string }
  | { status: "updated"; version: string }
  | { status: "unchanged"; version: string }
  | { status: "skipped"; reason: string };

const formatDate = (iso: string) => iso.slice(0, 10);

const statusMessage = (r: SyncResult): string => {
  switch (r.status) {
    case "inserted":
      return `已新增 v${r.version}`;
    case "updated":
      return `已更新 v${r.version}`;
    case "unchanged":
      return `v${r.version} 已是最新`;
    case "skipped":
      return `同步失败：${r.reason}`;
  }
};

export function ChangelogManager({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{
    tone: "ok" | "err";
    text: string;
  } | null>(null);

  const triggerSync = () => {
    setNotice(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/releases/sync", { method: "POST" });
      const body = (await res.json().catch(() => null)) as SyncResult | null;
      if (!body) {
        setNotice({ tone: "err", text: `同步请求失败：${res.status}` });
        return;
      }
      setNotice({
        tone: body.status === "skipped" ? "err" : "ok",
        text: statusMessage(body),
      });
      router.refresh();
    });
  };

  const remove = (row: Row) => {
    if (
      !confirm(
        `确定删除 v${row.version}？\n下次 sync 时如果 stable.json 仍是这个版本，会被重新插入。`,
      )
    )
      return;
    setNotice(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/releases/${row.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setNotice({
          tone: "err",
          text: `删除失败：${body?.error ?? res.status}`,
        });
        return;
      }
      setNotice({ tone: "ok", text: `已删除 v${row.version}` });
      router.refresh();
    });
  };

  const resetOverride = (row: Row) => {
    if (
      !confirm(
        `重置 v${row.version} 的手动编辑标记？\n下次 sync 会重新用 stable.json 的内容覆盖 notes。`,
      )
    )
      return;
    setNotice(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/releases/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ manualOverride: false }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setNotice({
          tone: "err",
          text: `重置失败：${body?.error ?? res.status}`,
        });
        return;
      }
      setNotice({ tone: "ok", text: `已重置 v${row.version}` });
      router.refresh();
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Changelog</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            共 {initial.length} 个版本 · 从{" "}
            <code className="font-mono text-xs">stable.json</code>{" "}
            同步，可手动编辑 notes（标记为「已覆盖」后不会被 sync 重写）。
          </p>
        </div>
        <button
          type="button"
          onClick={triggerSync}
          disabled={pending}
          className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "同步中..." : "立即同步"}
        </button>
      </div>

      {notice && (
        <div
          className={`mb-4 rounded-md border px-3 py-2 text-xs ${
            notice.tone === "ok"
              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
          }`}
        >
          {notice.text}
        </div>
      )}

      {initial.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-lg border p-12 text-center text-sm">
          还没有同步任何版本。点击「立即同步」从 stable.json 拉取。
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-border bg-bg2 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">版本</th>
                <th className="px-4 py-3 font-medium">发布日期</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">最近更新</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {initial.map((row) => (
                <tr
                  key={row.id}
                  className="border-border border-b last:border-b-0"
                >
                  <td className="text-foreground px-4 py-3 font-mono text-sm font-medium">
                    v{row.version}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs">
                    {formatDate(row.pubDate)}
                  </td>
                  <td className="px-4 py-3">
                    {row.manualOverride ? (
                      <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                        手动覆盖
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-400">
                        自动同步
                      </span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs">
                    {formatDate(row.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/changelog/${row.id}/edit`}
                        className="text-foreground hover:underline"
                      >
                        编辑
                      </Link>
                      <Link
                        href={`/changelog/${row.version}`}
                        target="_blank"
                        className="hover:text-foreground"
                      >
                        查看
                      </Link>
                      {row.manualOverride && (
                        <button
                          type="button"
                          onClick={() => resetOverride(row)}
                          disabled={pending}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                          title="清除手动覆盖标记，下次 sync 会重新拉取 notes"
                        >
                          重置
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => remove(row)}
                        disabled={pending}
                        className="text-red-500 hover:text-red-400 disabled:opacity-50"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

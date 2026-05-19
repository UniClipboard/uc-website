"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type Row = {
  id: string;
  email: string;
  locale: string | null;
  userAgent: string | null;
  note: string | null;
  invitedAt: string | null;
  createdAt: string;
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const h = String(d.getUTCHours()).padStart(2, "0");
    const mn = String(d.getUTCMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${mn} UTC`;
  } catch {
    return iso;
  }
}

export function IosBetaSignupsManager({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [isPending, startTransition] = useTransition();

  const selectedCount = selected.size;
  const allSelected = useMemo(
    () => initial.length > 0 && selectedCount === initial.length,
    [initial.length, selectedCount],
  );
  const someSelected = selectedCount > 0 && !allSelected;
  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const toggleRowSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (prev.size === initial.length) return new Set();
      return new Set(initial.map((r) => r.id));
    });
  };

  const copyAllEmails = async () => {
    const text = initial.map((r) => r.email).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleInvited = (row: Row) => {
    const invited = !row.invitedAt;
    if (!invited && !confirm(`确定撤销 ${row.email} 的"已邀请"标记？`)) {
      return;
    }
    setPendingId(row.id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/ios-beta-signups/${row.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ invited }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          alert(body?.error ?? `请求失败：${res.status}`);
          return;
        }
        router.refresh();
      } finally {
        setPendingId(null);
      }
    });
  };

  const bulkSetInvited = (invited: boolean) => {
    if (selectedIds.length === 0) return;
    const verb = invited ? "标记为已邀请" : "撤销已邀请";
    if (!confirm(`确定对选中的 ${selectedIds.length} 条记录${verb}？`)) {
      return;
    }
    setBulkBusy(true);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/ios-beta-signups`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids: selectedIds, invited }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          alert(body?.error ?? `请求失败：${res.status}`);
          return;
        }
        setSelected(new Set());
        router.refresh();
      } finally {
        setBulkBusy(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            iOS Beta 申请
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            共 {initial.length} 个邮箱。从这里复制或下载 CSV，再去 TestFlight
            发邀请。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyAllEmails}
            disabled={initial.length === 0}
            className="border-border hover:bg-bg2 inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? "已复制" : "复制全部邮箱"}
          </button>
          <a
            href="/api/admin/ios-beta-signups?format=csv"
            download
            className="bg-foreground text-background inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
          >
            下载 CSV
          </a>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="border-border bg-bg2 flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
          <div className="text-foreground">已选 {selectedCount} 条</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              disabled={bulkBusy}
              className="border-border hover:bg-bg1 inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              清除选择
            </button>
            <button
              type="button"
              onClick={() => bulkSetInvited(false)}
              disabled={bulkBusy}
              className="border-border hover:bg-bg1 inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkBusy ? "处理中…" : "批量撤销已邀请"}
            </button>
            <button
              type="button"
              onClick={() => bulkSetInvited(true)}
              disabled={bulkBusy}
              className="bg-foreground text-background inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkBusy ? "处理中…" : "批量标记为已邀请"}
            </button>
          </div>
        </div>
      )}

      {initial.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-md border border-dashed py-10 text-center text-sm">
          还没有人申请。
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-bg2 text-muted-foreground">
              <tr className="border-border border-b text-left">
                <th className="w-10 px-4 py-2 font-medium">
                  <input
                    type="checkbox"
                    aria-label="全选"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="size-4 cursor-pointer align-middle"
                  />
                </th>
                <th className="px-4 py-2 font-medium">邮箱</th>
                <th className="px-4 py-2 font-medium">提交时间</th>
                <th className="px-4 py-2 font-medium">语言</th>
                <th className="px-4 py-2 font-medium">邀请状态</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {initial.map((row) => {
                const invited = !!row.invitedAt;
                const rowBusy = isPending && pendingId === row.id;
                const checked = selected.has(row.id);
                return (
                  <tr
                    key={row.id}
                    data-selected={checked || undefined}
                    className="border-border data-[selected=true]:bg-bg2/60 border-b last:border-0"
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        aria-label={`选择 ${row.email}`}
                        checked={checked}
                        onChange={() => toggleRowSelected(row.id)}
                        className="size-4 cursor-pointer align-middle"
                      />
                    </td>
                    <td className="text-foreground px-4 py-2 font-mono">
                      {row.email}
                    </td>
                    <td className="text-muted-foreground px-4 py-2">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="text-muted-foreground px-4 py-2">
                      {row.locale ?? "—"}
                    </td>
                    <td className="text-muted-foreground px-4 py-2">
                      {invited ? (
                        <span className="text-foreground inline-flex items-center gap-1.5">
                          <span
                            aria-hidden
                            className="inline-block size-1.5 rounded-full"
                            style={{ background: "#3DA47A" }}
                          />
                          已邀请 · {formatDate(row.invitedAt!)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            aria-hidden
                            className="inline-block size-1.5 rounded-full"
                            style={{ background: "#E0A23A" }}
                          />
                          待邀请
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => toggleInvited(row)}
                        disabled={rowBusy || bulkBusy}
                        className="border-border hover:bg-bg2 inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {rowBusy
                          ? "处理中…"
                          : invited
                            ? "撤销已邀请"
                            : "标记为已邀请"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

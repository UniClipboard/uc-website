"use client";

import { useState } from "react";

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
  const [copied, setCopied] = useState(false);

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

      {initial.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-md border border-dashed py-10 text-center text-sm">
          还没有人申请。
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-bg2 text-muted-foreground">
              <tr className="border-border border-b text-left">
                <th className="px-4 py-2 font-medium">邮箱</th>
                <th className="px-4 py-2 font-medium">提交时间</th>
                <th className="px-4 py-2 font-medium">语言</th>
                <th className="px-4 py-2 font-medium">邀请状态</th>
              </tr>
            </thead>
            <tbody>
              {initial.map((row) => (
                <tr
                  key={row.id}
                  className="border-border border-b last:border-0"
                >
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
                    {row.invitedAt ? (
                      <span className="text-foreground inline-flex items-center gap-1.5">
                        <span
                          aria-hidden
                          className="inline-block size-1.5 rounded-full"
                          style={{ background: "#3DA47A" }}
                        />
                        已邀请 · {formatDate(row.invitedAt)}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

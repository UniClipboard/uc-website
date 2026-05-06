"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FOUNDER_PLATFORMS } from "@/lib/founder-platforms";

type Row = {
  id: string;
  name: string;
  platform: string;
  joinedAt: string;
  note: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  name: string;
  platform: string;
  joinedAt: string;
  note: string;
  displayOrder: string;
};

const PLATFORM_LABELS: Record<string, string> = {
  github: "GitHub",
  bilibili: "哔哩哔哩",
  twitter: "Twitter / X",
  weibo: "微博",
  xiaohongshu: "小红书",
  douyin: "抖音",
  youtube: "YouTube",
  email: "邮箱",
  other: "其他",
};

const platformLabel = (p: string) => PLATFORM_LABELS[p] ?? p;

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (order: number): FormState => ({
  name: "",
  platform: "github",
  joinedAt: today(),
  note: "",
  displayOrder: String(order),
});

export function FoundersManager({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(initial.length));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const beginCreate = () => {
    setEditingId(null);
    setError(null);
    const nextOrder =
      initial.length === 0
        ? 0
        : Math.max(...initial.map((r) => r.displayOrder)) + 1;
    setForm(emptyForm(nextOrder));
    setCreating(true);
  };

  const beginEdit = (row: Row) => {
    setCreating(false);
    setError(null);
    setEditingId(row.id);
    setForm({
      name: row.name,
      platform: row.platform,
      joinedAt: row.joinedAt,
      note: row.note ?? "",
      displayOrder: String(row.displayOrder),
    });
  };

  const cancel = () => {
    setCreating(false);
    setEditingId(null);
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const orderNum = Number.parseInt(form.displayOrder, 10);
    const payload = {
      name: form.name.trim(),
      platform: form.platform,
      joinedAt: form.joinedAt,
      note: form.note.trim() || null,
      displayOrder: Number.isFinite(orderNum) ? orderNum : 0,
    };
    if (!payload.name) {
      setError("用户名必填");
      return;
    }
    startTransition(async () => {
      const url = editingId
        ? `/api/admin/founders/${editingId}`
        : "/api/admin/founders";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? `请求失败：${res.status}`);
        return;
      }
      cancel();
      router.refresh();
    });
  };

  const remove = (id: string, name: string) => {
    if (!confirm(`确定删除「${name}」？`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/founders/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        alert(`删除失败：${await res.text()}`);
        return;
      }
      router.refresh();
    });
  };

  const move = (row: Row, direction: -1 | 1) => {
    const sorted = [...initial].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex((r) => r.id === row.id);
    const targetIdx = idx + direction;
    if (idx < 0 || targetIdx < 0 || targetIdx >= sorted.length) return;
    const target = sorted[targetIdx];
    startTransition(async () => {
      const a = fetch(`/api/admin/founders/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayOrder: target.displayOrder }),
      });
      const b = fetch(`/api/admin/founders/${target.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayOrder: row.displayOrder }),
      });
      const [ra, rb] = await Promise.all([a, b]);
      if (!ra.ok || !rb.ok) {
        alert("调整顺序失败");
        return;
      }
      router.refresh();
    });
  };

  const formOpen = creating || editingId !== null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">创始用户</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            共 {initial.length} 位 ·
            记录项目初期参与的用户，用于公开致谢。公开页只展示用户名，按下方顺序排列。
          </p>
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={beginCreate}
            className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium"
          >
            新增
          </button>
        )}
      </div>

      {formOpen && (
        <form
          onSubmit={submit}
          className="border-border bg-bg2/50 mb-6 grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2"
        >
          <div>
            <label
              className="text-foreground text-xs font-medium"
              htmlFor="sh-name"
            >
              用户名
            </label>
            <input
              id="sh-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={120}
              required
              className="border-border bg-background text-foreground mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              className="text-foreground text-xs font-medium"
              htmlFor="sh-platform"
            >
              平台
            </label>
            <select
              id="sh-platform"
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="border-border bg-background text-foreground mt-1 w-full rounded border px-3 py-2 text-sm"
            >
              {FOUNDER_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {platformLabel(p)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="text-foreground text-xs font-medium"
              htmlFor="sh-joined"
            >
              加入时间
            </label>
            <input
              id="sh-joined"
              type="date"
              value={form.joinedAt}
              onChange={(e) => setForm({ ...form, joinedAt: e.target.value })}
              required
              className="border-border bg-background text-foreground mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              className="text-foreground text-xs font-medium"
              htmlFor="sh-order"
            >
              排序（数字越小越靠前）
            </label>
            <input
              id="sh-order"
              type="number"
              value={form.displayOrder}
              onChange={(e) =>
                setForm({ ...form, displayOrder: e.target.value })
              }
              className="border-border bg-background text-foreground mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              className="text-foreground text-xs font-medium"
              htmlFor="sh-note"
            >
              备注（可选，仅 admin 内部可见）
            </label>
            <textarea
              id="sh-note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              maxLength={500}
              rows={2}
              className="border-border bg-background text-foreground mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          {error && (
            <p className="text-xs text-red-500 sm:col-span-2">{error}</p>
          )}
          <div className="flex items-center gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={pending || !form.name.trim()}
              className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              {pending ? "保存中..." : editingId ? "保存修改" : "新增创始用户"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {initial.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-lg border p-12 text-center text-sm">
          还没有记录。点击「新增」添加第一位创始用户。
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-border bg-bg2 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">顺序</th>
                <th className="px-4 py-3 font-medium">用户名</th>
                <th className="px-4 py-3 font-medium">平台</th>
                <th className="px-4 py-3 font-medium">加入时间</th>
                <th className="px-4 py-3 font-medium">备注</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {initial.map((row, idx) => (
                <tr
                  key={row.id}
                  className="border-border border-b align-top last:border-b-0"
                >
                  <td className="text-muted-foreground px-4 py-3 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{row.displayOrder}</span>
                      <button
                        type="button"
                        onClick={() => move(row, -1)}
                        disabled={pending || idx === 0}
                        className="hover:text-foreground rounded px-1 disabled:opacity-30"
                        title="上移"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(row, 1)}
                        disabled={pending || idx === initial.length - 1}
                        className="hover:text-foreground rounded px-1 disabled:opacity-30"
                        title="下移"
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="text-foreground px-4 py-3 font-medium">
                    {row.name}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs">
                    {platformLabel(row.platform)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs">
                    {row.joinedAt}
                  </td>
                  <td className="text-muted-foreground max-w-xs px-4 py-3 text-xs">
                    {row.note || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => beginEdit(row)}
                        className="text-foreground hover:underline"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(row.id, row.name)}
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

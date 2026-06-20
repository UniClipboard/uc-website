"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { monogramFor } from "@/lib/sponsors";

type Tier = "gold" | "regular";

type Row = {
  id: string;
  name: string;
  url: string | null;
  tier: Tier;
  since: string | null;
  note: string | null;
  amountCents: number | null;
  githubLogin: string | null;
  avatar: string | null;
  hasUpload: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  name: string;
  url: string;
  tier: Tier;
  since: string;
  note: string;
  /** Sponsorship amount in yuan as typed (converted to cents on submit). */
  amount: string;
  githubLogin: string;
  displayOrder: string;
  avatarUrl: string;
  /** Data URI of a freshly chosen file (raw, downscaled server-side). */
  avatarUpload: string | null;
  clearAvatar: boolean;
};

const TIER_LABELS: Record<Tier, string> = { gold: "金牌", regular: "普通" };

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

/** Cents → a clean yuan string for the amount input (1888 → "18.88"). */
const centsToYuanInput = (cents: number | null): string =>
  cents == null ? "" : String(cents / 100);

/** Cents → "¥18.88" for the table, or "—" when unset. */
const formatAmount = (cents: number | null): string =>
  cents == null ? "—" : `¥${(cents / 100).toFixed(2)}`;

const emptyForm = (order: number): FormState => ({
  name: "",
  url: "",
  tier: "regular",
  since: "",
  note: "",
  amount: "",
  githubLogin: "",
  displayOrder: String(order),
  avatarUrl: "",
  avatarUpload: null,
  clearAvatar: false,
});

function Thumb({
  src,
  name,
  size = 36,
}: {
  src: string | null;
  name: string;
  size?: number;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="border-border flex-none rounded-full border object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const m = monogramFor(name || "?");
  return (
    <span
      className="flex flex-none items-center justify-center rounded-full text-xs font-semibold"
      style={{ width: size, height: size, background: m.bg, color: m.fg }}
    >
      {m.initials}
    </span>
  );
}

export function SponsorsManager({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(initial.length));
  const [initialAvatarUrl, setInitialAvatarUrl] = useState("");
  const [existingUpload, setExistingUpload] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ghStatus, setGhStatus] = useState<string | null>(null);
  const [ghLoading, setGhLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const editingRow = editingId
    ? initial.find((r) => r.id === editingId)
    : undefined;

  const resetFile = () => {
    if (fileRef.current) fileRef.current.value = "";
  };

  const beginCreate = () => {
    setEditingId(null);
    setError(null);
    setGhStatus(null);
    const nextOrder =
      initial.length === 0
        ? 0
        : Math.max(...initial.map((r) => r.displayOrder)) + 1;
    setForm(emptyForm(nextOrder));
    setInitialAvatarUrl("");
    setExistingUpload(null);
    resetFile();
    setCreating(true);
  };

  const beginEdit = (row: Row) => {
    setCreating(false);
    setError(null);
    setGhStatus(null);
    setEditingId(row.id);
    // For external-URL avatars, row.avatar IS the URL. For uploads, keep the
    // serving URL as a preview but leave the URL field empty.
    const urlAvatar = row.hasUpload ? "" : (row.avatar ?? "");
    setForm({
      name: row.name,
      url: row.url ?? "",
      tier: row.tier,
      since: row.since ?? "",
      note: row.note ?? "",
      amount: centsToYuanInput(row.amountCents),
      githubLogin: row.githubLogin ?? "",
      displayOrder: String(row.displayOrder),
      avatarUrl: urlAvatar,
      avatarUpload: null,
      clearAvatar: false,
    });
    setInitialAvatarUrl(urlAvatar);
    setExistingUpload(row.hasUpload ? row.avatar : null);
    resetFile();
  };

  const cancel = () => {
    setCreating(false);
    setEditingId(null);
    setError(null);
    setGhStatus(null);
    resetFile();
  };

  const lookupGithub = async () => {
    const login = form.githubLogin.trim();
    if (!login) {
      setGhStatus("请先填写 GitHub 用户名");
      return;
    }
    setGhLoading(true);
    setGhStatus(null);
    try {
      const res = await fetch(
        `/api/admin/sponsors/github-lookup?login=${encodeURIComponent(login)}`,
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGhStatus(body?.error ?? `查询失败：${res.status}`);
        return;
      }
      setForm((f) => ({
        ...f,
        githubLogin: body.login ?? login,
        name: f.name.trim() || body.name || body.login || login,
        url: f.url.trim() || body.htmlUrl || "",
        avatarUrl: body.avatarUrl ?? "",
        avatarUpload: null,
        clearAvatar: false,
      }));
      setExistingUpload(null);
      resetFile();
      setGhStatus(`已获取：${body.name || body.login}`);
    } catch (e) {
      setGhStatus(e instanceof Error ? e.message : "查询失败");
    } finally {
      setGhLoading(false);
    }
  };

  const onPickFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("图片过大（上限 6MB）");
      resetFile();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({
        ...f,
        avatarUpload: reader.result as string,
        clearAvatar: false,
      }));
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setForm((f) => ({
      ...f,
      avatarUpload: null,
      avatarUrl: "",
      clearAvatar: true,
    }));
    setExistingUpload(null);
    resetFile();
  };

  // What to show in the avatar preview, in precedence order.
  const previewSrc =
    form.avatarUpload ||
    (form.avatarUrl.trim() ? form.avatarUrl.trim() : null) ||
    (!form.clearAvatar ? existingUpload : null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = form.name.trim();
    if (!name) {
      setError("名称必填");
      return;
    }
    if (form.since && !/^\d{4}-\d{2}$/.test(form.since)) {
      setError("赞助起始月份格式应为 YYYY-MM");
      return;
    }
    const amountStr = form.amount.trim();
    let amountCents: number | null = null;
    if (amountStr) {
      if (!/^\d+(\.\d{1,2})?$/.test(amountStr)) {
        setError("赞助金额格式有误（最多两位小数，例如 18.88）");
        return;
      }
      amountCents = Math.round(Number.parseFloat(amountStr) * 100);
      if (!Number.isFinite(amountCents) || amountCents > 2_000_000_000) {
        setError("赞助金额超出范围");
        return;
      }
    }
    const orderNum = Number.parseInt(form.displayOrder, 10);

    type Payload = Record<string, unknown>;
    const payload: Payload = {
      name,
      url: form.url.trim() || null,
      tier: form.tier,
      since: form.since.trim() || null,
      note: form.note.trim() || null,
      amountCents,
      githubLogin: form.githubLogin.trim() || null,
    };
    // Only send displayOrder when it parses — a blank/invalid field would
    // otherwise silently reorder the sponsor to the top (0). Omitting it lets
    // the server keep the current order (PATCH) or auto-append (POST).
    if (Number.isFinite(orderNum)) {
      payload.displayOrder = orderNum;
    }

    // Avatar precedence: new upload > explicit clear > changed URL.
    if (form.avatarUpload) {
      payload.avatarUpload = form.avatarUpload;
    } else if (form.clearAvatar) {
      payload.clearAvatar = true;
    } else if (editingId) {
      if (form.avatarUrl.trim() !== initialAvatarUrl.trim()) {
        payload.avatarUrl = form.avatarUrl.trim() || null;
      }
    } else if (form.avatarUrl.trim()) {
      payload.avatarUrl = form.avatarUrl.trim();
    }

    startTransition(async () => {
      const url = editingId
        ? `/api/admin/sponsors/${editingId}`
        : "/api/admin/sponsors";
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
      const res = await fetch(`/api/admin/sponsors/${id}`, {
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
      // Single atomic swap — both rows move together or neither does.
      const res = await fetch("/api/admin/sponsors/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idA: row.id, idB: target.id }),
      });
      if (!res.ok) {
        alert("调整顺序失败");
        return;
      }
      router.refresh();
    });
  };

  const formOpen = creating || editingId !== null;
  const inputCls =
    "border-border bg-background text-foreground mt-1 w-full rounded border px-3 py-2 text-sm";
  const labelCls = "text-foreground text-xs font-medium";

  const avatarSource = editingRow?.hasUpload
    ? "上传"
    : editingRow?.avatar
      ? "外链"
      : "—";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">赞助商</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            共 {initial.length} 位 · 管理赞助墙展示。可填 GitHub
            用户名一键获取名称与头像，或手动填写并上传头像。金牌赞助靠前并高亮。
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
          className="border-border bg-bg2/50 mb-6 rounded-lg border p-4"
        >
          {/* GitHub lookup */}
          <div className="border-border mb-4 border-b pb-4">
            <label className={labelCls} htmlFor="sp-gh">
              GitHub 用户名（可选，一键获取名称 + 头像）
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="sp-gh"
                type="text"
                value={form.githubLogin}
                onChange={(e) =>
                  setForm({ ...form, githubLogin: e.target.value })
                }
                placeholder="例如 mkdir700"
                maxLength={100}
                className="border-border bg-background text-foreground w-full rounded border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={lookupGithub}
                disabled={ghLoading || !form.githubLogin.trim()}
                className="border-border hover:bg-bg2 inline-flex flex-none items-center rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                {ghLoading ? "获取中..." : "抓取"}
              </button>
            </div>
            {ghStatus && (
              <p className="text-muted-foreground mt-1.5 text-xs">{ghStatus}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="sp-name">
                名称
              </label>
              <input
                id="sp-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={120}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="sp-tier">
                等级
              </label>
              <select
                id="sp-tier"
                value={form.tier}
                onChange={(e) =>
                  setForm({ ...form, tier: e.target.value as Tier })
                }
                className={inputCls}
              >
                <option value="regular">{TIER_LABELS.regular}</option>
                <option value="gold">{TIER_LABELS.gold}</option>
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="sp-url">
                链接（主页 / 资料页，可选）
              </label>
              <input
                id="sp-url"
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://"
                maxLength={1000}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="sp-since">
                赞助起始月份（可选）
              </label>
              <input
                id="sp-since"
                type="month"
                value={form.since}
                onChange={(e) => setForm({ ...form, since: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="sp-order">
                排序（数字越小越靠前）
              </label>
              <input
                id="sp-order"
                type="number"
                value={form.displayOrder}
                onChange={(e) =>
                  setForm({ ...form, displayOrder: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="sp-amount">
                赞助金额（元，可选，仅后台可见）
              </label>
              <input
                id="sp-amount"
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="例如 18.88"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="sp-note">
                一句话致谢（可选，公开展示）
              </label>
              <input
                id="sp-note"
                type="text"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                maxLength={500}
                className={inputCls}
              />
            </div>

            {/* Avatar */}
            <div className="sm:col-span-2">
              <span className={labelCls}>头像</span>
              <div className="mt-2 flex items-start gap-4">
                <Thumb src={previewSrc} name={form.name} size={56} />
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickFile(e.target.files?.[0])}
                    className="text-muted-foreground file:bg-foreground file:text-background block w-full text-xs file:mr-3 file:rounded file:border-0 file:px-3 file:py-1.5 file:text-xs file:font-medium"
                  />
                  <input
                    type="url"
                    value={form.avatarUrl}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        avatarUrl: e.target.value,
                        avatarUpload: null,
                        clearAvatar: false,
                      })
                    }
                    placeholder="或粘贴头像图片 URL"
                    maxLength={1000}
                    className="border-border bg-background text-foreground w-full rounded border px-3 py-1.5 text-xs"
                  />
                  {previewSrc && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="text-xs text-red-500 hover:text-red-400"
                    >
                      移除头像
                    </button>
                  )}
                  <p className="text-muted-foreground text-xs">
                    上传图片会自动压缩为 160×160 webp
                    存入数据库；留空则在墙上显示首字母占位。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="submit"
              disabled={pending || !form.name.trim()}
              className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              {pending ? "保存中..." : editingId ? "保存修改" : "新增赞助商"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm"
            >
              取消
            </button>
            {editingId && (
              <span className="text-muted-foreground ml-auto text-xs">
                当前头像来源：{avatarSource}
              </span>
            )}
          </div>
        </form>
      )}

      {initial.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-lg border p-12 text-center text-sm">
          还没有赞助商。点击「新增」添加第一位。
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-border bg-bg2 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">顺序</th>
                <th className="px-4 py-3 font-medium">头像</th>
                <th className="px-4 py-3 font-medium">名称</th>
                <th className="px-4 py-3 font-medium">等级</th>
                <th className="px-4 py-3 font-medium">金额</th>
                <th className="px-4 py-3 font-medium">起始</th>
                <th className="px-4 py-3 font-medium">链接</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {initial.map((row, idx) => (
                <tr
                  key={row.id}
                  className="border-border border-b align-middle last:border-b-0"
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
                  <td className="px-4 py-3">
                    <Thumb src={row.avatar} name={row.name} />
                  </td>
                  <td className="text-foreground px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span>{row.name}</span>
                      {row.note && (
                        <span className="text-muted-foreground text-xs font-normal">
                          {row.note}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {row.tier === "gold" ? (
                      <span className="rounded-full border border-amber-400/40 bg-amber-300/10 px-2 py-0.5 text-amber-600 dark:text-amber-300">
                        金牌
                      </span>
                    ) : (
                      <span className="text-muted-foreground">普通</span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 font-mono text-xs whitespace-nowrap">
                    {formatAmount(row.amountCents)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs">
                    {row.since || "—"}
                  </td>
                  <td className="text-muted-foreground max-w-[12rem] truncate px-4 py-3 text-xs">
                    {row.url ? (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground underline"
                      >
                        {row.url.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "—"
                    )}
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

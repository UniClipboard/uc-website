"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

import { monogramFor } from "@/lib/sponsors";

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

function AvatarPreview({
  src,
  name,
  size = 64,
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
      className="flex flex-none items-center justify-center rounded-full text-lg font-semibold"
      style={{ width: size, height: size, background: m.bg, color: m.fg }}
    >
      {m.initials}
    </span>
  );
}

export function SponsorClaimForm({ token }: { token: string }) {
  const t = useTranslations("sponsorClaim");

  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [githubLogin, setGithubLogin] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUpload, setAvatarUpload] = useState<string | null>(null);

  const [ghStatus, setGhStatus] = useState<string | null>(null);
  const [ghLoading, setGhLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const previewSrc =
    avatarUpload || (avatarUrl.trim() ? avatarUrl.trim() : null);

  const resetFile = () => {
    if (fileRef.current) fileRef.current.value = "";
  };

  const lookupGithub = async () => {
    const login = githubLogin.trim();
    if (!login) {
      setGhStatus(t("githubEmpty"));
      return;
    }
    setGhLoading(true);
    setGhStatus(null);
    try {
      const res = await fetch(
        `/api/sponsor-invite/${encodeURIComponent(token)}/github-lookup?login=${encodeURIComponent(login)}`,
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGhStatus(body?.error ?? `Lookup failed: ${res.status}`);
        return;
      }
      setGithubLogin(body.login ?? login);
      setName((n) => n.trim() || body.name || body.login || login);
      setUrl((u) => u.trim() || body.htmlUrl || "");
      setAvatarUrl(body.avatarUrl ?? "");
      setAvatarUpload(null);
      resetFile();
      setGhStatus(t("githubFound", { name: body.name || body.login }));
    } catch (e) {
      setGhStatus(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setGhLoading(false);
    }
  };

  const onPickFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(t("avatarTooLarge"));
      resetFile();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUpload(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarUpload(null);
    setAvatarUrl("");
    resetFile();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t("errorRequired"));
      return;
    }

    const payload: Record<string, unknown> = {
      name: trimmedName,
      url: url.trim() || null,
      note: note.trim() || null,
      githubLogin: githubLogin.trim() || null,
    };
    if (avatarUpload) {
      payload.avatarUpload = avatarUpload;
    } else if (avatarUrl.trim()) {
      payload.avatarUrl = avatarUrl.trim();
    }

    startTransition(async () => {
      const res = await fetch(
        `/api/sponsor-invite/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? t("errorGeneric"));
        return;
      }
      setDone(true);
    });
  };

  const inputCls =
    "border-border bg-background text-foreground mt-1 w-full rounded-lg border px-3 py-2 text-sm";
  const labelCls = "text-foreground text-xs font-medium";

  if (done) {
    return (
      <div className="border-border bg-bg2/40 rounded-2xl border p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-2xl text-emerald-500">
          ✓
        </div>
        <h1 className="mt-4 text-xl font-semibold">{t("successTitle")}</h1>
        <p className="text-muted-foreground mt-3 text-sm">{t("successBody")}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="border-border bg-bg2/40 rounded-2xl border p-6 sm:p-8"
    >
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground mt-2 text-sm">{t("subtitle")}</p>

      {/* GitHub lookup */}
      <div className="border-border mt-6 border-b pb-5">
        <label className={labelCls} htmlFor="cl-gh">
          {t("githubLabel")}
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="cl-gh"
            type="text"
            value={githubLogin}
            onChange={(e) => setGithubLogin(e.target.value)}
            placeholder="e.g. mkdir700"
            maxLength={100}
            className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={lookupGithub}
            disabled={ghLoading || !githubLogin.trim()}
            className="border-border hover:bg-bg2 inline-flex flex-none items-center rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {ghLoading ? t("githubFetching") : t("githubButton")}
          </button>
        </div>
        <p className="text-muted-foreground mt-1.5 text-xs">
          {t("githubHint")}
        </p>
        {ghStatus && (
          <p className="text-muted-foreground mt-1 text-xs">{ghStatus}</p>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {/* Avatar */}
        <div>
          <span className={labelCls}>{t("avatarLabel")}</span>
          <div className="mt-2 flex items-start gap-4">
            <AvatarPreview src={previewSrc} name={name} size={64} />
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
                value={avatarUrl}
                onChange={(e) => {
                  setAvatarUrl(e.target.value);
                  setAvatarUpload(null);
                }}
                placeholder={t("avatarUrlPlaceholder")}
                maxLength={1000}
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-1.5 text-xs"
              />
              {previewSrc && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="text-xs text-red-500 hover:text-red-400"
                >
                  {t("avatarRemove")}
                </button>
              )}
              <p className="text-muted-foreground text-xs">{t("avatarHint")}</p>
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className={labelCls} htmlFor="cl-name">
            {t("nameLabel")}
          </label>
          <input
            id="cl-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            maxLength={120}
            required
            className={inputCls}
          />
        </div>

        {/* Note */}
        <div>
          <label className={labelCls} htmlFor="cl-note">
            {t("noteLabel")}
          </label>
          <input
            id="cl-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("notePlaceholder")}
            maxLength={500}
            className={inputCls}
          />
        </div>

        {/* URL */}
        <div>
          <label className={labelCls} htmlFor="cl-url">
            {t("urlLabel")}
          </label>
          <input
            id="cl-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            maxLength={1000}
            className={inputCls}
          />
        </div>
      </div>

      {error && <p className="mt-4 text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="bg-foreground text-background hover:bg-foreground/90 mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

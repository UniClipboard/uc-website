"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type TokenRow = {
  id: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

type IssuedToken = {
  id: string;
  label: string;
  plaintext: string;
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toISOString().slice(0, 16).replace("T", " ") : "—";

export function ApiTokensManager({ initial }: { initial: TokenRow[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<IssuedToken | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/tokens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? `Request failed: ${res.status}`);
        return;
      }
      const data = (await res.json()) as IssuedToken;
      setIssued(data);
      setLabel("");
      setCreating(false);
      router.refresh();
    });
  };

  const handleRevoke = (id: string) => {
    if (!confirm("Revoke this token? Apps using it will stop working.")) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/tokens/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert(`Revoke failed: ${await res.text()}`);
        return;
      }
      router.refresh();
    });
  };

  const copyPlaintext = async () => {
    if (!issued) return;
    await navigator.clipboard.writeText(issued.plaintext);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">API Tokens</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {initial.filter((t) => !t.revokedAt).length} active ·{" "}
            {initial.filter((t) => t.revokedAt).length} revoked · used by agents
            to publish blog posts via{" "}
            <code className="font-mono text-xs">/api/v1/articles</code>
          </p>
        </div>
        {!creating && !issued && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium"
          >
            New token
          </button>
        )}
      </div>

      {issued && (
        <div className="border-border bg-bg2/50 mb-6 rounded-lg border p-4">
          <p className="text-foreground text-sm font-medium">
            Token created — copy it now. You won&apos;t see the plaintext value
            again.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="border-border bg-background flex-1 rounded border px-3 py-2 font-mono text-xs break-all">
              {issued.plaintext}
            </code>
            <button
              type="button"
              onClick={copyPlaintext}
              className="border-border hover:bg-foreground/5 rounded border px-3 py-2 text-xs font-medium"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIssued(null)}
            className="text-muted-foreground hover:text-foreground mt-3 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {creating && (
        <form
          onSubmit={handleCreate}
          className="border-border bg-bg2/50 mb-6 rounded-lg border p-4"
        >
          <label
            className="text-foreground text-sm font-medium"
            htmlFor="token-label"
          >
            Label
          </label>
          <p className="text-muted-foreground mt-1 text-xs">
            A name to remember which agent or environment this token is for
            (e.g. &quot;claude-blog-publisher&quot;).
          </p>
          <input
            id="token-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="claude-blog-publisher"
            maxLength={80}
            required
            className="border-border bg-background text-foreground mt-2 w-full max-w-md rounded border px-3 py-2 text-sm"
          />
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={pending || !label.trim()}
              className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              {pending ? "Creating..." : "Create token"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setLabel("");
                setError(null);
              }}
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {initial.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-lg border p-12 text-center text-sm">
          No tokens yet. Create one to let an agent publish via the API.
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-border bg-bg2 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Label</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Last used</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {initial.map((token) => (
                <tr
                  key={token.id}
                  className="border-border border-b last:border-b-0"
                >
                  <td className="text-foreground px-4 py-3 font-medium">
                    {token.label}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        token.revokedAt
                          ? "bg-red-500/15 text-red-700 dark:text-red-400"
                          : "bg-green-500/15 text-green-700 dark:text-green-400"
                      }`}
                    >
                      {token.revokedAt ? "revoked" : "active"}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs">
                    {formatDate(token.createdAt)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs">
                    {formatDate(token.lastUsedAt)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {!token.revokedAt && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(token.id)}
                        disabled={pending}
                        className="text-red-500 hover:text-red-400 disabled:opacity-50"
                      >
                        Revoke
                      </button>
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

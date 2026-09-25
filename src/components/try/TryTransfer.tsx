"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { localePathPrefix } from "@/i18n/locale-meta";
import {
  buildLink,
  type ConnectionTicket,
  newToken,
  parseFragment,
  takeFragment,
} from "@/lib/web-transfer/link";
import {
  type DraftItem,
  preparePayload,
  type TransferItem,
} from "@/lib/web-transfer/payload";
import {
  pull,
  push,
  SendSession,
  TransferError,
  type TransferErrorCode,
} from "@/lib/web-transfer/protocol";
import {
  CodeError,
  consumeCode,
  createCode,
  type IssuedCode,
  normalizeCode,
  resolveCode,
  SHORT_CODE_ENABLED,
} from "@/lib/web-transfer/short-code";
import { loadTailcat, TailcatLoadError } from "@/lib/web-transfer/tailcat";

import { ComposeCard } from "./ComposeCard";
import { formatBytes, Heading, ProgressBar, ProgressRing } from "./parts";
import { QrCode } from "./QrCode";
import {
  type CopyStatus,
  copyToClipboard,
  ReceivedContent,
} from "./ReceivedContent";
import {
  CodeEntry,
  type CodeSlot,
  type EntryError,
  SenderCode,
} from "./ShortCode";

type ErrorCode =
  | TransferErrorCode
  | "connect-failed"
  | "invalid-link"
  | "listen-failed"
  | "load-failed"
  | "unsupported";

type Progress = { done: number; total: number };

type View =
  | { name: "compose"; mode: "send" | "reply" }
  | { name: "preparing"; load: number | null; relay: boolean }
  | { name: "ready"; link: string }
  | ({ name: "sending"; reply: boolean; summary: string } & Progress)
  | {
      name: "delivered";
      reply?: TransferItem[];
      replyProgress?: Progress;
      replyFailed?: boolean;
      copy: CopyStatus;
    }
  | { name: "connecting"; load: number | null }
  | ({ name: "receiving" } & Progress)
  | { name: "received"; items: TransferItem[]; copy: CopyStatus }
  | { name: "reply-delivered" }
  | { name: "error"; code: ErrorCode; retry: "receive" | null };

const AUTO_COPY_KEY = "uc-try-auto-copy";

// How long the tunnel stays up after the final frame of a session: an ACK
// is small; a CANCEL may sit behind the sender's TCP backlog.
const ACK_FLUSH_MS = 2_000;
const CANCEL_FLUSH_MS = 11_000;

const readAutoCopy = () => {
  try {
    return localStorage.getItem(AUTO_COPY_KEY) !== "off";
  } catch {
    return true;
  }
};

const errorCode = (err: unknown, fallback: ErrorCode): ErrorCode => {
  if (err instanceof TransferError) return err.code;
  if (err instanceof TailcatLoadError) {
    return err.reason === "unsupported" ? "unsupported" : "load-failed";
  }
  return fallback;
};

export function TryTransfer({ linkPath = "/try" }: { linkPath?: string }) {
  const t = useTranslations("try");
  const locale = useLocale();
  const [view, setView] = useState<View>({ name: "compose", mode: "send" });
  const [composeKey, setComposeKey] = useState(0);
  const [autoCopy, setAutoCopyState] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  // Phones start on the code field; this switches them to the compose card.
  const [sendFirst, setSendFirst] = useState(false);
  const [codeSlot, setCodeSlot] = useState<CodeSlot | null>(null);

  // Everything tied to the current attempt. `run` increments on every
  // teardown so late callbacks from an abandoned attempt are ignored.
  const run = useRef(0);
  const session = useRef<SendSession | null>(null);
  const listener = useRef<{ close(): void } | null>(null);
  const cancelActive = useRef<(() => Promise<void>) | null>(null);
  const ticket = useRef<ConnectionTicket | null>(null);
  // The code the receiver typed for `ticket`, used up after delivery.
  const ticketCode = useRef<string | null>(null);
  // The sender's own ticket and the code currently registered for it.
  const sendTicket = useRef<ConnectionTicket | null>(null);
  const issuedCode = useRef<IssuedCode | null>(null);
  const codeRequest = useRef<AbortController | null>(null);
  const autoCopyRef = useRef(true);
  const pendingFragment = useRef<string | null | undefined>(undefined);

  const setAutoCopy = (on: boolean) => {
    autoCopyRef.current = on;
    setAutoCopyState(on);
    try {
      localStorage.setItem(AUTO_COPY_KEY, on ? "on" : "off");
    } catch {
      // Private mode: the choice lasts for this page only.
    }
  };

  // Stops showing and renewing the sender's code. Using the live code up
  // means nobody can look it up after the page moved on.
  const stopCode = useCallback(() => {
    codeRequest.current?.abort();
    codeRequest.current = null;
    const issued = issuedCode.current;
    issuedCode.current = null;
    if (issued && Date.now() < issued.expiresAtMs) {
      void consumeCode(issued.code);
    }
    setCodeSlot(null);
  }, []);

  // Registers a fresh code for the sender's ticket; every call gets a new one.
  const registerCode = useCallback(async () => {
    const target = sendTicket.current;
    if (!target) return;
    codeRequest.current?.abort();
    const request = new AbortController();
    codeRequest.current = request;
    issuedCode.current = null;
    setCodeSlot({ status: "loading" });
    try {
      const issued = await createCode(target, request.signal);
      if (request.signal.aborted) return;
      issuedCode.current = issued;
      setCodeSlot({ status: "ready", ...issued, issuedAtMs: Date.now() });
    } catch {
      if (!request.signal.aborted) setCodeSlot({ status: "unavailable" });
    }
  }, []);

  const teardown = useCallback(() => {
    run.current++;
    stopCode();
    sendTicket.current = null;
    // Close the listener only after the peer has been sent CANCEL: closing
    // it first tears down the tunnel and the peer just times out.
    const ln = listener.current;
    void (session.current?.cancel() ?? Promise.resolve()).finally(() =>
      ln?.close(),
    );
    session.current = null;
    listener.current = null;
    void cancelActive.current?.();
    cancelActive.current = null;
  }, [stopCode]);

  // Closing the listener tears down the tunnel, so wait for the last frame
  // (ACK or CANCEL, which can queue behind a backlog) to leave first.
  const closeListenerAfter = (ms: number) => {
    const ln = listener.current;
    listener.current = null;
    setTimeout(() => ln?.close(), ms);
  };

  const startOver = useCallback(() => {
    teardown();
    ticket.current = null;
    ticketCode.current = null;
    setLinkCopied(false);
    setComposeKey((k) => k + 1);
    setView({ name: "compose", mode: "send" });
  }, [teardown]);

  const summarize = useCallback(
    (drafts: DraftItem[]) => {
      const images = drafts.filter((d) => d.kind === "image").length;
      const files = drafts.filter((d) => d.kind === "file").length;
      const parts = [
        ...(drafts.some((d) => d.kind === "text") ? [t("summary.text")] : []),
        ...(images ? [t("summary.images", { count: images })] : []),
        ...(files ? [t("summary.files", { count: files })] : []),
      ];
      return new Intl.ListFormat(locale, { type: "conjunction" }).format(parts);
    },
    [locale, t],
  );

  // ---------- Receiving (opened from a link) ----------

  const receive = useCallback(
    async (target: ConnectionTicket, code: string | null = null) => {
      teardown();
      const id = run.current;
      const live = () => run.current === id;
      ticket.current = target;
      ticketCode.current = code;
      setView({ name: "connecting", load: null });

      let stream;
      try {
        const tailcat = await loadTailcat((load) => {
          if (live()) {
            setView((v) => (v.name === "connecting" ? { ...v, load } : v));
          }
        });
        if (!live()) return;
        setView({ name: "connecting", load: 1 });
        stream = await tailcat.dial(target.addr);
      } catch (err) {
        if (live()) {
          const code = errorCode(err, "connect-failed");
          const retry =
            code === "connect-failed" || code === "load-failed"
              ? "receive"
              : null;
          setView({ name: "error", code, retry });
        }
        return;
      }
      if (!live()) {
        stream.close();
        return;
      }

      let offered = false;
      const handle = pull(stream, target.token, {
        onOffer: (offer) => {
          offered = true;
          if (live()) {
            setView({ name: "receiving", done: 0, total: offer.total });
          }
        },
        onProgress: (done, total) =>
          live() && setView({ name: "receiving", done, total }),
      });
      cancelActive.current = handle.cancel;
      try {
        const items = await handle.result;
        // Delivered and acknowledged: the code has done its job.
        if (code) void consumeCode(code);
        if (!live()) return;
        cancelActive.current = null;
        setView({ name: "received", items, copy: "idle" });
        if (autoCopyRef.current) {
          const result = await copyToClipboard(items);
          if (live() && result !== "nothing") {
            setView((v) =>
              v.name === "received" ? { ...v, copy: result } : v,
            );
          }
        }
      } catch (err) {
        if (!live()) return;
        cancelActive.current = null;
        // Once content starts flowing the sender has spent the link, so only
        // a failure before the offer can be retried.
        const code = errorCode(err, "protocol");
        const retry = !offered && code !== "busy" ? "receive" : null;
        setView({ name: "error", code, retry });
      }
    },
    [teardown],
  );

  const openFragment = useCallback(
    (fragment: string) => {
      const parsed = parseFragment(fragment);
      if (parsed) void receive(parsed);
      else {
        teardown();
        setView({ name: "error", code: "invalid-link", retry: null });
      }
    },
    [receive, teardown],
  );

  // Looks the code up without loading the wasm; only a valid web ticket
  // goes on to connect.
  const receiveCode = useCallback(
    async (input: string): Promise<EntryError | null> => {
      const code = normalizeCode(input);
      if (!code) return "incomplete";
      // A send or an opened link may start while the lookup is in flight;
      // a late result must not tear that down.
      const id = run.current;
      let target;
      try {
        target = await resolveCode(code);
      } catch (err) {
        if (run.current !== id) return null;
        return err instanceof CodeError ? err.reason : "unavailable";
      }
      if (run.current !== id) return null;
      void receive(target, code);
      return null;
    },
    [receive],
  );

  useEffect(() => {
    autoCopyRef.current = readAutoCopy();
    setAutoCopyState(autoCopyRef.current);
    setCanShare(
      typeof navigator.share === "function" &&
        window.matchMedia("(pointer: coarse)").matches,
    );

    // Taking the fragment consumes it, so remember it across effect replays
    // (React strict mode runs this effect, its cleanup, then this again).
    if (pendingFragment.current === undefined) {
      pendingFragment.current = takeFragment();
    }
    document.documentElement.removeAttribute("data-try-incoming");
    if (pendingFragment.current) openFragment(pendingFragment.current);

    // A link pasted into this tab's address bar only changes the hash.
    const onHash = () => {
      const next = takeFragment();
      if (next) openFragment(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      teardown();
    };
  }, [openFragment, teardown]);

  // ---------- Sending ----------

  const send = async (drafts: DraftItem[]) => {
    teardown();
    const id = run.current;
    const live = () => run.current === id;
    const summary = summarize(drafts);
    setView({ name: "preparing", load: null, relay: false });

    try {
      const [payload, tailcat] = await Promise.all([
        preparePayload(drafts),
        loadTailcat((load) => {
          if (live()) {
            setView((v) => (v.name === "preparing" ? { ...v, load } : v));
          }
        }),
      ]);
      if (!live()) return;
      setView({ name: "preparing", load: 1, relay: true });

      const token = newToken();
      const s = new SendSession(payload, token, {
        onSendStart: (total) => {
          if (!live()) return;
          stopCode();
          setView({ name: "sending", reply: false, summary, done: 0, total });
        },
        onSendProgress: (done, total) =>
          live() &&
          setView({ name: "sending", reply: false, summary, done, total }),
        onDelivered: () =>
          live() && setView({ name: "delivered", copy: "idle" }),
        onReplyStart: (offer) =>
          live() &&
          setView({
            name: "delivered",
            copy: "idle",
            replyProgress: { done: 0, total: offer.total },
          }),
        onReplyProgress: (done, total) =>
          live() &&
          setView({
            name: "delivered",
            copy: "idle",
            replyProgress: { done, total },
          }),
        onReply: async (items) => {
          if (!live()) return;
          closeListenerAfter(ACK_FLUSH_MS);
          setView({ name: "delivered", reply: items, copy: "idle" });
          if (autoCopyRef.current) {
            const result = await copyToClipboard(items);
            if (live() && result !== "nothing") {
              setView((v) =>
                v.name === "delivered" ? { ...v, copy: result } : v,
              );
            }
          }
        },
        onFailed: (err, phase) => {
          if (!live()) return;
          closeListenerAfter(CANCEL_FLUSH_MS);
          if (phase === "reply") {
            setView({ name: "delivered", replyFailed: true, copy: "idle" });
          } else {
            setView({ name: "error", code: err.code, retry: null });
          }
        },
      });
      session.current = s;

      let ln;
      try {
        ln = await tailcat.listen((stream) => s.handleConnection(stream));
      } catch {
        if (live())
          setView({ name: "error", code: "listen-failed", retry: null });
        return;
      }
      if (!live()) {
        ln.close();
        return;
      }
      listener.current = ln;
      const own = { addr: ln.addr, token };
      const link = buildLink(
        window.location.origin,
        localePathPrefix(locale),
        own,
        linkPath,
      );
      setLinkCopied(false);
      setView({ name: "ready", link });
      if (SHORT_CODE_ENABLED) {
        sendTicket.current = own;
        void registerCode();
      }
    } catch (err) {
      if (live()) {
        setView({
          name: "error",
          code: errorCode(err, "load-failed"),
          retry: null,
        });
      }
    }
  };

  const sendReply = async (drafts: DraftItem[]) => {
    const target = ticket.current;
    if (!target) return startOver();
    teardown();
    const id = run.current;
    const live = () => run.current === id;
    const summary = summarize(drafts);
    setView({ name: "sending", reply: true, summary, done: 0, total: 0 });
    try {
      const [payload, tailcat] = await Promise.all([
        preparePayload(drafts),
        loadTailcat(),
      ]);
      let stream;
      try {
        stream = await tailcat.dial(target.addr);
      } catch {
        if (live()) {
          setView({ name: "error", code: "connect-failed", retry: null });
        }
        return;
      }
      if (!live()) {
        stream.close();
        return;
      }
      const handle = push(stream, target.token, payload, (done, total) => {
        if (live())
          setView({ name: "sending", reply: true, summary, done, total });
      });
      cancelActive.current = handle.cancel;
      await handle.result;
      cancelActive.current = null;
      if (live()) setView({ name: "reply-delivered" });
    } catch (err) {
      if (!live()) return;
      cancelActive.current = null;
      setView({ name: "error", code: errorCode(err, "protocol"), retry: null });
    }
  };

  // Warn before closing the tab mid-transfer.
  const busy =
    view.name === "sending" ||
    view.name === "receiving" ||
    (view.name === "delivered" && !!view.replyProgress);
  useEffect(() => {
    if (!busy) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [busy]);

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
    } catch {
      setLinkCopied(false);
    }
  };

  const shareLink = async (link: string) => {
    try {
      await navigator.share({ url: link });
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") void copyLink(link);
    }
  };

  const autoCopyToggle = (
    <label className="try-toggle">
      <input
        type="checkbox"
        checked={autoCopy}
        onChange={(e) => setAutoCopy(e.target.checked)}
      />
      {t("compose.autoCopy")}
    </label>
  );

  const cancelButton = (label: string) => (
    <button type="button" className="try-quiet" onClick={startOver}>
      {label}
    </button>
  );

  // ---------- Views ----------

  switch (view.name) {
    case "compose": {
      const withCode = SHORT_CODE_ENABLED && view.mode === "send";
      const codeStart = withCode && !sendFirst;
      return (
        <>
          {codeStart && (
            <div
              className="try-column try-code-start"
              data-try-view="code-start"
            >
              <Heading text={t("code.startTitle")} />
              <CodeEntry variant="start" onReceive={receiveCode} />
              {autoCopyToggle}
              <button
                type="button"
                className="try-quiet try-code-start-alt"
                onClick={() => setSendFirst(true)}
              >
                {t("code.sendInstead")}
              </button>
            </div>
          )}
          <div
            className="try-column"
            data-try-view="compose"
            data-code-start={codeStart ? "" : undefined}
          >
            <Heading
              text={
                view.mode === "reply"
                  ? t("compose.replyTitle")
                  : t("compose.title")
              }
            />
            <ComposeCard
              key={composeKey}
              mode={view.mode}
              onSubmit={view.mode === "reply" ? sendReply : send}
              onBack={
                view.mode === "reply"
                  ? () => setView({ name: "compose", mode: "send" })
                  : undefined
              }
            />
            {withCode && <CodeEntry variant="row" onReceive={receiveCode} />}
            {autoCopyToggle}
          </div>
          <div
            className="try-column try-incoming-placeholder"
            role="status"
            aria-hidden
          >
            <div className="try-center">
              <ProgressRing fraction={null} />
              <span className="try-center-title">
                {t("receiving.connecting")}
              </span>
            </div>
          </div>
        </>
      );
    }

    case "preparing":
      return (
        <div className="try-column" role="status">
          <Heading text={t("preparing.title")} />
          <div
            className="try-card try-card--pad"
            style={{ display: "grid", gap: 14 }}
          >
            <span className="try-label">
              {view.relay
                ? t("preparing.relay")
                : view.load === null
                  ? t("preparing.loadingUnknown")
                  : t("preparing.loading", {
                      percent: Math.round(view.load * 100),
                    })}
            </span>
            <ProgressBar fraction={view.relay ? null : view.load} />
          </div>
          <div className="try-row" style={{ justifyContent: "flex-end" }}>
            {cancelButton(t("ready.cancel"))}
          </div>
        </div>
      );

    case "ready":
      return (
        <div className="try-column">
          <Heading text={t("ready.title")} />
          <div className="try-card try-card--pad try-share">
            <QrCode value={view.link} label={t("ready.qrLabel")} />
            <div className="try-share-side">
              {codeSlot ? (
                <SenderCode
                  slot={codeSlot}
                  onExpired={registerCode}
                  onRetry={registerCode}
                />
              ) : (
                <span
                  className="try-label"
                  style={{ fontSize: 15, lineHeight: 1.5 }}
                >
                  {t("ready.scan")}
                </span>
              )}
              {canShare ? (
                <button
                  type="button"
                  className="try-btn"
                  onClick={() => void shareLink(view.link)}
                >
                  <Share2 size={16} aria-hidden />
                  {t("ready.shareLink")}
                </button>
              ) : null}
              <button
                type="button"
                className="try-btn try-btn--ghost"
                onClick={() => void copyLink(view.link)}
                data-testid="try-copy-link"
                data-link={view.link}
              >
                {linkCopied ? (
                  <Check size={14} aria-hidden />
                ) : (
                  <Copy size={14} aria-hidden />
                )}
                {linkCopied ? t("ready.linkCopied") : t("ready.copyLink")}
              </button>
            </div>
          </div>
          <p className="try-note">
            {codeSlot?.status === "ready"
              ? t("code.noteReady")
              : codeSlot?.status === "loading"
                ? t("code.noteRefreshing")
                : codeSlot?.status === "unavailable"
                  ? t("code.noteUnavailable")
                  : t("ready.note")}
          </p>
          <div className="try-row">
            <div className="try-status" role="status">
              <span className="try-dot" aria-hidden />
              {t("ready.waiting")}
            </div>
            {cancelButton(t("ready.cancel"))}
          </div>
        </div>
      );

    case "sending": {
      const fraction = view.total ? view.done / view.total : null;
      return (
        <div className="try-column">
          <Heading
            text={view.reply ? t("sending.replyTitle") : t("sending.title")}
          />
          <div
            className="try-card try-card--pad"
            role="status"
            style={{ display: "grid", gap: 14 }}
          >
            <div className="try-row" style={{ fontSize: 15 }}>
              <span>{view.summary}</span>
              {view.total > 0 && (
                <span
                  className="try-mono"
                  style={{ color: "var(--try-body)", fontSize: 14 }}
                >
                  {t("receiving.progress", {
                    done: formatBytes(view.done),
                    total: formatBytes(view.total),
                  })}
                </span>
              )}
            </div>
            <ProgressBar fraction={fraction} />
          </div>
          <p className="try-note">
            {SHORT_CODE_ENABLED && !view.reply
              ? t("code.sendingNote")
              : t("sending.note")}
          </p>
          <div className="try-row" style={{ justifyContent: "flex-end" }}>
            {cancelButton(t("sending.cancel"))}
          </div>
        </div>
      );
    }

    case "delivered":
      return (
        <div className="try-column" data-testid="try-delivered">
          <Heading text={t("delivered.title")} done />
          {view.reply ? (
            <>
              <span className="try-label">{t("delivered.replyFrom")}</span>
              <ReceivedContent
                items={view.reply}
                copyStatus={view.copy}
                onCopied={(copy) =>
                  setView((v) => (v.name === "delivered" ? { ...v, copy } : v))
                }
                secondary={
                  <button
                    type="button"
                    className="try-quiet"
                    onClick={startOver}
                  >
                    {t("delivered.sendNew")}
                  </button>
                }
              />
            </>
          ) : (
            <>
              {view.replyProgress ? (
                <div role="status" style={{ display: "grid", gap: 10 }}>
                  <span className="try-label">
                    {t("delivered.replyIncoming", {
                      done: formatBytes(view.replyProgress.done),
                      total: formatBytes(view.replyProgress.total),
                    })}
                  </span>
                  <ProgressBar
                    fraction={
                      view.replyProgress.total
                        ? view.replyProgress.done / view.replyProgress.total
                        : null
                    }
                  />
                </div>
              ) : (
                <p className="try-note">
                  {view.replyFailed
                    ? t("delivered.replyFailed")
                    : t("delivered.replyHint")}
                </p>
              )}
              <div className="try-row" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="try-btn" onClick={startOver}>
                  {t("delivered.sendNew")}
                </button>
              </div>
            </>
          )}
        </div>
      );

    case "connecting":
      return (
        <div className="try-column">
          <div className="try-center" role="status">
            <ProgressRing fraction={null} />
            <div style={{ display: "grid", gap: 8 }}>
              <span className="try-center-title">
                {t("receiving.connecting")}
              </span>
              <span className="try-label" style={{ fontSize: 15 }}>
                {view.load !== null && view.load < 1
                  ? t("preparing.loading", {
                      percent: Math.round(view.load * 100),
                    })
                  : t("receiving.connectingHint")}
              </span>
            </div>
            {cancelButton(t("receiving.cancel"))}
          </div>
        </div>
      );

    case "receiving": {
      const fraction = view.total ? view.done / view.total : 1;
      return (
        <div className="try-column">
          <div className="try-center" role="status">
            <ProgressRing fraction={fraction} />
            <div style={{ display: "grid", gap: 8 }}>
              <span className="try-center-title">{t("receiving.title")}</span>
              <span className="try-label try-mono" style={{ fontSize: 15 }}>
                {t("receiving.progress", {
                  done: formatBytes(view.done),
                  total: formatBytes(view.total),
                })}
              </span>
            </div>
            {cancelButton(t("receiving.cancel"))}
          </div>
        </div>
      );
    }

    case "received":
      return (
        <div className="try-column" data-testid="try-received">
          <Heading text={t("received.title")} done />
          <ReceivedContent
            items={view.items}
            copyStatus={view.copy}
            onCopied={(copy) =>
              setView((v) => (v.name === "received" ? { ...v, copy } : v))
            }
            secondary={
              <button
                type="button"
                className="try-quiet"
                onClick={() => {
                  setComposeKey((k) => k + 1);
                  setView({ name: "compose", mode: "reply" });
                }}
              >
                {t("received.reply")}
              </button>
            }
          />
        </div>
      );

    case "reply-delivered":
      return (
        <div className="try-column" data-testid="try-reply-delivered">
          <Heading text={t("delivered.replyDeliveredTitle")} done />
          <div className="try-row" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="try-btn" onClick={startOver}>
              {t("delivered.sendNew")}
            </button>
          </div>
        </div>
      );

    case "error":
      return (
        <div
          className="try-column"
          data-testid="try-error"
          data-code={view.code}
        >
          <Heading text={t("errors.title")} />
          <p className="try-error-text" role="alert" style={{ fontSize: 16 }}>
            {t(`errors.${view.code}`)}
          </p>
          <div className="try-actions">
            <button type="button" className="try-quiet" onClick={startOver}>
              {t("errors.startOver")}
            </button>
            {view.retry === "receive" && ticket.current && (
              <button
                type="button"
                className="try-btn"
                onClick={() =>
                  ticket.current &&
                  void receive(ticket.current, ticketCode.current)
                }
              >
                {t("errors.tryAgain")}
              </button>
            )}
          </div>
        </div>
      );
  }
}

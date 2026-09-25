"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";

import { cn } from "@/lib/utils";
import {
  type CodeErrorReason,
  displayCode,
} from "@/lib/web-transfer/short-code";

export type EntryError = CodeErrorReason | "incomplete";

/** What the sender's code slot shows. */
export type CodeSlot =
  | { status: "loading" }
  | { status: "ready"; code: string; issuedAtMs: number; expiresAtMs: number }
  | { status: "unavailable" };

/** Keeps digits only and groups them as `NNN NNN` while typing. */
const formatInput = (value: string) => {
  const digits = value.normalize("NFKC").replace(/\D/g, "").slice(0, 6);
  return digits.length > 3
    ? `${digits.slice(0, 3)} ${digits.slice(3)}`
    : digits;
};

/**
 * The receiver's code field: a row under the compose card on wide screens,
 * or the start screen on phones. `onReceive` resolves to an error to show,
 * or null once the page has moved on to connecting.
 */
export function CodeEntry({
  variant,
  onReceive,
}: {
  variant: "row" | "start";
  onReceive(code: string): Promise<EntryError | null>;
}) {
  const t = useTranslations("try.code");
  const [value, setValue] = useState("");
  const [error, setError] = useState<EntryError | null>(null);
  const [checking, setChecking] = useState(false);
  const errorId = useId();

  const submit = async () => {
    if (checking) return;
    setChecking(true);
    setError(null);
    const result = await onReceive(value);
    setChecking(false);
    setError(result);
  };

  const input = (
    <input
      className={cn(
        "try-code-input try-mono",
        variant === "start" && "try-code-input--lg",
      )}
      aria-label={t("inputLabel")}
      inputMode="numeric"
      autoComplete="one-time-code"
      enterKeyHint="go"
      placeholder="000 000"
      value={value}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      data-testid={`try-code-input-${variant}`}
      onChange={(e) => {
        setValue(formatInput(e.target.value));
        setError(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") void submit();
      }}
    />
  );
  const button = (
    <button
      type="button"
      className={
        variant === "start"
          ? "try-btn try-btn--block"
          : "try-btn try-btn--ghost"
      }
      onClick={() => void submit()}
      disabled={checking}
    >
      {checking ? t("checking") : t("receive")}
    </button>
  );
  const message = error && (
    <p
      id={errorId}
      className="try-error-text try-code-error"
      role="alert"
      data-testid="try-code-error"
      data-reason={error}
    >
      {t(`errors.${error}`)}
    </p>
  );

  if (variant === "start") {
    return (
      <>
        {input}
        {message}
        {button}
      </>
    );
  }
  return (
    <div className="try-code-row">
      <div className="try-code-row-main">
        <span className="try-code-row-label">{t("haveCode")}</span>
        {input}
        {button}
      </div>
      {message}
    </div>
  );
}

const formatRemaining = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * The sender's code, its countdown and the "one use" note. Calls
 * `onExpired` once the server's expiry passes; it checks every second, so a
 * tab that was in the background catches up as soon as it runs again.
 */
export function SenderCode({
  slot,
  onExpired,
  onRetry,
}: {
  slot: CodeSlot;
  onExpired(): void;
  onRetry(): void;
}) {
  const t = useTranslations("try.code");
  const [now, setNow] = useState(() => Date.now());
  const ready = slot.status === "ready" ? slot : null;

  useEffect(() => {
    if (!ready) return;
    let fired = false;
    const tick = () => {
      const at = Date.now();
      setNow(at);
      if (!fired && at >= ready.expiresAtMs) {
        fired = true;
        onExpired();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [ready, onExpired]);

  if (slot.status === "unavailable") {
    return (
      <div
        className="try-code-slot"
        data-testid="try-sender-code"
        data-status="unavailable"
      >
        <span className="try-label">{t("inputLabel")}</span>
        <span className="try-code-unavailable" role="alert">
          {t("unavailable")}
        </span>
        <button
          type="button"
          className="try-btn try-code-retry"
          onClick={onRetry}
        >
          {t("tryAgain")}
        </button>
      </div>
    );
  }

  const remaining = ready ? ready.expiresAtMs - now : 0;
  const span = ready ? ready.expiresAtMs - ready.issuedAtMs : 1;
  return (
    <div
      className="try-code-slot"
      data-testid="try-sender-code"
      data-status={slot.status}
    >
      <span className="try-label">{t("scanOrEnter")}</span>
      {ready ? (
        <>
          <span
            className="try-code-value try-mono"
            data-testid="try-code-value"
          >
            {displayCode(ready.code)}
          </span>
          <div className="try-code-countdown">
            <div className="try-code-countdown-text">
              <span>
                {t.rich("expiresIn", {
                  remaining: formatRemaining(remaining),
                  time: (chunks) => (
                    <span className="try-mono try-code-time">{chunks}</span>
                  ),
                })}
              </span>
              <span>{t("oneUse")}</span>
            </div>
            <div className="try-code-countdown-bar" aria-hidden>
              <span
                style={{
                  width: `${Math.max(0, Math.min(1, remaining / span)) * 100}%`,
                }}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <span
            className="try-code-value try-code-value--empty try-mono"
            aria-hidden
          >
            ––– –––
          </span>
          <span className="try-label" role="status">
            {t("refreshing")}
          </span>
        </>
      )}
    </div>
  );
}

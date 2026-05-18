"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";

export type IosBetaSignupLabels = {
  description: string;
  emailPlaceholder: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successDetail: string;
  errorInvalid: string;
  errorServer: string;
  privacy: string;
};

type Props = {
  labels: IosBetaSignupLabels;
  locale?: string;
  endpoint?: string;
};

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function IosBetaSignupForm({
  labels,
  locale,
  endpoint = "/api/v1/ios-beta-signups",
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      setStatus("error");
      setErrorMessage(labels.errorInvalid);
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmed, locale: locale ?? null }),
      });
      const data: { ok?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok || !data.ok) {
        if (data.error === "invalid_email") {
          setStatus("error");
          setErrorMessage(labels.errorInvalid);
          return;
        }
        setStatus("error");
        setErrorMessage(labels.errorServer);
        return;
      }
      setSubmittedEmail(trimmed);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(labels.errorServer);
    }
  };

  if (status === "success") {
    return (
      <div
        className="border-border bg-bg2 flex items-start gap-3 rounded-[12px] border px-4 py-4"
        role="status"
      >
        <span
          aria-hidden
          className="text-background mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "#3DA47A",
            boxShadow: "0 0 0 3px rgba(61,164,122,0.18)",
          }}
        >
          <Check size={15} strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="text-foreground"
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: "-0.005em",
            }}
          >
            {labels.successTitle}
          </div>
          <p
            className="text-muted-foreground mt-1"
            style={{ fontSize: 12.5, lineHeight: 1.5 }}
          >
            {labels.successDetail.replace("__EMAIL__", submittedEmail ?? "")}
          </p>
        </div>
      </div>
    );
  }

  const isSubmitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5" noValidate>
      <p
        className="text-muted-foreground"
        style={{ fontSize: 12.5, lineHeight: 1.55 }}
      >
        {labels.description}
      </p>
      <div className="flex items-stretch gap-2">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") {
              setStatus("idle");
              setErrorMessage(null);
            }
          }}
          placeholder={labels.emailPlaceholder}
          aria-invalid={status === "error"}
          disabled={isSubmitting}
          className="bg-background text-foreground placeholder:text-muted-foreground focus:border-foreground/40 min-w-0 flex-1 rounded-[10px] border px-3 py-2.5 text-[14px] transition-colors outline-none disabled:opacity-60"
          style={{
            borderColor:
              status === "error"
                ? "var(--destructive, #d05656)"
                : "var(--border)",
            fontFamily: "var(--font-mono)",
          }}
        />
        <button
          type="submit"
          disabled={isSubmitting || email.trim().length === 0}
          className="bg-foreground text-background inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] px-3.5 py-2.5 text-[13.5px] font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ letterSpacing: "-0.005em" }}
        >
          <span>{isSubmitting ? labels.submitting : labels.submit}</span>
          {!isSubmitting && <ArrowRight size={14} strokeWidth={2} />}
        </button>
      </div>
      {status === "error" && errorMessage && (
        <p
          role="alert"
          style={{
            fontSize: 12,
            color: "var(--destructive, #d05656)",
            lineHeight: 1.5,
          }}
        >
          {errorMessage}
        </p>
      )}
      <p
        className="text-muted2"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.04em",
          lineHeight: 1.5,
        }}
      >
        {labels.privacy}
      </p>
    </form>
  );
}

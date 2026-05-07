"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type CopyableCommandProps = {
  command: string;
  copyLabel: string;
  copiedLabel: string;
  /**
   * "wrap": multi-line, wraps long commands (use in narrow cards).
   * "nowrap": single line with horizontal scroll (use when the command should
   * read as one shell line).
   */
  layout?: "wrap" | "nowrap";
  /** Show a leading `$` prompt glyph. */
  prompt?: boolean;
};

export function CopyableCommand({
  command,
  copyLabel,
  copiedLabel,
  layout = "wrap",
  prompt = false,
}: CopyableCommandProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // copy may fail in privacy modes; silently degrade
    }
  };

  return (
    <div
      className="bg-bg2 group/cmd relative flex items-start gap-2 rounded-[10px] px-3 py-2.5"
      style={{ border: "1px solid var(--hair2)" }}
    >
      {prompt && (
        <span
          aria-hidden
          className="text-muted2 shrink-0 leading-[1.55] select-none"
          style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
        >
          $
        </span>
      )}
      <code
        className={
          layout === "nowrap"
            ? "text-foreground min-w-0 flex-1 overflow-x-auto whitespace-nowrap"
            : "text-foreground block min-w-0 flex-1 [overflow-wrap:anywhere] whitespace-pre-wrap"
        }
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12.5,
          lineHeight: 1.55,
          letterSpacing: "-0.005em",
        }}
      >
        {command}
      </code>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? copiedLabel : copyLabel}
        title={copied ? copiedLabel : copyLabel}
        className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[7px] transition-colors"
      >
        {copied ? (
          <Check size={14} className="text-emerald-500" />
        ) : (
          <Copy size={14} />
        )}
      </button>
    </div>
  );
}

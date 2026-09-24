"use client";

import { Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

import { Link } from "@/i18n/navigation";
import {
  draftBytes,
  type DraftItem,
  MAX_ITEMS,
  MAX_TRANSFER_BYTES,
} from "@/lib/web-transfer/payload";

import { formatBytes, ItemLead } from "./parts";

type Attachment = { id: number; kind: "image" | "file"; file: File };

type Props = {
  mode: "send" | "reply";
  onSubmit(drafts: DraftItem[]): void;
  onBack?: () => void;
};

let nextId = 1;

const toAttachment = (file: File): Attachment => ({
  id: nextId++,
  kind: file.type.startsWith("image/") ? "image" : "file",
  file,
});

/**
 * The compose card: a text area plus attachments from the picker, drag and
 * drop, or a paste anywhere on the page.
 */
export function ComposeCard({ mode, onSubmit, onBack }: Props) {
  const t = useTranslations("try.compose");
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const sizeId = useId();

  const add = (files: Iterable<File>) => {
    const list = Array.from(files).map(toAttachment);
    if (list.length) {
      setAttachments((prev) => [...prev, ...list]);
      setShowEmpty(false);
    }
  };

  // A paste anywhere on the page lands in the card: files become
  // attachments, and text outside the text area is appended to it.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const data = e.clipboardData;
      if (!data) return;
      const files = Array.from(data.files);
      if (files.length) {
        e.preventDefault();
        add(
          files.map((f) =>
            f.name
              ? f
              : new File([f], `${t("pastedImage")}.png`, { type: f.type }),
          ),
        );
        return;
      }
      if (e.target === textRef.current) return;
      const pasted = data.getData("text/plain");
      if (!pasted) return;
      e.preventDefault();
      setText((prev) => (prev ? `${prev}\n${pasted}` : pasted));
      setShowEmpty(false);
      textRef.current?.focus();
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [t]);

  const drafts: DraftItem[] = [
    ...(text ? [{ kind: "text" as const, text }] : []),
    ...attachments.map((a) => ({ kind: a.kind, file: a.file })),
  ];
  const total = draftBytes(drafts);
  const tooMany = drafts.length > MAX_ITEMS;
  const over = total > MAX_TRANSFER_BYTES;
  const blocked = over || tooMany;
  const limit = formatBytes(MAX_TRANSFER_BYTES);

  const submit = () => {
    if (blocked) return;
    if (drafts.length === 0) {
      setShowEmpty(true);
      textRef.current?.focus();
      return;
    }
    onSubmit(drafts);
  };

  return (
    <div
      className="try-card try-compose"
      data-dragging={dragging ? "" : undefined}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setDragging(false);
        }
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setDragging(false);
        add(e.dataTransfer.files);
      }}
    >
      <textarea
        ref={textRef}
        aria-label={t("textLabel")}
        placeholder={dragging ? t("dropHint") : t("placeholder")}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setShowEmpty(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
        rows={5}
      />

      {attachments.length > 0 && (
        <ul className="try-chips" aria-label={t("attach")}>
          {attachments.map((a) => (
            <li key={a.id} className="try-chip">
              <ItemLead kind={a.kind} name={a.file.name} blob={a.file} />
              <span className="try-chip-name" title={a.file.name}>
                {a.file.name}
              </span>
              <button
                type="button"
                className="try-icon-btn"
                aria-label={t("remove", { name: a.file.name })}
                onClick={() =>
                  setAttachments((prev) => prev.filter((x) => x.id !== a.id))
                }
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {(blocked || showEmpty) && (
        <p
          className="try-error-text"
          role="alert"
          style={{ padding: "0 16px 12px" }}
        >
          {over ? (
            <>
              {t("tooLarge", { limit })}{" "}
              <Link href="/download" style={{ textDecoration: "underline" }}>
                {t("getApp")}
              </Link>
            </>
          ) : tooMany ? (
            t("tooMany", { max: MAX_ITEMS })
          ) : (
            t("empty")
          )}
        </p>
      )}

      <div className="try-compose-bar">
        {mode === "reply" && onBack && (
          <button type="button" className="try-quiet" onClick={onBack}>
            {t("cancelReply")}
          </button>
        )}
        <button
          type="button"
          className="try-quiet"
          aria-label={t("attach")}
          onClick={() => pickerRef.current?.click()}
        >
          <Upload size={16} aria-hidden />
          <span className="try-narrow-hide" aria-hidden>
            {t("attach")}
          </span>
        </button>
        <input
          ref={pickerRef}
          type="file"
          multiple
          hidden
          data-testid="try-file-input"
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = "";
          }}
        />
        {total > 0 && (
          <span
            id={sizeId}
            className="try-size try-mono"
            data-over={over ? "" : undefined}
          >
            {t("size", { size: formatBytes(total), limit })}
          </span>
        )}
        <button
          type="button"
          className="try-btn"
          onClick={submit}
          disabled={blocked}
          aria-describedby={total > 0 ? sizeId : undefined}
        >
          {mode === "reply" ? t("sendReply") : t("send")}
        </button>
      </div>
    </div>
  );
}

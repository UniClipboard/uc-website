"use client";

import { Check, Copy, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import type { TransferItem } from "@/lib/web-transfer/payload";

import { ItemLead, useObjectUrls } from "./parts";

export type CopyStatus = "idle" | "copied" | "failed";

const decoder = new TextDecoder();

export const textOf = (items: TransferItem[]): string | null => {
  const text = items.find((i) => i.kind === "text");
  return text ? decoder.decode(text.bytes) : null;
};

// Raster formats that are safe to render from a same-origin blob URL. The
// peer is untrusted: honouring its MIME type for anything else (text/html,
// image/svg+xml) would let a sender run script on this origin when the
// receiver opens a "Save" link in a new tab.
const SAFE_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
]);

const safeType = (item: TransferItem) =>
  item.kind === "image" && SAFE_IMAGE_TYPES.has(item.mime.toLowerCase())
    ? item.mime.toLowerCase()
    : "application/octet-stream";

const blobOf = (item: TransferItem) =>
  new Blob([item.bytes as Uint8Array<ArrayBuffer>], { type: safeType(item) });

const canCopyImage = (item: TransferItem) =>
  safeType(item) === "image/png" && typeof ClipboardItem !== "undefined";

/**
 * Writes received content to the clipboard: the text if there is any,
 * otherwise a lone PNG image. Files are never written to the clipboard.
 */
export async function copyToClipboard(
  items: TransferItem[],
): Promise<"copied" | "failed" | "nothing"> {
  try {
    const text = textOf(items);
    if (text !== null) {
      await navigator.clipboard.writeText(text);
      return "copied";
    }
    const images = items.filter(canCopyImage);
    if (images.length === 1 && items.length === 1) {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blobOf(images[0]) }),
      ]);
      return "copied";
    }
    return "nothing";
  } catch {
    return "failed";
  }
}

type Props = {
  items: TransferItem[];
  copyStatus: CopyStatus;
  onCopied(status: CopyStatus): void;
  /** The primary action beside Copy (e.g. Reply), rendered at the start. */
  secondary?: React.ReactNode;
  /** Hides the copy button when the caller shows its own primary action. */
  hideCopy?: boolean;
};

export function ReceivedContent({
  items,
  copyStatus,
  onCopied,
  secondary,
  hideCopy,
}: Props) {
  const t = useTranslations("try.received");
  const text = useMemo(() => textOf(items), [items]);
  const { files, blobs } = useMemo(() => {
    const files = items.filter((i) => i.kind !== "text");
    return { files, blobs: files.map(blobOf) };
  }, [items]);
  const urls = useObjectUrls(blobs);

  const [imageCopied, setImageCopied] = useState<number | null>(null);

  const copyText = async () => {
    if (text === null) return;
    try {
      await navigator.clipboard.writeText(text);
      onCopied("copied");
    } catch {
      onCopied("failed");
    }
  };

  return (
    <>
      {text !== null && (
        <div className="try-card try-text-box" data-testid="try-received-text">
          {text}
        </div>
      )}

      {files.length > 0 && (
        <ul
          className="try-items"
          style={{ margin: 0, padding: 0, listStyle: "none" }}
        >
          {files.map((item, i) => (
            <li key={i} className="try-item">
              <ItemLead
                kind={item.kind}
                name={item.name}
                blob={
                  safeType(item) !== "application/octet-stream"
                    ? blobs[i]
                    : undefined
                }
                alt={t("imagePreview")}
                large
              />
              <span className="try-item-name" title={item.name}>
                {item.name}
              </span>
              <span className="try-item-actions">
                {canCopyImage(item) && (
                  <button
                    type="button"
                    className="try-btn try-btn--ghost"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.write([
                          new ClipboardItem({ "image/png": blobs[i] }),
                        ]);
                        setImageCopied(i);
                      } catch {
                        onCopied("failed");
                      }
                    }}
                  >
                    {imageCopied === i ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                    {t("copyImage")}
                  </button>
                )}
                <a
                  className="try-btn try-btn--ghost"
                  href={urls[i]}
                  download={item.name || "download"}
                  aria-label={t("saveName", { name: item.name })}
                >
                  <Download size={14} aria-hidden />
                  {t("save")}
                </a>
              </span>
            </li>
          ))}
        </ul>
      )}

      {copyStatus === "copied" && (
        <p className="try-ok-text" role="status">
          <Check size={14} aria-hidden />
          {t("copied")}
        </p>
      )}
      {copyStatus === "failed" && (
        <p className="try-note" role="status">
          {t("copyFailed")}
        </p>
      )}

      <div className="try-actions">
        {secondary ?? <span />}
        {!hideCopy && text !== null && (
          <button type="button" className="try-btn" onClick={copyText}>
            <Copy size={16} aria-hidden />
            {t("copyText")}
          </button>
        )}
      </div>
    </>
  );
}

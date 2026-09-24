/** Content carried by one send: items, their metadata, and the size limit. */

export const MAX_TRANSFER_BYTES = 20 * 1024 * 1024;
/**
 * Items per send. With names capped at 255 characters (up to ~765 UTF-8
 * bytes), 50 items keep the OFFER JSON under the 64 KiB control-frame limit.
 */
export const MAX_ITEMS = 50;
const MAX_NAME_CHARS = 255;

export type ItemKind = "text" | "image" | "file";

export type ItemMeta = {
  kind: ItemKind;
  name: string;
  mime: string;
  size: number;
  sha256: string;
};

export type TransferItem = ItemMeta & { bytes: Uint8Array };

export type Offer = {
  transferId: string;
  items: ItemMeta[];
  total: number;
};

export type PreparedPayload = { offer: Offer; items: TransferItem[] };

export type DraftItem =
  | { kind: "text"; text: string }
  | { kind: "image" | "file"; file: File };

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes as Uint8Array<ArrayBuffer>,
  );
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export const draftBytes = (drafts: DraftItem[]): number =>
  drafts.reduce(
    (sum, d) =>
      sum +
      (d.kind === "text"
        ? new TextEncoder().encode(d.text).length
        : d.file.size),
    0,
  );

export function randomId(bytes = 16): string {
  const raw = crypto.getRandomValues(new Uint8Array(bytes));
  let binary = "";
  for (const b of raw) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Reads and hashes the drafts. Throws if the total exceeds the limit. */
export async function preparePayload(
  drafts: DraftItem[],
): Promise<PreparedPayload> {
  if (draftBytes(drafts) > MAX_TRANSFER_BYTES || drafts.length > MAX_ITEMS) {
    throw new RangeError("payload exceeds the transfer limit");
  }
  const items: TransferItem[] = [];
  for (const draft of drafts) {
    const bytes =
      draft.kind === "text"
        ? new TextEncoder().encode(draft.text)
        : new Uint8Array(await draft.file.arrayBuffer());
    items.push({
      kind: draft.kind,
      name:
        draft.kind === "text" ? "" : draft.file.name.slice(0, MAX_NAME_CHARS),
      mime:
        draft.kind === "text"
          ? "text/plain;charset=utf-8"
          : draft.file.type || "application/octet-stream",
      size: bytes.length,
      sha256: await sha256Hex(bytes),
      bytes,
    });
  }
  const offer: Offer = {
    transferId: randomId(),
    items: items.map(({ kind, name, mime, size, sha256 }) => ({
      kind,
      name,
      mime,
      size,
      sha256,
    })),
    total: items.reduce((sum, i) => sum + i.size, 0),
  };
  return { offer, items };
}

const isString = (v: unknown, max: number): v is string =>
  typeof v === "string" && v.length <= max;

const isSize = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;

/**
 * Validates an untrusted OFFER. Returns null when malformed. The size limit
 * is checked separately so the caller can answer with a specific REJECT.
 */
export function parseOffer(raw: Record<string, unknown>): Offer | null {
  const { transferId, items, total } = raw;
  if (!isString(transferId, 64) || transferId.length === 0) return null;
  if (!isSize(total) || !Array.isArray(items) || items.length > MAX_ITEMS) {
    return null;
  }
  const parsed: ItemMeta[] = [];
  let sum = 0;
  for (const item of items as unknown[]) {
    if (typeof item !== "object" || item === null) return null;
    const { kind, name, mime, size, sha256 } = item as Record<string, unknown>;
    if (kind !== "text" && kind !== "image" && kind !== "file") return null;
    if (!isString(name, MAX_NAME_CHARS) || !isString(mime, 255)) return null;
    if (!isSize(size) || typeof sha256 !== "string") return null;
    if (!/^[0-9a-f]{64}$/.test(sha256)) return null;
    sum += size;
    parsed.push({ kind, name, mime, size, sha256 });
  }
  if (sum !== total) return null;
  return { transferId, items: parsed, total };
}

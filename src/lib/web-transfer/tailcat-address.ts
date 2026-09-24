/**
 * Structural check for tailcat addresses before they reach the wasm.
 *
 * An address is "tc" + base64url(CBOR map). A real one looks like
 * {p: bytes(32), k: bytes(32), q: bytes(32), i: int}. The pinned tailcat
 * build (83921d71) retries a failed dial in a loop that never yields to the
 * browser when the address does not parse, which freezes the tab for good.
 * Truncated or mangled links must therefore be rejected here.
 */

const KEY_BYTES = 32;
const MAX_DEPTH = 8;

class CborError extends Error {}

type Cbor =
  | number
  | string
  | Uint8Array
  | Cbor[]
  | Map<string, Cbor>
  | boolean
  | null;

function decodeCbor(bytes: Uint8Array): Cbor {
  let pos = 0;
  const need = (n: number) => {
    if (pos + n > bytes.length) throw new CborError("truncated");
  };
  const readArg = (info: number): number => {
    if (info < 24) return info;
    const size = { 24: 1, 25: 2, 26: 4 }[info];
    if (!size) throw new CborError("unsupported length");
    need(size);
    let v = 0;
    for (let i = 0; i < size; i++) v = v * 256 + bytes[pos++];
    return v;
  };
  const item = (depth: number): Cbor => {
    if (depth > MAX_DEPTH) throw new CborError("too deep");
    need(1);
    const head = bytes[pos++];
    const major = head >> 5;
    const info = head & 31;
    if (major === 7) {
      if (info === 20) return false;
      if (info === 21) return true;
      if (info === 22) return null;
      throw new CborError("unsupported simple value");
    }
    const arg = readArg(info);
    switch (major) {
      case 0:
        return arg;
      case 1:
        return -1 - arg;
      case 2:
      case 3: {
        need(arg);
        const slice = bytes.subarray(pos, pos + arg);
        pos += arg;
        return major === 2
          ? slice
          : new TextDecoder("utf-8", { fatal: true }).decode(slice);
      }
      case 4: {
        const out: Cbor[] = [];
        for (let i = 0; i < arg; i++) out.push(item(depth + 1));
        return out;
      }
      case 5: {
        const out = new Map<string, Cbor>();
        for (let i = 0; i < arg; i++) {
          const key = item(depth + 1);
          if (typeof key !== "string") throw new CborError("non-text key");
          out.set(key, item(depth + 1));
        }
        return out;
      }
      default:
        throw new CborError("unsupported major type");
    }
  };
  const value = item(0);
  if (pos !== bytes.length) throw new CborError("trailing bytes");
  return value;
}

function fromBase64Url(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) return null;
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/");
  try {
    const binary = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

const isKey = (v: Cbor | undefined): boolean =>
  v instanceof Uint8Array && v.length === KEY_BYTES && v.some((b) => b !== 0);

export type TailcatAddressInfo = {
  /** The pinned DERP region, when the address names one by number. */
  regionId: number | null;
};

/** Decodes the parts of an address the page needs, or null if malformed. */
export function parseTailcatAddress(addr: string): TailcatAddressInfo | null {
  if (!addr.startsWith("tc")) return null;
  const bytes = fromBase64Url(addr.slice(2));
  if (!bytes || bytes.length === 0) return null;
  let info: Cbor;
  try {
    info = decodeCbor(bytes);
  } catch {
    return null;
  }
  if (!(info instanceof Map)) return null;
  const psk = info.get("q");
  const region = info.get("i");
  const wellFormed =
    isKey(info.get("p")) &&
    isKey(info.get("k")) &&
    (psk === undefined || isKey(psk)) &&
    (typeof region === "number" || Array.isArray(info.get("r")));
  if (!wellFormed) return null;
  return { regionId: typeof region === "number" ? region : null };
}

/** True when `addr` decodes to a complete tailcat connection info. */
export const isWellFormedTailcatAddress = (addr: string): boolean =>
  parseTailcatAddress(addr) !== null;

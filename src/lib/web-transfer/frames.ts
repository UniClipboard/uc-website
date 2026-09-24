/**
 * Wire framing for the /try web transfer protocol.
 *
 * Every frame is `type (1 byte) | length (4 bytes, big-endian) | payload`.
 * Control frames carry UTF-8 JSON; DATA frames carry raw bytes. The decoder
 * checks the declared length against a per-type ceiling before allocating, so
 * a hostile peer cannot make it buffer more than one legal frame.
 */

export const FrameType = {
  HELLO: 1,
  OFFER: 2,
  BUSY: 3,
  REJECT: 4,
  DATA: 5,
  END: 6,
  ACK: 7,
  CANCEL: 8,
} as const;

export type FrameType = (typeof FrameType)[keyof typeof FrameType];

export const HEADER_BYTES = 5;
export const MAX_DATA_BYTES = 64 * 1024;
export const MAX_CONTROL_BYTES = 64 * 1024;

const MAX_PAYLOAD: Record<FrameType, number> = {
  [FrameType.HELLO]: MAX_CONTROL_BYTES,
  [FrameType.OFFER]: MAX_CONTROL_BYTES,
  [FrameType.BUSY]: 0,
  [FrameType.REJECT]: MAX_CONTROL_BYTES,
  [FrameType.DATA]: MAX_DATA_BYTES,
  [FrameType.END]: MAX_CONTROL_BYTES,
  [FrameType.ACK]: MAX_CONTROL_BYTES,
  [FrameType.CANCEL]: 0,
};

export type Frame = { type: FrameType; payload: Uint8Array };

export class FrameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FrameError";
  }
}

const isFrameType = (t: number): t is FrameType => t in MAX_PAYLOAD;

export function encodeFrame(type: FrameType, payload?: Uint8Array): Uint8Array {
  const body = payload ?? new Uint8Array(0);
  if (body.length > MAX_PAYLOAD[type]) {
    throw new FrameError(`payload too large for frame type ${type}`);
  }
  const out = new Uint8Array(HEADER_BYTES + body.length);
  out[0] = type;
  new DataView(out.buffer).setUint32(1, body.length, false);
  out.set(body, HEADER_BYTES);
  return out;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

export function encodeControl(type: FrameType, message: unknown): Uint8Array {
  return encodeFrame(type, encoder.encode(JSON.stringify(message)));
}

/** Parses a control frame's JSON payload into a plain object, or throws. */
export function decodeControl(frame: Frame): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(decoder.decode(frame.payload));
  } catch {
    throw new FrameError("malformed control payload");
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new FrameError("control payload is not an object");
  }
  return value as Record<string, unknown>;
}

/**
 * Incremental frame decoder. Feed it chunks as they arrive with `push`, then
 * drain complete frames with `next`. Any malformed header throws `FrameError`
 * and leaves the decoder unusable; the caller must close the stream.
 */
export class FrameDecoder {
  private chunks: Uint8Array[] = [];
  private buffered = 0;
  private failed = false;

  push(chunk: Uint8Array): void {
    if (this.failed) throw new FrameError("decoder already failed");
    if (chunk.length === 0) return;
    this.chunks.push(chunk);
    this.buffered += chunk.length;
  }

  /** Bytes received but not yet returned as frames. */
  get pending(): number {
    return this.buffered;
  }

  next(): Frame | null {
    if (this.failed) throw new FrameError("decoder already failed");
    if (this.buffered < HEADER_BYTES) return null;

    const header = this.peek(HEADER_BYTES);
    const type = header[0];
    const length = new DataView(
      header.buffer,
      header.byteOffset,
      HEADER_BYTES,
    ).getUint32(1, false);

    if (!isFrameType(type)) return this.fail(`unknown frame type ${type}`);
    if (length > MAX_PAYLOAD[type]) {
      return this.fail(`frame length ${length} exceeds limit for type ${type}`);
    }
    if (this.buffered < HEADER_BYTES + length) return null;

    this.consume(HEADER_BYTES);
    return { type, payload: this.consume(length) };
  }

  private fail(message: string): never {
    this.failed = true;
    this.chunks = [];
    this.buffered = 0;
    throw new FrameError(message);
  }

  /** Copies the first `n` buffered bytes without consuming them. */
  private peek(n: number): Uint8Array {
    const out = new Uint8Array(n);
    let filled = 0;
    for (const chunk of this.chunks) {
      const take = Math.min(chunk.length, n - filled);
      out.set(chunk.subarray(0, take), filled);
      filled += take;
      if (filled === n) break;
    }
    return out;
  }

  /** Removes and returns the first `n` buffered bytes (n <= buffered). */
  private consume(n: number): Uint8Array {
    const out = new Uint8Array(n);
    let filled = 0;
    while (filled < n) {
      const head = this.chunks[0];
      const take = Math.min(head.length, n - filled);
      out.set(head.subarray(0, take), filled);
      filled += take;
      if (take === head.length) this.chunks.shift();
      else this.chunks[0] = head.subarray(take);
    }
    this.buffered -= n;
    return out;
  }
}

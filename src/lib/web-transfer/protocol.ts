/**
 * The /try transfer protocol over an abstract duplex byte stream.
 *
 * Pull: the receiver dials the sender's listener, says `HELLO pull` with the
 * link token, and the sender answers `OFFER, DATA…, END`. The receiver
 * verifies every item's SHA-256 and replies `ACK`. The sender reports
 * delivery only after `ACK ok`. Every later connection gets `BUSY`.
 *
 * Push (a reply): after a delivered pull, the sender's listener accepts
 * exactly one `HELLO push` with the same token and the flow runs in reverse.
 */

import {
  decodeControl,
  encodeControl,
  encodeFrame,
  type Frame,
  FrameDecoder,
  FrameError,
  FrameType,
  MAX_DATA_BYTES,
} from "./frames";
import {
  MAX_TRANSFER_BYTES,
  type Offer,
  parseOffer,
  type PreparedPayload,
  sha256Hex,
  type TransferItem,
} from "./payload";

export const PROTOCOL_VERSION = 1;

/** Reads resolve to `null` at end of stream. Reads are never concurrent. */
export interface ByteStream {
  read(): Promise<Uint8Array | null>;
  write(bytes: Uint8Array): Promise<unknown>;
  close(): void;
}

export type TransferErrorCode =
  | "busy"
  | "cancelled"
  | "peer-cancelled"
  | "too-large"
  | "rejected"
  | "integrity"
  | "connection-lost"
  | "protocol"
  | "timeout";

export class TransferError extends Error {
  constructor(
    readonly code: TransferErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "TransferError";
  }
}

const HELLO_TIMEOUT_MS = 15_000;
const IDLE_TIMEOUT_MS = 60_000;
const CANCEL_DRAIN_MS = 10_000;

/** A framed, write-serialised view of a byte stream. */
export class FramedConn {
  private decoder = new FrameDecoder();
  private writing: Promise<unknown> = Promise.resolve();
  private closed = false;

  constructor(private stream: ByteStream) {}

  /**
   * Next frame, or null at end of stream. Rejects on timeout (pass null for
   * none) or bad frames.
   */
  async readFrame(
    timeoutMs: number | null = IDLE_TIMEOUT_MS,
  ): Promise<Frame | null> {
    if (timeoutMs === null) return this.readFrameUntimed();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        this.close();
        reject(new TransferError("timeout"));
      }, timeoutMs);
    });
    try {
      return await Promise.race([this.readFrameUntimed(), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  private async readFrameUntimed(): Promise<Frame | null> {
    for (;;) {
      let frame: Frame | null;
      try {
        frame = this.decoder.next();
      } catch (err) {
        this.close();
        throw new TransferError("protocol", (err as FrameError).message);
      }
      if (frame) return frame;
      let chunk: Uint8Array | null;
      try {
        chunk = await this.stream.read();
      } catch {
        throw new TransferError("connection-lost");
      }
      if (chunk === null) {
        if (this.decoder.pending > 0) throw new TransferError("protocol");
        return null;
      }
      this.decoder.push(chunk);
    }
  }

  write(bytes: Uint8Array): Promise<void> {
    const next = this.writing.then(() => {
      if (this.closed) throw new TransferError("connection-lost");
      return this.stream.write(bytes);
    });
    this.writing = next.catch(() => undefined);
    return next.then(
      () => undefined,
      (err) => {
        throw err instanceof TransferError
          ? err
          : new TransferError("connection-lost");
      },
    );
  }

  /**
   * Sends CANCEL best-effort, then closes. Resolves once the stream is
   * closed; callers must keep the tunnel up until then or the frame is lost.
   *
   * CANCEL queues behind DATA already accepted by the userspace TCP stack,
   * which can be a megabyte or more on a rate-limited relay, so this waits
   * up to CANCEL_DRAIN_MS for that backlog to leave before giving up.
   */
  cancel(): Promise<void> {
    if (this.closed) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        this.close();
        resolve();
      };
      const timer = setTimeout(done, CANCEL_DRAIN_MS);
      this.write(encodeFrame(FrameType.CANCEL))
        // A resolved write is only queued in the userspace TCP stack; give
        // it a moment to leave before the close tears the stream down.
        .then(() => new Promise((r) => setTimeout(r, 300)))
        .catch(() => undefined)
        .finally(() => {
          clearTimeout(timer);
          done();
        });
    });
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    try {
      this.stream.close();
    } catch {
      // Already closed by the peer.
    }
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type Progress = (done: number, total: number) => void;

/** Sends OFFER, DATA… and END, then waits for the peer's verdict. */
async function sendPayload(
  conn: FramedConn,
  payload: PreparedPayload,
  onProgress: Progress,
  signal: AbortSignal,
): Promise<void> {
  const { offer, items } = payload;
  await conn.write(encodeControl(FrameType.OFFER, offer));

  // The peer may answer at any time (REJECT on OFFER, CANCEL mid-stream), so
  // its verdict is read concurrently with the DATA writes. That read has no
  // timeout of its own: a large send on a slow relay can legitimately take
  // minutes. Write backpressure bounds the send; the idle clock starts at END.
  let answered = false;
  const verdict = conn.readFrame(null).finally(() => {
    answered = true;
  });
  verdict.catch(() => undefined);

  let sent = 0;
  onProgress(0, offer.total);
  outer: for (const item of items) {
    for (let off = 0; off < item.bytes.length; off += MAX_DATA_BYTES) {
      if (answered) break outer;
      if (signal.aborted) throw new TransferError("cancelled");
      const chunk = item.bytes.subarray(off, off + MAX_DATA_BYTES);
      try {
        await conn.write(encodeFrame(FrameType.DATA, chunk));
      } catch (err) {
        // A peer that cancels closes its end; report the cancel, not the
        // broken pipe it causes.
        const late = await Promise.race([
          verdict.catch(() => null),
          new Promise<null>((r) => setTimeout(() => r(null), 500)),
        ]);
        if (late?.type === FrameType.CANCEL) {
          throw new TransferError("peer-cancelled");
        }
        throw err;
      }
      sent += chunk.length;
      onProgress(sent, offer.total);
    }
  }
  if (!answered) {
    await conn.write(
      encodeControl(FrameType.END, { transferId: offer.transferId }),
    );
  }

  let idle: ReturnType<typeof setTimeout> | undefined;
  const frame = await Promise.race([
    verdict,
    new Promise<never>((_, reject) => {
      idle = setTimeout(() => {
        conn.close();
        reject(new TransferError("timeout"));
      }, IDLE_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(idle));
  if (signal.aborted) throw new TransferError("cancelled");
  if (frame === null) throw new TransferError("connection-lost");
  switch (frame.type) {
    case FrameType.ACK: {
      const ack = decodeControl(frame);
      if (ack.transferId !== offer.transferId || sent !== offer.total) {
        throw new TransferError("protocol");
      }
      if (ack.ok !== true) throw new TransferError("integrity");
      return;
    }
    case FrameType.BUSY:
      throw new TransferError("busy");
    case FrameType.CANCEL:
      throw new TransferError("peer-cancelled");
    case FrameType.REJECT: {
      const reason = decodeControl(frame).reason;
      throw new TransferError(
        reason === "too-large" ? "too-large" : "rejected",
      );
    }
    default:
      throw new TransferError("protocol");
  }
}

/**
 * Reads OFFER, DATA… and END, verifies each item, and ACKs. `first` is the
 * already-read OFFER frame.
 */
async function receivePayload(
  conn: FramedConn,
  first: Frame,
  onOffer: (offer: Offer) => void,
  onProgress: Progress,
  signal: AbortSignal,
): Promise<TransferItem[]> {
  if (first.type !== FrameType.OFFER) throw new TransferError("protocol");
  const offer = parseOffer(decodeControl(first));
  if (!offer) throw new TransferError("protocol");
  if (offer.total > MAX_TRANSFER_BYTES) {
    await conn
      .write(encodeControl(FrameType.REJECT, { reason: "too-large" }))
      .catch(() => undefined);
    throw new TransferError("too-large");
  }
  onOffer(offer);

  // The declared total is bounded above, so one allocation is safe.
  const buffer = new Uint8Array(offer.total);
  let received = 0;
  onProgress(0, offer.total);
  for (;;) {
    const frame = await conn.readFrame();
    if (signal.aborted) throw new TransferError("cancelled");
    if (frame === null) throw new TransferError("connection-lost");
    if (frame.type === FrameType.CANCEL) {
      throw new TransferError("peer-cancelled");
    }
    if (frame.type === FrameType.DATA) {
      if (received + frame.payload.length > offer.total) {
        throw new TransferError("protocol");
      }
      buffer.set(frame.payload, received);
      received += frame.payload.length;
      onProgress(received, offer.total);
      continue;
    }
    if (frame.type !== FrameType.END) throw new TransferError("protocol");
    const end = decodeControl(frame);
    if (end.transferId !== offer.transferId || received !== offer.total) {
      throw new TransferError("protocol");
    }
    break;
  }

  const items: TransferItem[] = [];
  let ok = true;
  let off = 0;
  for (const meta of offer.items) {
    const bytes = buffer.subarray(off, off + meta.size);
    off += meta.size;
    if ((await sha256Hex(bytes)) !== meta.sha256) ok = false;
    items.push({ ...meta, bytes });
  }
  await conn.write(
    encodeControl(FrameType.ACK, { transferId: offer.transferId, ok }),
  );
  if (!ok) throw new TransferError("integrity");
  return items;
}

export type SendSessionEvents = {
  /** A receiver was accepted and the content started to flow. */
  onSendStart(total: number): void;
  onSendProgress: Progress;
  onDelivered(): void;
  onReplyStart(offer: Offer): void;
  onReplyProgress: Progress;
  onReply(items: TransferItem[]): void;
  /** `phase` tells whether the failure hit the send or the reply. */
  onFailed(error: TransferError, phase: "send" | "reply"): void;
};

type SendState =
  | "waiting"
  | "sending"
  | "delivered"
  | "receiving-reply"
  | "done"
  | "failed";

/**
 * The sender's half: owns the payload and the link token, and handles every
 * connection that reaches the listener. Serves one pull, then one push.
 */
export class SendSession {
  private state: SendState = "waiting";
  private active: FramedConn | null = null;
  private abort = new AbortController();

  constructor(
    private payload: PreparedPayload,
    private token: string,
    private events: SendSessionEvents,
  ) {}

  get total(): number {
    return this.payload.offer.total;
  }

  handleConnection(stream: ByteStream): void {
    void this.serve(new FramedConn(stream));
  }

  private async serve(conn: FramedConn): Promise<void> {
    let hello: Record<string, unknown>;
    try {
      const frame = await conn.readFrame(HELLO_TIMEOUT_MS);
      if (frame?.type !== FrameType.HELLO) throw new FrameError("no hello");
      hello = decodeControl(frame);
    } catch {
      conn.close();
      return;
    }
    if (
      hello.v !== PROTOCOL_VERSION ||
      typeof hello.k !== "string" ||
      !timingSafeEqual(hello.k, this.token)
    ) {
      conn.close();
      return;
    }

    const role = hello.role;
    const accept =
      (role === "pull" && this.state === "waiting") ||
      (role === "push" && this.state === "delivered");
    if (!accept) {
      await conn.write(encodeFrame(FrameType.BUSY)).catch(() => undefined);
      conn.close();
      return;
    }

    this.active = conn;
    const signal = this.abort.signal;
    try {
      if (role === "pull") {
        this.state = "sending";
        this.events.onSendStart(this.total);
        await sendPayload(
          conn,
          this.payload,
          this.events.onSendProgress,
          signal,
        );
        this.state = "delivered";
        this.events.onDelivered();
      } else {
        this.state = "receiving-reply";
        const first = await conn.readFrame();
        if (first === null) throw new TransferError("connection-lost");
        const items = await receivePayload(
          conn,
          first,
          this.events.onReplyStart,
          this.events.onReplyProgress,
          signal,
        );
        this.state = "done";
        this.events.onReply(items);
      }
    } catch (err) {
      if (signal.aborted) return;
      this.state = "failed";
      void conn.cancel();
      this.events.onFailed(
        err instanceof TransferError ? err : new TransferError("protocol"),
        role === "pull" ? "send" : "reply",
      );
      return;
    } finally {
      if (this.active === conn) this.active = null;
    }
    // Let the peer read our last frame before the stream goes away.
    setTimeout(() => conn.close(), 1000);
  }

  /** Stops any in-flight transfer and refuses further connections. */
  /** Resolves once the peer has been told, so the listener can close. */
  cancel(): Promise<void> {
    this.state = "done";
    this.abort.abort();
    const active = this.active;
    this.active = null;
    return active ? active.cancel() : Promise.resolve();
  }
}

export type TransferHandle<T> = {
  result: Promise<T>;
  cancel(): Promise<void>;
};

function run<T>(
  stream: ByteStream,
  body: (conn: FramedConn, signal: AbortSignal) => Promise<T>,
): TransferHandle<T> {
  const conn = new FramedConn(stream);
  const abort = new AbortController();
  const result = body(conn, abort.signal).then(
    (value) => {
      setTimeout(() => conn.close(), 1000);
      return value;
    },
    (err) => {
      if (abort.signal.aborted) throw new TransferError("cancelled");
      void conn.cancel();
      throw err instanceof TransferError ? err : new TransferError("protocol");
    },
  );
  return {
    result,
    cancel() {
      abort.abort();
      return conn.cancel();
    },
  };
}

/** The receiver's half: fetch the sender's content over a dialled stream. */
export function pull(
  stream: ByteStream,
  token: string,
  events: { onOffer(offer: Offer): void; onProgress: Progress },
): TransferHandle<TransferItem[]> {
  return run(stream, async (conn, signal) => {
    await conn.write(
      encodeControl(FrameType.HELLO, {
        v: PROTOCOL_VERSION,
        role: "pull",
        k: token,
      }),
    );
    const first = await conn.readFrame();
    if (first === null) throw new TransferError("connection-lost");
    if (first.type === FrameType.BUSY) throw new TransferError("busy");
    return receivePayload(
      conn,
      first,
      events.onOffer,
      events.onProgress,
      signal,
    );
  });
}

/** Sends a reply to the sender that this page just pulled from. */
export function push(
  stream: ByteStream,
  token: string,
  payload: PreparedPayload,
  onProgress: Progress,
): TransferHandle<void> {
  return run(stream, async (conn, signal) => {
    await conn.write(
      encodeControl(FrameType.HELLO, {
        v: PROTOCOL_VERSION,
        role: "push",
        k: token,
      }),
    );
    await sendPayload(conn, payload, onProgress, signal);
  });
}

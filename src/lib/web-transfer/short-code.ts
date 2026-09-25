/**
 * The 6-digit code: a short alias for a connection ticket, kept by the
 * rendezvous service's web pairing routes for five minutes.
 *
 * The sender registers `{v, kind, c, k}` and shows the code; the receiver
 * resolves the code back to the ticket and dials. Codes, tickets and
 * addresses are secrets: never log them or send them to analytics.
 *
 * Contract: docs/plans/2026-09-24-try-online-page.md, "T6 — 6-digit code"
 * (the uc-rendezvous `/v1/web-pairings` routes).
 */

import { type ConnectionTicket, toConnectionTicket } from "./link";

/** Off until the rendezvous web routes (CORS, rate limits) are live. */
export const SHORT_CODE_ENABLED =
  process.env.NEXT_PUBLIC_TRY_SHORT_CODE === "1" ||
  process.env.NEXT_PUBLIC_TRY_SHORT_CODE === "true";

const RENDEZVOUS_URL = (
  process.env.NEXT_PUBLIC_TRY_RENDEZVOUS_URL ||
  "https://rendezvous.uniclipboard.app"
).replace(/\/+$/, "");

const TICKET_KIND = "uc-web-try";
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Accepts what people type or paste ("482913", "482 913", full-width
 * digits) and returns the wire form `NNN-NNN`, or null.
 */
export function normalizeCode(input: string): string | null {
  const digits = input.normalize("NFKC").replace(/[\s\-‐-―]/g, "");
  return /^\d{6}$/.test(digits)
    ? `${digits.slice(0, 3)}-${digits.slice(3)}`
    : null;
}

/** `NNN-NNN` → `NNN NNN`, the form the page shows. */
export const displayCode = (code: string): string => code.replace("-", " ");

export const encodeCodeTicket = (ticket: ConnectionTicket): string =>
  JSON.stringify({ v: 1, kind: TICKET_KIND, c: ticket.addr, k: ticket.token });

/** Null for anything but a web ticket, including native pairing tickets. */
export function parseCodeTicket(raw: string): ConnectionTicket | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const { v, kind, c, k } = value as Record<string, unknown>;
  if (v !== 1 || kind !== TICKET_KIND) return null;
  return toConnectionTicket(c, k);
}

export type CodeErrorReason =
  /** 404 or 409: unknown, expired or already used. */
  | "expired"
  /** The ticket behind the code is not a web ticket. */
  | "invalid"
  /** 429. */
  | "rate-limited"
  /** 5xx, network failure, timeout or a malformed response. */
  | "unavailable";

export class CodeError extends Error {
  constructor(readonly reason: CodeErrorReason) {
    super(reason);
    this.name = "CodeError";
  }
}

async function post(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
  const onAbort = () => timeout.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  let res: Response;
  try {
    res = await fetch(`${RENDEZVOUS_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      credentials: "omit",
      cache: "no-store",
      signal: timeout.signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new CodeError("unavailable");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
  if (res.status === 404 || res.status === 409) {
    throw new CodeError("expired");
  }
  if (res.status === 429) throw new CodeError("rate-limited");
  if (!res.ok) throw new CodeError("unavailable");
  try {
    return await res.json();
  } catch {
    throw new CodeError("unavailable");
  }
}

/** The server's fixed code TTL (contract v1); no code lives longer. */
const MAX_LIFETIME_MS = 300_000;
/**
 * The shortest lifetime this page assumes. It bounds how fast a sender whose
 * clock runs ahead of the server's renews its code, and still admits the
 * 5-second TTL of the local development service.
 */
const MIN_LIFETIME_MS = 5_000;

/**
 * Converts the server's `expiresAtMs` (its clock) into a deadline on this
 * device's clock, since the two clocks can disagree and the server's `Date`
 * header is not readable across origins. The lifetime is clamped: never past
 * the fixed TTL from when the request was sent, never below a floor.
 */
export function localDeadline(
  sentAtMs: number,
  receivedAtMs: number,
  serverExpiresAtMs: number,
): number {
  const lifetime = Math.max(
    MIN_LIFETIME_MS,
    Math.min(MAX_LIFETIME_MS, serverExpiresAtMs - receivedAtMs),
  );
  return Math.min(receivedAtMs + lifetime, sentAtMs + MAX_LIFETIME_MS);
}

/** `expiresAtMs` is on this device's clock; see `localDeadline`. */
export type IssuedCode = { code: string; expiresAtMs: number };

/** Registers a new code for a ticket. Every call gets a fresh code. */
export async function createCode(
  ticket: ConnectionTicket,
  signal?: AbortSignal,
): Promise<IssuedCode> {
  const sentAtMs = Date.now();
  const data = (await post(
    "/v1/web-pairings",
    { ticket: encodeCodeTicket(ticket) },
    signal,
  )) as Partial<IssuedCode> | null;
  const code = typeof data?.code === "string" ? normalizeCode(data.code) : null;
  const expiresAtMs = data?.expiresAtMs;
  if (!code || typeof expiresAtMs !== "number" || !isFinite(expiresAtMs)) {
    throw new CodeError("unavailable");
  }
  return {
    code,
    expiresAtMs: localDeadline(sentAtMs, Date.now(), expiresAtMs),
  };
}

/** Looks up a code. Does not use it up; see `consumeCode`. */
export async function resolveCode(
  code: string,
  signal?: AbortSignal,
): Promise<ConnectionTicket> {
  const data = (await post("/v1/web-pairings/resolve", { code }, signal)) as {
    ticket?: unknown;
  } | null;
  const ticket =
    typeof data?.ticket === "string" ? parseCodeTicket(data.ticket) : null;
  if (!ticket) throw new CodeError("invalid");
  return ticket;
}

/** Stops later lookups of a code. Best effort: failures are ignored. */
export async function consumeCode(code: string): Promise<void> {
  try {
    await post("/v1/web-pairings/consume", { code });
  } catch {
    // The code expires on its own within five minutes.
  }
}

# "Try Online" Browser Transfer Page — Spec

**Status:** Draft for implementation. No code written yet.
**Date:** 2026-09-24
**Scope:** the new `/[locale]/try` page and a small entry point on the **existing** home page. The home page itself is **not** redesigned in this work.
**Design source:** the claude.ai Design canvas "UniClipboard Landing Redesign" (https://claude.ai/artifact/8BP1augUykCkPDDJAM4Vve).
- The `/try` page follows the **C** visual language: grid frame, Geist and Geist Mono, a restrained single accent, dark and light palettes.
- It uses the simplified `Try*` desktop and mobile boards.
- The C landing boards (`Grid*`) are only a style reference.

**Upstream investigation:** t-0048 (uc-rendezvous) — `short-code-investigation.md` and `short-lived-code-addendum.md` in that thread's library.

## 1. Goals

Add a **Try online** page (`/[locale]/try`) where two browsers exchange text, images or files over tailcat's end-to-end encrypted tunnel. There is no install and no account.
- Phase 1 connects through a link or QR code.
- Phase 2 adds a 5-minute 6-digit code.

## 2. Decisions already made

| Topic | Decision |
|---|---|
| Home page | Unchanged apart from the entry point in slice T5. The home redesign is out of scope. |
| `/try` look | C visual language, scoped to `/try`: CSS variables under a page-level wrapper. Site-wide tokens do not change. Geist and Geist Mono load only on this route. The page follows the site's existing theme setting (next-themes) with a C dark and a C light palette. The site's existing `Navigation` and footer stay for consistency; the grid frame and page body use C. |
| Transport | tailcat js/wasm, pinned to `tailscale/tailcat@83921d7141b80db20fd733ee195c805d2721e489`. Official public DERP map `https://tailcat.dev/derpmap.json` (CORS `*`). Browser traffic is relay-only. |
| Transfer model | One-shot per send. Either side can send once more as a reply. No persistent connection. |
| Short code | 6 digits, valid 5 minutes, replaced automatically. No confirmation step after manual entry. **Phase 2 only.** |
| Size limit | **20 MB** total per send, enforced on both sides. |
| Clipboard | Auto-copy is on by default and best effort. Fall back to a "Copy text" button. Files are downloaded, never written to the clipboard. |
| Analytics | Page views never include the URL fragment. See slice T0. |
| Positioning copy | "Web demo powered by tailcat". Not the UniClipboard sync engine and not interoperable with the apps. Never "browser-to-browser direct". |

## 3. Global constraints (from `AGENTS.md`)

- Public `[locale]` pages stay static:
  - no `force-dynamic`, and no `headers()` / `cookies()` / `searchParams`;
  - an explicit `revalidate` (`/try` `3600`; home keeps `3600`).
- The `/try` heading and compose card are SSR-visible and never wrapped in `AnimateIn`.
- No unused bytes:
  - the tailcat wasm (about 6.6 MB gzipped) loads **only** on `/try`, and **only** when a send starts or a connection link is opened;
  - no CJK font subsets on Latin pages;
  - Geist and Geist Mono are not loaded on any route other than `/try`.
- Middleware is not extended. The `/try` page is already covered by the page matcher.
- After every rendering change, `bun run build` must list `/[locale]` and `/[locale]/try` as static or ISR, never Dynamic.
- Name source files and directories by responsibility (e.g. `src/lib/web-transfer/`). Never use task ids.

## 4. Non-goals

- Redesigning the home page or changing site-wide theme tokens and fonts.
- Implementing or changing the rendezvous backend: CORS, rate limiting, isolation.
- A self-hosted DERP relay, or throughput guarantees.
- Resuming interrupted transfers, or background delivery after a tab closes.
- Interoperating with the tailcat CLI or the official web demo protocol.
- zh/ru *visual* variants. Copy is translated; layout is shared.

---

## 5. Slices

Each slice is a vertical, independently verifiable change. Dependencies are listed per slice.

### Try online

#### T0 — Analytics never sees the URL fragment
**Depends on:** —
- ~~In `src/app/[locale]/layout.tsx`, configure GA4 with an explicit `page_location` of `location.origin + location.pathname + location.search` for every page.~~ **Revised in review (PR #60):**
  - gtag keeps a configured `page_location` for later history-based page views, so a fixed value reports every client-side navigation as the landing page.
  - The layout therefore does not override `page_location`.
  - Instead, an inline script on `/try` strips the fragment before analytics loads. Its capture-phase `popstate` and `hashchange` listeners also strip fragments that arrive later.
- `/try` also removes the fragment from the address bar with `history.replaceState` as soon as it has read it.

**Accept:** a Playwright network assertion: on `/en/try#c=…&k=…`, no request to `googletagmanager.com` or `google-analytics.com` contains the fragment or any part of it.

#### T1 — Pinned tailcat wasm build
**Depends on:** —
- Add `scripts/build-tailcat-wasm.sh`. It:
  1. checks out tailcat at the pinned SHA;
  2. builds with `GOTOOLCHAIN=go1.27.1` (the repo requires Go 1.27.1; the local toolchain is 1.24): `GOOS=js GOARCH=wasm go build -o main.wasm ./web`;
  3. copies the matching `wasm_exec.js` from that toolchain;
  4. gzips the wasm and writes `public/tailcat/main.<sha8>.wasm.gz`, `public/tailcat/wasm_exec.<sha8>.js`, and `public/tailcat/manifest.json` (source SHA, Go version, file SHA-256s, byte sizes).
- Extend `STATIC_ASSET_PATTERN` in `next.config.ts` with `js|gz|wasm` only for the `/tailcat/` path, as immutable, one-year cache.
- Add the tailcat BSD-3-Clause notice to the page footer or the licenses list.

**Accept:**
- A second run reproduces identical SHA-256s.
- The home page's network log contains no `/tailcat/` request.

#### T2 — Web transfer protocol
**Depends on:** —
- A pure TypeScript module `src/lib/web-transfer/` over an abstract duplex byte stream. The tailcat `conn` adapter sits in T3.
- **Framing:** a 1-byte type, then a 4-byte big-endian length, then the payload. Control frames carry UTF-8 JSON. `DATA` frames carry at most 64 KiB of raw bytes.
- **Frames:**
  - `HELLO {v:1, role:"pull"|"push", k}`;
  - `OFFER {transferId, items:[{kind:"text"|"image"|"file", name, mime, size, sha256}], total}`;
  - `BUSY`;
  - `REJECT {reason}`;
  - `DATA`;
  - `END {transferId}`;
  - `ACK {transferId, ok}`;
  - `CANCEL`.
- **Pull** (the receiver fetches):
  1. The receiver dials and sends `HELLO pull`.
  2. The sender validates `k`, then locks the transfer. Every later connection gets `BUSY`.
  3. The sender sends `OFFER`, then `DATA…`, then `END`.
  4. The receiver verifies each item's SHA-256, then sends `ACK`.
  5. The sender shows **Delivered** only after `ACK ok`.
- **Push** (a reply): after a delivered pull, the sender's listener accepts exactly one `HELLO push` with the same `k`. The flow then mirrors pull in the other direction.
- **Limits:**
  - `total` over 20 MB is rejected by the sender before offering and by the receiver on `OFFER`;
  - an unknown `v`, a bad `k`, or a malformed frame closes the stream.
- Unit tests only for the frame parser, covering boundary lengths and malformed input. Behaviour is covered end-to-end in T3 and T4.

**Accept:** the parser rejects truncated, oversized and unknown frames without allocating more than the declared length.

#### T3 — `/try` tracer bullet: send and receive by link or QR
**Depends on:** T0, T1, T2
- **Page:** static `src/app/[locale]/try/page.tsx` with `revalidate = 3600`. The page shell renders the Start screen (compose card). The 6-digit row is **hidden in phase 1**.
- **Loading:**
  - wasm loads lazily on "Send" or when the fragment has `c=`;
  - fetch the `.gz`, decompress with `DecompressionStream`, and show load progress, as the official app does.
- **Sender:**
  1. Create a fresh, non-persisted key per send and call `tailcatListen`.
  2. Build the link `/<locale>/try#c=<tc>&k=<token>`, where `k` is a 128-bit random base64url token.
  3. Render the QR code client-side with a small MIT library, registered in `optimizePackageImports` if it is large.
  4. Show the Code-ready screen with the QR and "Copy link". Mobile shows "Share link" through `navigator.share`, falling back to copy.
- **Receiver:** open the link, read the fragment and strip it (T0), `tailcatDial`, pull, show the Receiving and Received screens.
  - Text is written with `navigator.clipboard.writeText` when auto-copy is on; otherwise, or on failure, show "Copy text".
  - Images use `ClipboardItem` where supported, otherwise Save.
  - Files are saved through a Blob URL download.
- **Compose:**
  - a global `paste` listener takes text, images and files;
  - drag and drop, the file picker, and a textarea.
  - Attachments show as chips with remove buttons, and a running size is shown against the 20 MB limit.
- **Visuals:** C dark and light styles scoped to `/try`, following the simplified `Try*` desktop and mobile boards. Fonts come from a route-level `next/font` instance, with Cyrillic-capable instances for `ru`.

**Accept:** a Playwright E2E test with two isolated browser contexts, over the real official relay:
- text, a PNG and a 5 MB file arrive, and their SHA-256s match;
- auto-copy works in Chromium with the clipboard permission granted, and the fallback button appears when the permission is denied;
- the home page loads no `/tailcat/` asset;
- `bun run build` shows `/[locale]/try` as static or ISR.

Artifacts: screenshots of each state at 1440 and 390 px, a JSON of the assertions, and redacted logs.

#### T4 — Reply, delivered, busy, cancel, failure states
**Depends on:** T3
- The reply flow: Received → Reply → push. The sender shows Delivered plus the reply, which is auto-copied if enabled.
- A second receiver on the same link gets `BUSY`. Its UI reads "This link was already used. Ask for a new one."
- Cancel on either side sends `CANCEL`, closes the stream, and clears in-memory content.
- A dial timeout of 60 s from tailcat shows "Couldn't connect. Ask the sender to keep their page open, then try again."
- A send over 20 MB is blocked in compose with a "Get the app for larger files" hint.
- The sender's in-flight state shows progress only and no link.
- After delivery or cancel, the send session's listener is closed. A new send creates a new key and link.

**Accept:** E2E covers:
- the reply round-trip with a SHA-256 match;
- a third context getting BUSY;
- cancel mid-transfer on each side;
- the 20 MB boundary: 20 MB passes, 20 MB + 1 byte is blocked;
- an unreachable address giving the failure copy.

#### T5 — Entry points on the existing site, plus translations
**Depends on:** T3
- Add a "Try online" item to the existing `src/components/landing/Navigation.tsx` (desktop and mobile menus), in the current site style.
- Add one secondary CTA, "Try it in your browser →", to the existing hero, in the current style. It must not change the LCP element and must not use `AnimateIn`.
- A `try.*` namespace in `messages/{en,zh,ru}.json` for every string on the page, including the error copy. Also a `navigation.try` key.

**Accept:**
- The entry links resolve per locale.
- There are no missing keys.
- Home LCP is unchanged (record before and after values).
- The home route stays ISR.

#### T6 — 6-digit code (phase 2)
**Depends on:** T4. **Blocked on** the rendezvous deployment answers below.
- **Sender:** register `POST /v1/pairings` with `{ttlSecs:300, codeLength:6, sponsorDeviceId, sponsorDeviceName:"UniClipboard Web Demo", sponsorEndpointId, sponsorTicket}`.
  - `sponsorTicket` is `JSON.stringify({v:1, kind:"uc-web-try", c:<tc>, k:<token>})`.
  - Show the code, a countdown from the server's `expiresAtMs`, and "One use".
  - When the code expires with no transfer in flight, register a new code. During a transfer, show no code.
  - If registration fails, show "Can't get a code right now" with Try again. The QR and link keep working.
- **Receiver:**
  1. Normalise the input to `XXX-XXX` and call `resolve`.
  2. If the ticket is not JSON with `kind:"uc-web-try"`, show "That isn't a valid code".
  3. Dial.
  4. After `ACK`, call `consume` as best effort. Ignore its result for delivery status.
- **Error copy:** expired or used (404 / 409), not a web code, too many tries (429), service unavailable (5xx or network), connection failed.
- Behind the `NEXT_PUBLIC_TRY_SHORT_CODE` flag until the checks below are confirmed.

**Blocking questions for the rendezvous owner** (from the t-0048 addendum):
1. Does production have an edge layer that answers OPTIONS and sends CORS headers for the site origin on `/v1/pairings`, `/resolve` and `/consume`, including error responses? The bare Worker returns 404 to OPTIONS.
2. Is there rate limiting or abuse protection in production?
3. Is sharing the native pairing code pool acceptable, or is a web route or namespace required?

**Accept:** once unblocked, E2E against a non-production rendezvous covers:
- code register → resolve → transfer → consume;
- expiry and auto re-registration;
- 404 / 409 / 429 / 5xx copy;
- a native-looking ticket rejected as "not a valid code".

No production load testing.

---

## 6. Suggested order

`T0`, `T1` and `T2` can run in parallel. Then `T3 → T4 → T5`. `T6` waits on rendezvous.

## 7. Risks and open items

- **Official relay limits.** DERP relays are free but rate-limited, with no SLA. E2E tests hit real relays, so keep test runs small. Copy never promises speed.
- **Wasm weight.** About 6.6 MB gzipped. Show load progress. Load it on user intent only, never prefetch it.
- **Browser clipboard rules.** Safari and Firefox often block writes without a gesture, so the fallback button is mandatory.
- **Single use is enforced by the page, not the server.** On the link path, `k` limits access to holders of the link. On the code path, anyone who resolves the code can obtain `c` and `k`. The user accepted this, together with the 5-minute window.
- **Decided (2026-09-24):** in phase 1 the 6-digit row is hidden. `/try` keeps the site's existing navigation and footer.

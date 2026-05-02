# Encryption & Privacy Whitepaper

*Last updated: May 2026*

---

## 1. Why Clipboard Data Must Be Encrypted

Clipboard content is uniquely sensitive. In the course of a normal workday it carries:

* Passwords, one-time codes, API tokens, recovery phrases
* Private keys, signing material, configuration snippets
* Internal documents, draft messages, unreleased content
* Files copied between devices

Most clipboard tools treat this data as transient or harmless. In reality, it is one of the highest-risk data surfaces on any device — short-lived, frequently sent over the network, and rarely audited.

**UniClipboard was designed around a single premise:**

> Convenience should never require surrendering control over your data.

Everything in this document follows from that one rule.

---

## 2. Core Security Principles

UniClipboard's encryption system is built on four non-negotiable principles:

1. **User-Controlled**
   Encryption is initiated and owned by the user. Keys are derived from a passphrase you pick — never generated server-side, never escrowed.

2. **End-to-End Encrypted**
   Data is encrypted before it leaves the device and decrypted only on devices that have the matching key material. The transport layer is treated as untrusted.

3. **Zero-Knowledge by Design**
   UniClipboard servers cannot read your clipboard content. This is a property of the architecture, not a privacy policy.

4. **Minimal Exposure**
   Plaintext exists only where strictly necessary, only for the shortest possible time, and is wiped from memory on drop.

---

## 3. High-Level Architecture

UniClipboard is built around the concept of a **space**: a logical group of devices that trust each other and share an encrypted clipboard history. Each space has its own master key, and devices join a space by entering a short-lived invitation code together with the space passphrase.

Once a space is created, the data flow is:

```
Clipboard Content
   → Local Encryption (Source Device)
   → P2P Direct Channel  ──or──  Encrypted Relay Fallback
   → Local Decryption (Target Device)
```

Key implications:

* P2P direct connections are preferred, including across home/office networks via NAT hole-punching
* Relay nodes and any intermediate infrastructure only ever see authenticated ciphertext
* Network transport does not affect cryptographic guarantees — payload encryption is independent of the transport
* Trust boundaries remain entirely on user devices

---

## 4. Cryptographic Primitives

UniClipboard intentionally uses a small, well-studied set of modern primitives.

| Purpose                              | Primitive                                   |
| ------------------------------------ | ------------------------------------------- |
| Authenticated encryption (AEAD)      | XChaCha20-Poly1305                          |
| Key derivation from passphrase       | Argon2id (memory-hard, GPU/ASIC-resistant)  |
| AAD fingerprint / domain separation  | BLAKE3                                      |
| Encrypted local search index         | HMAC over a search key derived from MasterKey |
| Random material                      | OS CSPRNG (`OsRng`)                         |

### AEAD parameters

* **Cipher**: XChaCha20-Poly1305
* **Key size**: 32 bytes (256-bit)
* **Nonce size**: 24 bytes, generated fresh per record from the OS CSPRNG. The 192-bit nonce space makes accidental reuse a non-issue in practice.
* **Authentication tag**: 16 bytes (Poly1305)
* **AAD**: bound to the data's logical identity (see §5.2)

### Argon2id parameters

* **Memory cost**: 128 MB
* **Iterations**: 3
* **Parallelism**: 4 threads
* **Output length**: 32 bytes

These parameters are calibrated to stay snappy on a typical user device while making large-scale offline cracking economically unattractive.

---

## 5. Key Management Model

### 5.1 Layered Key Hierarchy

UniClipboard avoids single-point compromise by separating user-facing secrets from data-encrypting secrets.

```
User Passphrase
        │  Argon2id (per-space salt, 128 MB · 3 iters · 4 threads)
        ▼
Key Encryption Key (KEK, 32 bytes)
        │  XChaCha20-Poly1305  (KeySlot wrapping)
        ▼
MasterKey (32 bytes, random)
        │  XChaCha20-Poly1305  (per-record AAD)
        ▼
Clipboard Data / Blob Storage
```

**Roles of each layer:**

* **User Passphrase** — Never leaves the device. Never used directly to encrypt data.
* **KEK** — Derived from the passphrase via Argon2id. Used only to unwrap the MasterKey. Stored in the OS keyring.
* **MasterKey** — Random 32 bytes, generated locally. Encrypts every clipboard entry and blob in the space. Stored on disk only in *wrapped* form (a "KeySlot" file).
* **Per-space isolation** — Every space has its own MasterKey. Switching to another space re-encrypts local history under the new MasterKey.

### 5.2 Per-Record Domain Separation (AAD)

Every encrypted record is bound to its identity through Additional Authenticated Data (AAD). The AAD format is versioned and namespaced:

```
uc:inline:v1|<event_id>|<representation_id>      // for inline clipboard data
uc:blob:v1|<blob_id>                              // for blob storage
```

This means a ciphertext that decrypts at all only decrypts in the right place. An attacker cannot:

* Replay an old record into a different slot
* Move a blob ciphertext under a different blob id
* Splice records between events

A 16-byte BLAKE3 fingerprint of the AAD is stored alongside the ciphertext to detect mismatch errors early.

### 5.3 Secure Local Storage

Wrapped key material lives in two places:

* **The OS keyring** stores the KEK using platform-native secure storage:
  * macOS — Keychain Services
  * Windows — Credential Manager
  * Linux — Secret Service (libsecret-compatible)
* **The KeySlot file** on disk stores the MasterKey *wrapped* under the KEK. Disk access alone is insufficient to recover any plaintext.

Sensitive in-memory values (passphrases, master keys, plaintext buffers) are held in dedicated secret types that:

* Refuse to be cloned, serialized, logged, or printed
* Display as `[REDACTED]` in `Debug` and `Display`
* Zero their memory on drop

---

## 6. Clipboard Data Encryption Strategy

### 6.1 What is Encrypted, What Is Not

UniClipboard distinguishes between three independent layers of encryption:

* **App-layer (MasterKey)** — XChaCha20-Poly1305 under the space MasterKey. Protects against anyone who can read raw bytes off disk or off any intermediary that does not also hold the MasterKey.
* **Transport (QUIC)** — Provided by iroh's QUIC stack with TLS 1.3-style AEAD, authenticated by each endpoint's Ed25519 device identity. Protects against passive eavesdroppers, active MITM, and relay nodes regardless of whether the app-layer encryption is on.
* **Storage at rest** — Whether the disk copy itself is ciphertext.

| Content                | App-layer (MasterKey) | Transport (iroh QUIC) | At rest on disk             |
| ---------------------- | --------------------- | --------------------- | --------------------------- |
| Text (inline)          | Yes                   | Yes                   | Encrypted (per-record AEAD) |
| Images (blob)          | Yes                   | Yes                   | Encrypted (UCBL: zstd + AEAD) |
| **File payload bytes** | **No** (by design)    | **Yes**               | **Plaintext (BLAKE3-addressed)** |
| File metadata          | Yes                   | Yes                   | Encrypted (with the clipboard event) |
| Search index           | Yes (HMAC tags)       | n/a                   | No plaintext tokens (see §8) |
| Key material           | n/a                   | n/a                   | KEK in OS keyring; MasterKey wrapped in a KeySlot file |

**Why file payloads are not application-layer encrypted.** This is a deliberate scope decision, not an oversight:

1. **Provenance** — File payloads are content the user already chose to copy. Their confidentiality is bounded by the user's intent at copy time.
2. **Metadata is what leaks.** The fields most likely to expose what a file is — its name, the directory it came from, its MIME type, and any preview thumbnail — are *not* in the file body. They are part of the clipboard event itself, and are encrypted under the space MasterKey through the same per-record AEAD as text.
3. **Performance.** Treating files as raw, content-addressed bytes lets large transfers use BLAKE3 outboard hashing, reflink-based imports on APFS / Btrfs / XFS, external-handle imports on Windows, and iroh-blobs' streaming download path. Wrapping every byte in an extra AEAD pass would erase those gains without adding meaningful confidentiality on top of what the transport already provides.

**What this means in practice.**

* On the wire — even for files — there is no point at which raw plaintext is exposed. The QUIC layer authenticates and encrypts every packet end-to-end between the two devices. Wi-Fi sniffers, ISPs, and the iroh relay see only QUIC ciphertext; the relay does not hold the keys to decrypt either the QUIC stream or the BlobTicket that addresses the transfer.
* On disk, however — only on the user's own paired devices — file payloads land as plaintext in the content-addressed cache. Anyone with read access to that directory (or to a logged-in, unlocked desktop session) can recover the file bytes, exactly as if they had been copied to the file system.
* The clipboard event referencing those files (filename, path, MIME, thumbnail, etc.) is still encrypted at rest, and is unreadable without unlocking the space.
* For text and images, the bytes themselves are encrypted at rest under the space MasterKey, in addition to QUIC transport encryption on the wire.

### 6.2 Storage Layout at Rest

* **Clipboard event database** — Encrypted SQLite store. Inline text and structured representation data are encrypted per record.
* **Encrypted blob store (UCBL format)** — Used for image payloads and other application-managed blobs. Each blob is zstd-compressed, then encrypted with XChaCha20-Poly1305 under a per-blob AAD; the file header is `[UCBL magic | version | nonce]`.
* **Content-addressed file cache** — Backed by iroh-blobs. File payloads are stored as raw bytes, addressed by the BLAKE3 hash of their plaintext. **This cache is not encrypted at the application layer** (see §6.1).
* **Search index** — Inverted index keyed by HMAC term tags (see §8). No plaintext tokens.
* **Key material** — KEK in the OS keyring; wrapped MasterKey in a KeySlot file on disk.

---

## 7. Sync Security Model

UniClipboard's transport is built on QUIC-based P2P networking ([iroh](https://www.iroh.computer)). Two independent layers of encryption sit on top of each other:

* **iroh QUIC (transport)** — Every connection — clipboard events, blob fetches, presence, pairing — runs over QUIC with TLS 1.3-style AEAD, authenticated by each endpoint's long-term Ed25519 identity. This protects all bytes on the wire, regardless of what they carry. Relays only forward already-encrypted QUIC datagrams; they hold no key material that would let them decrypt anything.
* **MasterKey (application)** — On top of QUIC, clipboard events and image blobs are *additionally* encrypted with XChaCha20-Poly1305 under the space MasterKey, so that even an endpoint that participates in the iroh network without holding the MasterKey cannot read them. As described in §6.1, file payloads do not get this second layer; they rely solely on QUIC transport encryption while in flight.

### 7.1 Pairing & Device Identity

* Each device generates a long-term key pair locally on first run.
* Joining a space requires an invitation code (short-lived, valid for several minutes) plus the space passphrase. There is no email, account, or cloud signup.
* Pairings are stored locally; revoking a device from any paired peer immediately stops including it in future syncs.

### 7.2 Local Network Sync

* Devices on the same Wi-Fi connect directly without traversing any external infrastructure.
* Payloads are encrypted under the space MasterKey before they reach the wire.
* Packet capture yields only ciphertext.

### 7.3 Cross-Network Sync

When devices cannot reach each other directly, UniClipboard performs NAT hole-punching to establish a P2P connection. If hole-punching fails:

* The iroh relay forwards QUIC datagrams between peers.
* The relay sees only QUIC ciphertext and connection metadata (peer IDs, timing). It does not hold the QUIC session keys, and a fortiori does not hold any space MasterKey.
* The relay cannot derive keys, decrypt traffic, or modify content without detection — AEAD authentication tags at both the QUIC layer (always) and the MasterKey layer (text and images) catch tampering.

### 7.4 Wire Format for Clipboard Events

Clipboard events use a chunked, application-layer wire format that:

* Splits the payload into bounded chunks (large events do not have to fit in memory)
* Compresses each chunk with zstd before encryption
* Authenticates each chunk under a per-chunk AAD `(transfer_id ‖ chunk_index)` so chunks cannot be reordered, dropped, or replayed
* Carries a versioned header (`UC3\0`) so future format changes can be rolled out safely

Large file payloads use a different, transport-native path: the sender adds the file to its iroh-blobs store and issues a `BlobTicket`; the ticket is delivered inside the encrypted clipboard event; the receiver fetches the blob over a QUIC stream tagged with the `BLOBS_ALPN` protocol. The QUIC stream is encrypted (§7.3); the blob bytes inside that stream are not additionally re-encrypted under the MasterKey (§6.1).

### 7.5 Resilience

Connections recover automatically after Wi-Fi switches, sleep/wake, and brief disconnects, without requiring re-pairing.

---

## 8. Local Encrypted Search

UniClipboard supports millisecond-level full-text search across tens of thousands of entries while keeping the index encrypted on disk.

* **Search key derivation** — A dedicated search key is derived from the unlocked MasterKey, separating search from content encryption.
* **Term tags** — Each token is replaced by `HMAC(search_key, normalized_token)` before being written to the inverted index. The disk never holds plaintext search terms.
* **Lock-aware** — The daemon does not capture or index clipboard content while the session is locked, and search is unavailable until the user unlocks. Index rebuilds only run in the unlocked state.
* **Normalization** — Stable, versioned rules (Unicode NFKC, lowercasing, whitespace collapsing, HTML stripping, URL/path segmentation). The index carries an `index_version` so future rule changes can trigger a safe rebuild.
* **Tokenization** — Hybrid: word-level for Latin text, numbers, paths, URLs, file names; bigram for CJK. This matches the mixed nature of clipboard content (prose, shell commands, code, URLs, file paths).

The search subsystem trades off only what is necessary: it does not try to hide local access patterns or local query frequency, since those are observable to anyone who already has access to the unlocked machine.

---

## 9. Local Daemon API

The desktop GUI and `uniclip` CLI both talk to a local background daemon over HTTP and WebSocket. The daemon is hardened against local misuse:

* **Loopback-only** — The daemon binds only to `127.0.0.1`; traffic never leaves the machine.
* **Bearer-to-session exchange** — A bearer token stored in a `chmod 600` file is exchanged for a short-lived session JWT (5-minute TTL, signed with HS256 over a 32-byte secret).
* **PID whitelist** — Each session is tied to the calling process's PID; mismatched callers are rejected.
* **Rate limiting** — 100 requests per minute per client, sliding window.
* **No persistent client storage** — Session tokens live only in memory; nothing sensitive is written to `localStorage`, `sessionStorage`, or cookies.
* **Defense in depth** — Authentication runs before rate limiting, and dangerous endpoints (e.g. cache reset) require an explicit `confirmed: true` flag.

These properties were validated as part of an internal phase-level security audit.

---

## 10. Threat Model

### 10.1 What UniClipboard Protects Against

| Threat                                              | Protected |
| --------------------------------------------------- | --------- |
| Network eavesdropping on the local Wi-Fi            | Yes       |
| Eavesdropping on relay traffic                      | Yes       |
| Server / relay compromise                           | Yes       |
| Cloud or third-party storage compromise             | Yes       |
| Active man-in-the-middle on the relay               | Yes       |
| Disk theft of an inactive device                    | Yes       |
| Replaying or splicing records between slots         | Yes       |
| Local non-privileged process talking to the daemon  | Yes       |

### 10.2 Explicit Non-Goals

UniClipboard does not claim to defend against:

* Fully compromised devices (root malware, key-loggers, hostile administrators)
* User-leaked passphrases
* Forensic recovery from a device while it is unlocked and the user is logged in
* Side-channels visible to anyone with full local access (e.g. raw access patterns)
* **Reading raw bytes out of the local file cache.** Per §6.1, file payloads are stored as content-addressed raw bytes; they are not encrypted at the application layer. Their associated metadata (filename, path, MIME, thumbnail) *is* encrypted as part of the clipboard event.

Security is strongest when threat boundaries are stated honestly. We list our non-goals so users can make informed decisions.

---

## 11. User Control & Transparency

Users can:

* Enable or disable encryption initialization on first run, and rotate it later
* Switch to a different space; existing local history is re-encrypted under the new space's MasterKey
* Pause syncing instantly
* Revoke a lost or stolen device from any other paired device — the space stops including it on the next sync
* Opt out of anonymous telemetry at any time. Telemetry never carries clipboard content or personal data.

The full source — including every cryptographic operation described here — is published on GitHub under AGPL-3.0. Trust the code, not the marketing.

---

## 12. Conclusion

Encryption in UniClipboard is not an optional feature, a marketing checkbox, or a “Pro” upsell.

It is the foundation of the product.

We believe:

* Your data belongs to you
* Sync does not imply custody
* Privacy should not be traded for convenience

Every architectural decision in this document follows from those three sentences.

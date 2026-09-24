/**
 * @jest-environment node
 */
import { isWellFormedTailcatAddress } from "@/lib/web-transfer/tailcat-address";

// Minimal CBOR encoding of the address map, as tailcat's encoder emits it.
const text = (s: string) => [0x60 + s.length, ...Buffer.from(s)];
const bytes32 = (fill: number) => [0x58, 32, ...new Array(32).fill(fill)];
const encode = (entries: number[][]) =>
  "tc" +
  Buffer.from([0xa0 + entries.length, ...entries.flat()]).toString("base64url");

const P = [...text("p"), ...bytes32(1)];
const K = [...text("k"), ...bytes32(2)];
const Q = [...text("q"), ...bytes32(3)];
const I = [...text("i"), 0x18, 0x2a];
const VALID = encode([P, K, Q, I]);

describe("isWellFormedTailcatAddress", () => {
  it("accepts the shape tailcat listeners produce", () => {
    expect(VALID.length).toBeGreaterThan(100);
    expect(isWellFormedTailcatAddress(VALID)).toBe(true);
  });

  it("rejects every truncation of a valid address", () => {
    for (let len = 2; len < VALID.length; len++) {
      expect(isWellFormedTailcatAddress(VALID.slice(0, len))).toBe(false);
    }
  });

  it("rejects trailing bytes", () => {
    const raw = Buffer.from(VALID.slice(2), "base64url");
    const padded =
      "tc" + Buffer.concat([raw, Buffer.from([0])]).toString("base64url");
    expect(isWellFormedTailcatAddress(padded)).toBe(false);
  });

  it("rejects missing, short or all-zero keys", () => {
    expect(isWellFormedTailcatAddress(encode([P, Q, I]))).toBe(false);
    expect(
      isWellFormedTailcatAddress(encode([P, [...text("k"), 0x41, 7], I])),
    ).toBe(false);
    expect(
      isWellFormedTailcatAddress(encode([P, [...text("k"), ...bytes32(0)], I])),
    ).toBe(false);
  });

  it("requires a region", () => {
    expect(isWellFormedTailcatAddress(encode([P, K, Q]))).toBe(false);
  });

  it("rejects non-map payloads, bad base64 and the wrong prefix", () => {
    expect(isWellFormedTailcatAddress("tc" + "A".repeat(40))).toBe(false);
    expect(
      isWellFormedTailcatAddress(
        "tc" + Buffer.from([0x80]).toString("base64url"),
      ),
    ).toBe(false);
    expect(isWellFormedTailcatAddress("tc!!!!")).toBe(false);
    expect(isWellFormedTailcatAddress("xx" + VALID.slice(2))).toBe(false);
  });

  it("rejects absurd lengths without reading past the buffer", () => {
    // A byte string claiming 4 GiB.
    const huge =
      "tc" +
      Buffer.from([0xa1, ...text("p"), 0x5a, 0xff, 0xff, 0xff, 0xff]).toString(
        "base64url",
      );
    expect(isWellFormedTailcatAddress(huge)).toBe(false);
  });
});

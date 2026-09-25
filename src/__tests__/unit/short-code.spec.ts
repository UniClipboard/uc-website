/**
 * @jest-environment node
 */
import {
  displayCode,
  encodeCodeTicket,
  normalizeCode,
  parseCodeTicket,
} from "@/lib/web-transfer/short-code";

// A structurally valid tailcat address (see tailcat-address.spec.ts).
const text = (s: string) => [0x60 + s.length, ...Buffer.from(s)];
const bytes32 = (fill: number) => [0x58, 32, ...new Array(32).fill(fill)];
const ADDR =
  "tc" +
  Buffer.from([
    0xa4,
    ...text("p"),
    ...bytes32(1),
    ...text("k"),
    ...bytes32(2),
    ...text("q"),
    ...bytes32(3),
    ...text("i"),
    0x18,
    0x2a,
  ]).toString("base64url");
const TOKEN = "A".repeat(22);

describe("normalizeCode", () => {
  it.each([
    ["482913", "482-913"],
    ["482 913", "482-913"],
    ["482-913", "482-913"],
    [" 48 29 13 ", "482-913"],
    ["000001", "000-001"],
    ["４８２９１３", "482-913"],
  ])("accepts %j", (input, expected) => {
    expect(normalizeCode(input)).toBe(expected);
  });

  it.each(["", "48291", "4829134", "48291a", "482_913", "482.913"])(
    "rejects %j",
    (input) => {
      expect(normalizeCode(input)).toBeNull();
    },
  );
});

describe("displayCode", () => {
  it("shows the wire code with a space", () => {
    expect(displayCode("482-913")).toBe("482 913");
  });
});

describe("code tickets", () => {
  it("round-trips a connection ticket", () => {
    const encoded = encodeCodeTicket({ addr: ADDR, token: TOKEN });
    expect(JSON.parse(encoded)).toEqual({
      v: 1,
      kind: "uc-web-try",
      c: ADDR,
      k: TOKEN,
    });
    expect(parseCodeTicket(encoded)).toEqual({ addr: ADDR, token: TOKEN });
  });

  const ticket = (fields: Record<string, unknown>) =>
    JSON.stringify({ v: 1, kind: "uc-web-try", c: ADDR, k: TOKEN, ...fields });

  it.each([
    ["a native ticket", "nodeabc123-native-ticket"],
    ["JSON that is not an object", "[1,2]"],
    ["another kind", ticket({ kind: "uc-native" })],
    ["another version", ticket({ v: 2 })],
    ["a truncated address", ticket({ c: ADDR.slice(0, -4) })],
    ["a short token", ticket({ k: "A".repeat(21) })],
    ["a non-string address", ticket({ c: 42 })],
  ])("rejects %s", (_, raw) => {
    expect(parseCodeTicket(raw)).toBeNull();
  });
});

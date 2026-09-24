/**
 * @jest-environment node
 */
import {
  decodeControl,
  encodeControl,
  encodeFrame,
  FrameDecoder,
  FrameError,
  FrameType,
  HEADER_BYTES,
  MAX_CONTROL_BYTES,
  MAX_DATA_BYTES,
} from "@/lib/web-transfer/frames";

const header = (type: number, length: number) => {
  const h = new Uint8Array(HEADER_BYTES);
  h[0] = type;
  new DataView(h.buffer).setUint32(1, length, false);
  return h;
};

const drain = (decoder: FrameDecoder) => {
  const frames = [];
  for (let f = decoder.next(); f; f = decoder.next()) frames.push(f);
  return frames;
};

describe("FrameDecoder", () => {
  it("round-trips control and data frames split at every byte", () => {
    const hello = encodeControl(FrameType.HELLO, {
      v: 1,
      role: "pull",
      k: "x",
    });
    const data = encodeFrame(FrameType.DATA, new Uint8Array([1, 2, 3]));
    const cancel = encodeFrame(FrameType.CANCEL);
    const wire = new Uint8Array([...hello, ...data, ...cancel]);

    const decoder = new FrameDecoder();
    const frames = [];
    for (const byte of wire) {
      decoder.push(new Uint8Array([byte]));
      frames.push(...drain(decoder));
    }

    expect(frames.map((f) => f.type)).toEqual([
      FrameType.HELLO,
      FrameType.DATA,
      FrameType.CANCEL,
    ]);
    expect(decodeControl(frames[0])).toEqual({ v: 1, role: "pull", k: "x" });
    expect(Array.from(frames[1].payload)).toEqual([1, 2, 3]);
    expect(frames[2].payload.length).toBe(0);
    expect(decoder.pending).toBe(0);
  });

  it("accepts a DATA frame of exactly the maximum length", () => {
    const decoder = new FrameDecoder();
    decoder.push(encodeFrame(FrameType.DATA, new Uint8Array(MAX_DATA_BYTES)));
    expect(decoder.next()?.payload.length).toBe(MAX_DATA_BYTES);
  });

  it("rejects a DATA frame one byte over the maximum from the header alone", () => {
    const decoder = new FrameDecoder();
    decoder.push(header(FrameType.DATA, MAX_DATA_BYTES + 1));
    expect(() => decoder.next()).toThrow(FrameError);
  });

  it("rejects an oversized control frame before its payload arrives", () => {
    const decoder = new FrameDecoder();
    decoder.push(header(FrameType.OFFER, MAX_CONTROL_BYTES + 1));
    expect(() => decoder.next()).toThrow(FrameError);
  });

  it("rejects a huge declared length without allocating it", () => {
    const decoder = new FrameDecoder();
    decoder.push(header(FrameType.DATA, 0xffffffff));
    expect(() => decoder.next()).toThrow(/exceeds limit/);
    expect(decoder.pending).toBe(0);
  });

  it("rejects BUSY and CANCEL frames that carry a payload", () => {
    for (const type of [FrameType.BUSY, FrameType.CANCEL]) {
      const decoder = new FrameDecoder();
      decoder.push(header(type, 1));
      expect(() => decoder.next()).toThrow(FrameError);
    }
  });

  it("rejects unknown frame types", () => {
    for (const type of [0, 9, 255]) {
      const decoder = new FrameDecoder();
      decoder.push(header(type, 0));
      expect(() => decoder.next()).toThrow(/unknown frame type/);
    }
  });

  it("waits on a truncated header or payload instead of guessing", () => {
    const frame = encodeControl(FrameType.END, { transferId: "t" });
    const decoder = new FrameDecoder();
    decoder.push(frame.subarray(0, HEADER_BYTES - 1));
    expect(decoder.next()).toBeNull();
    decoder.push(frame.subarray(HEADER_BYTES - 1, frame.length - 1));
    expect(decoder.next()).toBeNull();
    decoder.push(frame.subarray(frame.length - 1));
    expect(decoder.next()?.type).toBe(FrameType.END);
  });

  it("stays failed after a malformed frame", () => {
    const decoder = new FrameDecoder();
    decoder.push(header(42, 0));
    expect(() => decoder.next()).toThrow(FrameError);
    expect(() => decoder.push(new Uint8Array([1]))).toThrow(FrameError);
    expect(() => decoder.next()).toThrow(FrameError);
  });

  it("refuses to encode an oversized payload", () => {
    expect(() =>
      encodeFrame(FrameType.DATA, new Uint8Array(MAX_DATA_BYTES + 1)),
    ).toThrow(FrameError);
  });
});

describe("decodeControl", () => {
  const frame = (bytes: number[]) => ({
    type: FrameType.ACK,
    payload: new Uint8Array(bytes),
  });

  it("rejects invalid UTF-8", () => {
    expect(() => decodeControl(frame([0xff, 0xfe]))).toThrow(FrameError);
  });

  it("rejects JSON that is not an object", () => {
    const enc = new TextEncoder();
    for (const text of ["[]", "null", "42", '"s"', "{"]) {
      expect(() =>
        decodeControl({ type: FrameType.ACK, payload: enc.encode(text) }),
      ).toThrow(FrameError);
    }
  });
});

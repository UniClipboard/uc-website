/**
 * Lazy loader and thin adapter for the tailcat js/wasm build.
 *
 * The wasm is ~6.6 MB gzipped, so it is fetched only on user intent (Send, or
 * opening a connection link), never prefetched. The assets are built by
 * `scripts/build-tailcat-wasm.sh` from a pinned tailcat commit and served
 * with an immutable cache; bump TAILCAT_BUILD when that script's pin changes.
 */

import type { ByteStream } from "./protocol";
import { parseTailcatAddress } from "./tailcat-address";

const TAILCAT_BUILD = "83921d71";
const WASM_URL = `/tailcat/main.${TAILCAT_BUILD}.wasm.gz`;
const WASM_EXEC_URL = `/tailcat/wasm_exec.${TAILCAT_BUILD}.js`;

/** Public tailcat DERP map; serves `access-control-allow-origin: *`. */
export const DERP_MAP_URL = "https://tailcat.dev/derpmap.json";

type TailcatConn = ByteStream & { closeWrite(): Promise<void> };

type TailcatListener = { addr: string; close(): void };

type GoRuntime = {
  importObject: WebAssembly.Imports;
  run(instance: WebAssembly.Instance): Promise<void>;
};

declare global {
  interface Window {
    Go?: new () => GoRuntime;
    onTailcatReady?: () => void;
    tailcatListen?: (opts: {
      derpMapURL: string;
      privateKey?: string;
      onConnection: (conn: TailcatConn) => void;
    }) => Promise<{ addr: string; privateKeyJSON: string; close(): void }>;
    tailcatDial?: (opts: {
      addr: string;
      derpMapURL?: string;
    }) => Promise<TailcatConn>;
  }
}

export type Tailcat = {
  /** Listens with a fresh ephemeral key; nothing is persisted. */
  listen(onConnection: (stream: ByteStream) => void): Promise<TailcatListener>;
  /** Dials the address; rejects after tailcat's own 60 s connect timeout. */
  dial(addr: string): Promise<ByteStream>;
};

/**
 * Thrown when an address cannot be dialled. Checked in JS before the wasm
 * sees it: the pinned tailcat build spins without yielding when a dial fails
 * immediately (unparseable address, unknown DERP region), freezing the tab.
 */
export class TailcatDialError extends Error {
  constructor() {
    super("address cannot be dialled");
    this.name = "TailcatDialError";
  }
}

let derpRegions: Promise<Set<number>> | null = null;

function knownRegions(): Promise<Set<number>> {
  derpRegions ??= fetch(DERP_MAP_URL)
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then(
      (map: { Regions?: Record<string, unknown> }) =>
        new Set(Object.keys(map.Regions ?? {}).map(Number)),
    )
    .catch((err) => {
      derpRegions = null;
      throw err;
    });
  return derpRegions;
}

export type LoadProgress = (fraction: number | null) => void;

export class TailcatLoadError extends Error {
  constructor(readonly reason: "unsupported" | "network") {
    super(reason);
    this.name = "TailcatLoadError";
  }
}

let loading: Promise<Tailcat> | null = null;
const listeners = new Set<LoadProgress>();
let lastProgress: number | null = null;

function report(fraction: number | null) {
  lastProgress = fraction;
  for (const l of listeners) l(fraction);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new TailcatLoadError("network"));
    document.head.appendChild(script);
  });
}

async function fetchWasm(): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(WASM_URL);
  } catch {
    throw new TailcatLoadError("network");
  }
  if (!res.ok || !res.body) throw new TailcatLoadError("network");
  const total = Number(res.headers.get("Content-Length")) || 0;
  let loaded = 0;
  const counted = res.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        loaded += chunk.byteLength;
        report(total > 0 ? Math.min(1, loaded / total) : null);
        controller.enqueue(chunk);
      },
    }),
  );
  const wasm = counted.pipeThrough(
    new DecompressionStream("gzip") as unknown as ReadableWritablePair<
      Uint8Array,
      Uint8Array
    >,
  );
  return new Response(wasm as ReadableStream<Uint8Array<ArrayBuffer>>, {
    headers: { "Content-Type": "application/wasm" },
  });
}

async function boot(): Promise<Tailcat> {
  if (
    typeof WebAssembly === "undefined" ||
    typeof DecompressionStream === "undefined"
  ) {
    throw new TailcatLoadError("unsupported");
  }
  report(0);
  if (!window.Go) await loadScript(WASM_EXEC_URL);
  if (!window.Go) throw new TailcatLoadError("network");

  const ready = new Promise<void>((resolve) => {
    window.onTailcatReady = resolve;
  });
  const go = new window.Go();
  let instance: WebAssembly.Instance;
  try {
    ({ instance } = await WebAssembly.instantiateStreaming(
      fetchWasm(),
      go.importObject,
    ));
  } catch (err) {
    throw err instanceof TailcatLoadError
      ? err
      : new TailcatLoadError("network");
  }
  // If the Go program exits or panics before signalling readiness, fail the
  // load (so it can be retried) instead of waiting forever.
  const exited = go.run(instance).then(() => {
    throw new TailcatLoadError("network");
  });
  await Promise.race([ready, exited]);
  exited.catch(() => undefined);
  report(1);

  const listenFn = window.tailcatListen!;
  const dialFn = window.tailcatDial!;
  return {
    async listen(onConnection) {
      const ln = await listenFn({
        derpMapURL: DERP_MAP_URL,
        privateKey: "",
        onConnection,
      });
      return { addr: ln.addr, close: () => ln.close() };
    },
    async dial(addr) {
      const info = parseTailcatAddress(addr);
      if (!info) throw new TailcatDialError();
      if (info.regionId !== null) {
        const regions = await knownRegions();
        if (!regions.has(info.regionId)) throw new TailcatDialError();
      }
      return dialFn({ addr, derpMapURL: DERP_MAP_URL });
    },
  };
}

/**
 * Loads tailcat once per page. The Go runtime cannot be started twice, so
 * every caller shares one load; a failed load may be retried.
 */
export function loadTailcat(onProgress?: LoadProgress): Promise<Tailcat> {
  if (onProgress) {
    listeners.add(onProgress);
    onProgress(lastProgress);
  }
  if (!loading) {
    loading = boot().catch((err) => {
      loading = null;
      throw err;
    });
  }
  const done = () => {
    if (onProgress) listeners.delete(onProgress);
  };
  loading.then(done, done);
  return loading;
}

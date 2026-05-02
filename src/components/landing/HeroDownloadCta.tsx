"use client";

import { useEffect, useState } from "react";

import { Link } from "@/i18n/navigation";

type DownloadEntry = {
  platform: string;
  url: string;
};

export type HeroDownloadCtaLabels = {
  primaryGeneric: string;
  primaryWith: string;
  secondaryHow: string;
  otherPlatforms: string;
  arm: string;
  intel: string;
  x64: string;
  linuxX64: string;
  linuxArm: string;
  windows: string;
  mac: string;
};

type Props = {
  downloads: DownloadEntry[];
  labels: HeroDownloadCtaLabels;
};

type Detected = {
  os: "mac" | "win" | "linux";
  arch: "arm64" | "x64";
};

type ResolvedCta = {
  url: string;
  platformLabel: string;
};

interface UADataValues {
  architecture?: string;
  bitness?: string;
}

interface NavigatorUAData {
  getHighEntropyValues?: (hints: string[]) => Promise<UADataValues>;
}

async function detect(): Promise<Detected> {
  if (typeof navigator === "undefined") return { os: "mac", arch: "arm64" };
  const ua = (navigator.userAgent || "").toLowerCase();
  const platform = (navigator.platform || "").toLowerCase();

  let os: Detected["os"] = "mac";
  if (/win/.test(platform) || /windows/.test(ua)) os = "win";
  else if (/linux/.test(platform) || /linux/.test(ua)) os = "linux";
  else os = "mac";

  let arch: Detected["arch"] | null = null;

  const uaData = (navigator as unknown as { userAgentData?: NavigatorUAData })
    .userAgentData;
  if (uaData?.getHighEntropyValues) {
    try {
      const vals = await uaData.getHighEntropyValues([
        "architecture",
        "bitness",
      ]);
      if (vals.architecture === "arm") arch = "arm64";
      else if (vals.architecture === "x86")
        arch = vals.bitness === "64" ? "x64" : "x64";
    } catch {
      arch = null;
    }
  }

  if (arch === null) {
    if (os === "mac") arch = "arm64";
    else arch = "x64";
  }

  return { os, arch };
}

function resolveCta(
  downloads: DownloadEntry[],
  d: Detected,
  labels: HeroDownloadCtaLabels,
): ResolvedCta | null {
  const find = (predicate: (p: string) => boolean) =>
    downloads.find((entry) => predicate(entry.platform));

  if (d.os === "mac") {
    const wantArm = d.arch === "arm64";
    const arm = find((p) => p.startsWith("macOS") && p.includes("ARM64"));
    const intel = find((p) => p.startsWith("macOS") && p.includes("x86_64"));
    const chosen = wantArm ? (arm ?? intel) : (intel ?? arm);
    if (!chosen) return null;
    const archLabel = chosen.platform.includes("ARM64")
      ? labels.arm
      : labels.intel;
    return { url: chosen.url, platformLabel: `${labels.mac} · ${archLabel}` };
  }

  if (d.os === "win") {
    const win = find((p) => p.startsWith("Windows"));
    if (!win) return null;
    return { url: win.url, platformLabel: `${labels.windows} · ${labels.x64}` };
  }

  const linuxArm = find((p) => p.startsWith("Linux") && p.includes("ARM64"));
  const linuxX64 = find(
    (p) => p.startsWith("Linux") && (p.includes("x86_64") || p.includes("x64")),
  );
  const wantArm = d.arch === "arm64";
  const chosen = wantArm ? (linuxArm ?? linuxX64) : (linuxX64 ?? linuxArm);
  if (!chosen) return null;
  const archLabel = chosen.platform.includes("ARM64")
    ? labels.linuxArm
    : labels.linuxX64;
  return { url: chosen.url, platformLabel: archLabel };
}

export function HeroDownloadCta({ downloads, labels }: Props) {
  const [resolved, setResolved] = useState<ResolvedCta | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    detect().then((d) => {
      if (cancelled) return;
      const cta = resolveCta(downloads, d, labels);
      setResolved(cta);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [downloads, labels]);

  const hasMatch = ready && resolved !== null && downloads.length > 0;

  return (
    <div className="flex flex-col items-center gap-3.5">
      <a
        href={hasMatch ? resolved!.url : "#download"}
        className="bg-primary text-primary-foreground inline-flex items-center rounded-[8px] px-[18px] py-[10px] text-[13.5px] font-medium transition-transform hover:-translate-y-[1px]"
      >
        <span suppressHydrationWarning>
          {hasMatch
            ? `${labels.primaryWith} ${resolved!.platformLabel}`
            : labels.primaryGeneric}
        </span>
      </a>

      <div
        className="text-muted-foreground flex items-center gap-2.5"
        style={{ fontSize: 12.5 }}
      >
        <a
          href="#download"
          className="hover:text-foreground underline-offset-4 transition-colors hover:underline"
        >
          {labels.otherPlatforms}
        </a>
        <span className="text-muted2" aria-hidden>
          ·
        </span>
        <Link
          href="/whitepaper"
          className="hover:text-foreground underline-offset-4 transition-colors hover:underline"
        >
          {labels.secondaryHow}
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

type DetectedTarget = "ios" | "android" | "default";

type Props = {
  defaultLabel: string;
  defaultHref: string;
  iosLabel: string;
  iosHref: string;
  androidLabel: string;
  androidUrl: string;
};

function detectTarget(): DetectedTarget {
  if (typeof navigator === "undefined") return "default";
  const ua = (navigator.userAgent || "").toLowerCase();
  const plat = (navigator.platform || "").toLowerCase();
  if (/iphone|ipad|ipod/.test(ua) || /iphone|ipad|ipod/.test(plat))
    return "ios";
  if (/android/.test(ua)) return "android";
  return "default";
}

export function HeroMobileCta({
  defaultLabel,
  defaultHref,
  iosLabel,
  iosHref,
  androidLabel,
  androidUrl,
}: Props) {
  const [target, setTarget] = useState<DetectedTarget>("default");

  useEffect(() => {
    setTarget(detectTarget());
  }, []);

  let label = defaultLabel;
  let href = defaultHref;
  let external = false;

  if (target === "ios") {
    label = iosLabel;
    href = iosHref;
  } else if (target === "android") {
    label = androidLabel;
    href = androidUrl;
    external = true;
  }

  const baseClass =
    "bg-primary text-primary-foreground mb-5 flex w-full items-center justify-center rounded-[10px] px-5 py-3.5 text-[15px] font-medium transition-colors hover:bg-primary/90";

  return (
    <a
      href={href}
      aria-label={label}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={baseClass}
    >
      <span suppressHydrationWarning>{label}</span>
    </a>
  );
}

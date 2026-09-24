"use client";

import { useMemo } from "react";
import { encode } from "uqr";

type Props = { value: string; label: string };

/** A scannable QR code rendered as one SVG path, dark on white. */
export function QrCode({ value, label }: Props) {
  const { size, path } = useMemo(() => {
    const { size, data } = encode(value, { ecc: "L", border: 2 });
    let d = "";
    data.forEach((row, y) =>
      row.forEach((on, x) => {
        if (on) d += `M${x} ${y}h1v1h-1z`;
      }),
    );
    return { size, path: d };
  }, [value]);

  return (
    <svg
      className="try-qr"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <path d={path} fill="#0a0a0a" />
    </svg>
  );
}

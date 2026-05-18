type GlyphProps = { size?: number };

export function GlyphMac({ size = 14 }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export function GlyphWin({ size = 14 }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 4.5l8-1.1V11H3V4.5zm9-1.2l9-1.3V11h-9V3.3zM3 12h8v7.6L3 18.5V12zm9 0h9v9.5l-9-1.3V12z" />
    </svg>
  );
}

export function GlyphLinux({ size = 14 }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C9 2 8 4 8 7c0 .9 0 2-.5 3-.6 1-1.5 1.8-1.5 3 0 .8.4 1.5 1 2-.7.5-2 1.5-2 3 0 1.5 1 2 1 3 0 1.5-1 2-1 3h13c0-1-1-1.5-1-3 0-1 1-1.5 1-3 0-1.5-1.3-2.5-2-3 .6-.5 1-1.2 1-2 0-1.2-.9-2-1.5-3-.5-1-.5-2.1-.5-3 0-3-1-5-4-5z" />
    </svg>
  );
}

export function GlyphIos({ size = 14 }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.5 2.5h9A2.5 2.5 0 0 1 19 5v14a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 19V5a2.5 2.5 0 0 1 2.5-2.5zm0 1.5C6.67 4 6 4.67 6 5.5V19c0 .83.67 1.5 1.5 1.5h9c.83 0 1.5-.67 1.5-1.5V5.5c0-.83-.67-1.5-1.5-1.5h-1.7a.5.5 0 0 0-.46.32l-.18.49a.6.6 0 0 1-.56.39h-3.2a.6.6 0 0 1-.56-.39l-.18-.49A.5.5 0 0 0 9.2 4H7.5zM12 18.4a.95.95 0 1 1 0-1.9.95.95 0 0 1 0 1.9z" />
    </svg>
  );
}

export function GlyphAndroid({ size = 14 }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.7 9.2 5.3 6.85a.4.4 0 1 1 .69-.4l1.43 2.4A7.4 7.4 0 0 1 12 7.95a7.4 7.4 0 0 1 4.58.9l1.43-2.4a.4.4 0 1 1 .69.4L17.3 9.2A6.8 6.8 0 0 1 20 14.5H4a6.8 6.8 0 0 1 2.7-5.3zM9 12.5a.85.85 0 1 0 0-1.7.85.85 0 0 0 0 1.7zm6 0a.85.85 0 1 0 0-1.7.85.85 0 0 0 0 1.7zM4 15.5h16v3.25A1.75 1.75 0 0 1 18.25 20.5h-.5v1.6a.9.9 0 1 1-1.8 0v-1.6h-7.9v1.6a.9.9 0 1 1-1.8 0v-1.6h-.5A1.75 1.75 0 0 1 4 18.75V15.5z" />
    </svg>
  );
}

export type PlatformOS = "mac" | "win" | "linux" | "ios" | "android";

export function PlatformGlyph({ os, size }: { os: PlatformOS; size?: number }) {
  if (os === "mac") return <GlyphMac size={size} />;
  if (os === "win") return <GlyphWin size={size} />;
  if (os === "linux") return <GlyphLinux size={size} />;
  if (os === "ios") return <GlyphIos size={size} />;
  return <GlyphAndroid size={size} />;
}

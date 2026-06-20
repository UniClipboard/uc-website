import { monogramFor } from "@/lib/sponsors";

type MonogramProps = {
  name: string;
  size?: number;
  className?: string;
};

/** Initials avatar with a deterministic tint — used on the sponsor wall. */
export function Monogram({ name, size = 44, className }: MonogramProps) {
  const { initials, bg, fg } = monogramFor(name);
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-flex",
        flex: "none",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "9999px",
        background: bg,
        color: fg,
        fontSize: size * 0.4,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        lineHeight: 1,
      }}
    >
      {initials}
    </span>
  );
}

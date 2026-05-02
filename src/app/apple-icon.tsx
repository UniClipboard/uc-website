import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#266A4A",
        borderRadius: 40,
      }}
    >
      <svg
        width="110"
        height="110"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"
          fill="white"
        />
      </svg>
    </div>,
    { ...size },
  );
}

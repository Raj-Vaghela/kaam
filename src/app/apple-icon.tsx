import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: 180,
                    height: 180,
                    borderRadius: 40,
                    background: "#134048",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#e8b547",
                    fontSize: 110,
                    fontWeight: 700,
                    fontFamily: "serif",
                    letterSpacing: "-2px",
                }}
            >
                G
            </div>
        ),
        { ...size }
    );
}

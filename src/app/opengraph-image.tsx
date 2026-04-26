import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GajjuExpress — Home-grown flavours, delivered with love";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: "#0d4a4a",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "80px",
                }}
            >
                <div
                    style={{
                        fontSize: 72,
                        fontWeight: 700,
                        color: "white",
                        marginBottom: 24,
                    }}
                >
                    GajjuExpress
                </div>
                <div
                    style={{
                        fontSize: 36,
                        color: "#f5c842",
                        marginBottom: 16,
                    }}
                >
                    Home-grown flavours, delivered with love.
                </div>
                <div
                    style={{
                        fontSize: 24,
                        color: "rgba(255,255,255,0.7)",
                        textAlign: "center",
                        maxWidth: 700,
                    }}
                >
                    Authentic Indian &amp; Gujarati groceries — sourced with care, delivered to
                    your door.
                </div>
            </div>
        ),
        { ...size }
    );
}

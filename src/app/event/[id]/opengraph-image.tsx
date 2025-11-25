import { ImageResponse } from "next/og";
import { getEventHistoryBySlugOrId } from "@/lib/db";
import { absoluteUrl } from "@/lib/absolute-url";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Helper to truncate text to fit within max length
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export default async function OgImage(props: {
  params: Promise<{ id: string }> | { id: string };
}) {
  try {
    const awaitedParams = await (props as any).params;
    const row = await getEventHistoryBySlugOrId({ value: awaitedParams.id });
    const data: any = row?.data || {};

    const title =
      (typeof data?.title === "string" && data.title) ||
      row?.title ||
      "Envitefy Event";

    // Extract description if available
    const description =
      typeof data?.description === "string" && data.description
        ? truncateText(data.description, 120)
        : null;

    // Extract location if available
    const location =
      typeof data?.location === "string" && data.location
        ? truncateText(data.location, 80)
        : null;

    // Always use the default OG image
    const bg = await absoluteUrl("/og-default.jpg");

    return new ImageResponse(
      (
        <div
          style={{
            width: size.width,
            height: size.height,
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-start",
            fontFamily: "system-ui, -apple-system, sans-serif",
            background: "#0b0b0f",
          }}
        >
          {/* Background Image */}
          <img
            src={bg}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Gradient Overlay - stronger at bottom for text readability */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.75) 100%)",
            }}
          />

          {/* Content Container */}
          <div
            style={{
              position: "relative",
              width: "100%",
              padding: "48px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Title */}
            <div
              style={{
                color: "#ffffff",
                fontSize: title.length > 50 ? 56 : 72,
                fontWeight: 800,
                lineHeight: 1.1,
                textShadow:
                  "0 2px 12px rgba(0,0,0,0.8), 0 0 24px rgba(0,0,0,0.4)",
                letterSpacing: "-0.02em",
              }}
            >
              {truncateText(title, 80)}
            </div>

            {/* Description (if available) */}
            {description && (
              <div
                style={{
                  color: "#f0f0f0",
                  fontSize: 28,
                  fontWeight: 400,
                  lineHeight: 1.4,
                  textShadow: "0 1px 8px rgba(0,0,0,0.8)",
                  maxWidth: "90%",
                  opacity: 0.95,
                }}
              >
                {description}
              </div>
            )}

            {/* Location (if available and no description) */}
            {!description && location && (
              <div
                style={{
                  color: "#e0e0e0",
                  fontSize: 24,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  textShadow: "0 1px 8px rgba(0,0,0,0.8)",
                  opacity: 0.9,
                }}
              >
                📍 {location}
              </div>
            )}

            {/* Branding */}
            <div
              style={{
                marginTop: "auto",
                paddingTop: "24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  color: "#ffffff",
                  fontSize: 20,
                  fontWeight: 600,
                  textShadow: "0 1px 6px rgba(0,0,0,0.8)",
                  opacity: 0.9,
                }}
              >
                Envitefy
              </div>
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        // Ensure fonts are loaded
        fonts: [],
      }
    );
  } catch (error) {
    // Fallback to simple error image
    console.error("OG Image generation error:", error);
    return new ImageResponse(
      (
        <div
          style={{
            width: size.width,
            height: size.height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0b0b0f",
            color: "#ffffff",
            fontSize: 48,
            fontFamily: "system-ui",
          }}
        >
          Envitefy Event
        </div>
      ),
      size
    );
  }
}

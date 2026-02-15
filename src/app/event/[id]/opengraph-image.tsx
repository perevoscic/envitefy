import { ImageResponse } from "next/og";

/** Base URL for same-origin API calls (keeps db out of this bundle). */
function getBaseUrl(): string {
  const v = process.env.VERCEL_URL;
  if (v) return `https://${v}`;
  return (
    process.env.APP_URL || process.env.NEXTAUTH_URL || "https://envitefy.com"
  );
}

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Helper to truncate text to fit within max length
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

// Helper to load a font for ImageResponse
async function loadFont(): Promise<{
  name: string;
  data: ArrayBuffer;
  style: "normal";
  weight: 400 | 600 | 700 | 800;
} | null> {
  try {
    // Try to load Inter font from Google Fonts
    const fontResponse = await fetch(
      "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
      { cache: "force-cache" }
    );
    if (fontResponse.ok) {
      const fontData = await fontResponse.arrayBuffer();
      return {
        name: "Inter",
        data: fontData,
        style: "normal" as const,
        weight: 400 as const,
      };
    }
  } catch (error) {
    console.warn("Failed to load Inter font, using system font fallback");
  }
  // Fallback: return null to use system fonts (may not work, but worth trying)
  return null;
}

// Helper to load image as base64 data URL
async function loadImageAsDataUrl(imagePath: string): Promise<string> {
  try {
    const url = `${getBaseUrl()}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const mimeType = response.headers.get("content-type") || "image/jpeg";
    let binary = "";
    const bytes = new Uint8Array(arrayBuffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error("Failed to load OG image URL:", {
      error: error instanceof Error ? error.message : String(error),
      imagePath,
    });
    // Return a solid color as fallback
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  }
}

export default async function OgImage(props: {
  params: Promise<{ id: string }> | { id: string };
}) {
  try {
    const awaitedParams = await (props as any).params;
    if (!awaitedParams?.id) {
      throw new Error("Missing event ID");
    }

    const apiUrl = `${getBaseUrl()}/api/events/${encodeURIComponent(awaitedParams.id)}/og-data`;
    let ogData: {
      title?: string;
      description?: string | null;
      location?: string | null;
      thumbnail?: string | null;
      attachmentDataUrl?: string | null;
    } | null = null;
    try {
      const res = await fetch(apiUrl, { cache: "no-store" });
      if (res.ok) ogData = await res.json();
    } catch (fetchError) {
      console.error("OG data fetch error:", fetchError);
    }

    if (!ogData) {
      // Event not found - return default image
      const defaultBg = await loadImageAsDataUrl("/og-default.jpg");
      const font = await loadFont();
      const fonts = font ? [font] : [];
      return new ImageResponse(
        (
          <div
            style={{
              width: size.width,
              height: size.height,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: font
                ? "Inter"
                : "system-ui, -apple-system, sans-serif",
            }}
          >
            <img
              src={defaultBg}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "relative",
                color: "#ffffff",
                fontSize: 48,
                fontWeight: 800,
                textShadow: "0 2px 8px rgba(0,0,0,0.8)",
              }}
            >
              Envitefy Event
            </div>
          </div>
        ),
        size
      );
    }

    const title = ogData.title ?? "Envitefy Event";

    // Extract description if available
    const description = ogData.description
      ? truncateText(ogData.description, 120)
      : null;

    // Extract location if available
    const location = ogData.location ? truncateText(ogData.location, 80) : null;

    // Use event's header image (thumbnail) if available, otherwise fall back to default
    let bg: string;
    if (ogData.thumbnail) {
      bg = ogData.thumbnail;
    } else if (ogData.attachmentDataUrl) {
      bg = ogData.attachmentDataUrl;
    } else {
      // Final fallback: use default OG image
      bg = await loadImageAsDataUrl("/og-default.jpg");
    }

    // Load font for ImageResponse
    const font = await loadFont();
    const fonts = font ? [font] : [];

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
            fontFamily: font ? "Inter" : "system-ui, -apple-system, sans-serif",
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
        fonts,
      }
    );
  } catch (error) {
    // Fallback to simple error image
    console.error("OG Image generation error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      eventId: (props as any).params ? "available" : "missing",
    });

    try {
      const font = await loadFont();
      const fonts = font ? [font] : [];
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
              fontFamily: font ? "Inter" : "system-ui",
            }}
          >
            Envitefy Event
          </div>
        ),
        {
          ...size,
          fonts,
        }
      );
    } catch (fallbackError) {
      console.error("Fallback ImageResponse also failed:", fallbackError);
      throw fallbackError;
    }
  }
}

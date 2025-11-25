import { ImageResponse } from "next/og";
import { getEventHistoryBySlugOrId } from "@/lib/db";
import { absoluteUrl } from "@/lib/absolute-url";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
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
    // Try to read from public folder
    const publicPath = join(
      process.cwd(),
      "public",
      imagePath.replace(/^\//, "")
    );
    const imageBuffer = await readFile(publicPath);
    const base64 = imageBuffer.toString("base64");
    const mimeType =
      imagePath.endsWith(".jpg") || imagePath.endsWith(".jpeg")
        ? "image/jpeg"
        : imagePath.endsWith(".png")
        ? "image/png"
        : "image/jpeg";
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    // Fallback: try to fetch from absolute URL
    try {
      const absoluteImgUrl = await absoluteUrl(imagePath);
      const response = await fetch(absoluteImgUrl, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = response.headers.get("content-type") || "image/jpeg";
      return `data:${mimeType};base64,${base64}`;
    } catch (fetchError) {
      console.error("Failed to load OG image from file and URL:", {
        fileError: error instanceof Error ? error.message : String(error),
        fetchError:
          fetchError instanceof Error ? fetchError.message : String(fetchError),
        imagePath,
      });
      // Return a solid color as fallback
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    }
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

    let row;
    try {
      row = await getEventHistoryBySlugOrId({ value: awaitedParams.id });
    } catch (dbError) {
      console.error("Database error in OG image:", dbError);
      throw new Error("Failed to load event data");
    }

    if (!row) {
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

    // Use event's header image (thumbnail) if available, otherwise fall back to default
    let bg: string;
    const hasThumbnail =
      typeof data?.thumbnail === "string" &&
      data.thumbnail.length > 0 &&
      data.thumbnail.startsWith("data:image");
    const hasAttachment =
      data?.attachment &&
      typeof data.attachment === "object" &&
      typeof data.attachment.dataUrl === "string" &&
      data.attachment.dataUrl.length > 0 &&
      data.attachment.dataUrl.startsWith("data:image");

    // Debug logging
    console.log("OG Image - Thumbnail check:", {
      hasThumbnail,
      hasAttachment,
      thumbnailLength: hasThumbnail ? data.thumbnail.length : 0,
      attachmentLength: hasAttachment ? data.attachment.dataUrl.length : 0,
      eventId: awaitedParams.id,
    });

    // Use event thumbnail/attachment if available, otherwise use default
    // ImageResponse supports data URLs directly in img src
    if (hasThumbnail) {
      bg = data.thumbnail;
    } else if (hasAttachment) {
      bg = data.attachment.dataUrl;
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
      // If even the fallback fails, return a minimal response
      console.error("Fallback ImageResponse also failed:", fallbackError);
      // Return a simple 1x1 PNG as last resort
      const minimalPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );
      return new Response(minimalPng, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
        },
      });
    }
  }
}

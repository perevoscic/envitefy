import { ImageResponse } from "next/og";
import { getEventHistoryBySlugOrId } from "@/lib/db";
import { absoluteUrl } from "@/lib/absolute-url";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: { id: string } }) {
  const row = await getEventHistoryBySlugOrId({ value: params.id });
  const data: any = row?.data || {};
  const title =
    (typeof data?.title === "string" && data.title) ||
    row?.title ||
    "Envitefy Event";

  const hasThumb =
    typeof data?.thumbnail === "string" && data.thumbnail.length > 0;
  const bg = hasThumb
    ? data.thumbnail
    : await absoluteUrl("/og-default-v2.jpg");

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
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={bg}
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
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            color: "#fff",
            padding: "36px 48px",
            width: "100%",
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          {title}
        </div>
      </div>
    ),
    size
  );
}

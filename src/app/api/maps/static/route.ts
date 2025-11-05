import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || searchParams.get("query") || "").trim();
  const zoom = Math.max(1, Math.min(21, Number(searchParams.get("zoom") || 14)));
  const width = Math.max(64, Math.min(2048, Number(searchParams.get("width") || 640)));
  const height = Math.max(64, Math.min(2048, Number(searchParams.get("height") || 640)));

  if (!q) {
    return new Response("Missing q", { status: 400 });
  }

  const key =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_STATIC_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_STATIC_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    "";

  if (!key) {
    // Graceful 204 so callers can decide to render a clickable fallback
    return new Response(null, { status: 204 });
  }

  const encoded = encodeURIComponent(q);
  const url = `https://maps.googleapis.com/maps/api/staticmap?key=${key}&center=${encoded}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap&markers=size:mid|color:red|${encoded}`;

  try {
    const res = await fetch(url, { headers: { Accept: "image/png,image/jpeg,*/*" } });
    if (!res.ok) {
      return new Response(`Upstream error ${res.status}`, { status: 502 });
    }
    const buf = await res.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    return new Response("Fetch error", { status: 502 });
  }
}



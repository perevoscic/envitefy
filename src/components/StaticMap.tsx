"use client";

type StaticMapProps = {
  address: string;
  width?: number; // css pixels; actual image uses 2x scale for retina
  height?: number;
  zoom?: number;
  className?: string;
};

export default function StaticMap({
  address,
  width = 640,
  height = 640,
  zoom = 14,
  className = "",
}: StaticMapProps) {
  const key =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_STATIC_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "";

  const query = encodeURIComponent((address || "").trim());
  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  if (!key) {
    // Fallback clickable area to open Google Maps when key is not configured
    return (
      <a
        href={searchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`rounded-lg grid place-items-center h-64 ${className}`}
      ></a>
    );
  }

  // Static Maps endpoint (image). We request scale=2 for crisp retina rendering
  const src = `https://maps.googleapis.com/maps/api/staticmap?key=${key}&center=${query}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap&markers=size:mid|color:red|${query}`;

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <img
        src={src}
        alt="Map preview"
        width={width}
        height={height}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
      <div className="p-2 bg-muted/50 text-center">
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-4"
            aria-hidden="true"
          >
            <path d="M13,24h-2v-7c0-2.8-2.1-5-4.8-5H3.7l3.2,3.3l-1.4,1.4L0,11l5.5-5.7l1.4,1.4L3.7,10h2.5c1.9,0,3.6,0.8,4.8,2.1V12 c0-3.9,3-7,6.8-7h2.5l-3.2-3.3l1.4-1.4L24,6l-5.5,5.7l-1.4-1.4L20.3,7h-2.5C15.1,7,13,9.2,13,12V24z" />
          </svg>
          <span>Directions</span>
        </a>
      </div>
    </div>
  );
}

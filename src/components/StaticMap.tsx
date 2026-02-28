"use client";

import { useState } from "react";

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
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const query = encodeURIComponent((address || "").trim());
  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  // Use internal proxy to avoid client-side blockers/CSP
  const src = `/api/maps/static?q=${query}&zoom=${zoom}&width=${width}&height=${height}`;
  const embedSrc = `https://www.google.com/maps?q=${query}&output=embed`;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#ddd5ff] bg-white shadow-[0_14px_32px_rgba(79,58,134,0.12)] ${className}`}
    >
      {useIframeFallback ? (
        <iframe
          src={embedSrc}
          title="Map preview"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full border-0"
          style={{ height: `${Math.min(height, 420)}px`, display: "block" }}
        />
      ) : (
        <img
          src={src}
          alt="Map preview"
          width={width}
          height={height}
          style={{ width: "100%", height: "auto", display: "block" }}
          onError={() => setUseIframeFallback(true)}
        />
      )}
      <div className="border-t border-[#ece3ff] bg-gradient-to-r from-[#fbf8ff] to-[#f3efff] p-2.5 text-center">
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-medium text-[#4f3f7a] transition hover:text-[#2f2550]"
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

"use client";

import { useEffect, useRef, useState } from "react";
import { drawCardText } from "@/lib/shared-card-canvas";
import { type CardTextSource, sharedCardContent } from "@/lib/shared-card-design";

export default function SharedCardTextLayer({ source }: { source: CardTextSource }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  const contentKey = JSON.stringify(source);
  const content = sharedCardContent(source);
  useEffect(() => {
    let active = true;
    const snapshot = JSON.parse(contentKey) as CardTextSource;
    const temporary = document.createElement("canvas");
    setError("");
    void drawCardText(
      temporary,
      snapshot,
      snapshot.eventDetails?.product === "digital_flyer" ? "digital_flyer" : "live_card",
    )
      .then((layout) => {
        if (!active || !ref.current) return;
        ref.current.width = temporary.width;
        ref.current.height = temporary.height;
        ref.current.getContext("2d")?.drawImage(temporary, 0, 0);
        setError(layout.overflow ? "The event details do not fit this invitation." : "");
      })
      .catch(() => {
        if (active) setError("The lettering could not load. Please refresh before downloading.");
      });
    return () => {
      active = false;
    };
  }, [contentKey]);
  return (
    <>
      <canvas
        ref={ref}
        data-shared-card-text
        className="pointer-events-none absolute inset-0 h-full w-full"
        role="img"
        aria-label={[
          content.intro,
          content.title,
          ...(source.eventDetails?.product === "digital_flyer" ? content.paragraphs : []),
        ]
          .filter(Boolean)
          .join(". ")}
      />
      {error && (
        <p
          role="alert"
          className="absolute inset-x-3 top-3 z-30 rounded-lg bg-white p-3 text-xs text-rose-800"
        >
          {error}
        </p>
      )}
    </>
  );
}

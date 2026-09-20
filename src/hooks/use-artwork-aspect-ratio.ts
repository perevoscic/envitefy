"use client";

import { useEffect, useState } from "react";

/** Use the original composition, including uploads with nonstandard dimensions. */
export function useArtworkAspectRatio(imageUrl: string | null | undefined, fallback: number) {
  const [loaded, setLoaded] = useState<{ url: string; ratio: number } | null>(null);

  useEffect(() => {
    if (!imageUrl) return;
    const image = new Image();
    const readDimensions = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        setLoaded({ url: imageUrl, ratio: image.naturalWidth / image.naturalHeight });
      }
    };
    image.addEventListener("load", readDimensions);
    image.src = imageUrl;
    if (image.complete) readDimensions();
    return () => image.removeEventListener("load", readDimensions);
  }, [imageUrl]);

  return loaded && loaded.url === imageUrl ? loaded.ratio : fallback;
}

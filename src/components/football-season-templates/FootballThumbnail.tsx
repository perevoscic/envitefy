"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { TemplateThumbnailPreview } from "@/components/events/TemplateThumbnail";
import { chooseThumbnailCaption } from "@/lib/thumbnail-caption";
import styles from "./football-thumbnail.module.css";
import { getFootballDesign } from "./footballDesigns";
import { getGymMeetTitleTypography } from "./titleTypography";
import type { GymMeetPageTemplateMeta } from "./types";

// Keep the ball and the faces in view when landscape artwork fills a masonry card.
const focalPositions: Partial<Record<GymMeetPageTemplateMeta["id"], string>> = {
  "launchpad-editorial": "50% 68%",
  "parent-command": "56% 44%",
  "elite-athlete": "50% 32%",
  "womens-gridiron": "50% 15%",
  "mountain-league": "24% 60%",
  "desert-gridiron": "35% 60%",
  "city-league": "30% 60%",
};

export default function FootballThumbnail({
  design,
  compact = false,
}: {
  design: GymMeetPageTemplateMeta;
  compact?: boolean;
}) {
  const artwork = getFootballDesign(design.id);
  const imageRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const [caption, setCaption] = useState<ReturnType<typeof chooseThumbnailCaption> | null>(null);
  const objectPosition = focalPositions[design.id] ?? "50% 50%";

  const updateCaption = useCallback(() => {
    const image = imageRef.current;
    const title = titleRef.current;
    if (!image?.complete || !image.naturalWidth || !title) return;
    const imageBox = image.getBoundingClientRect();
    const titleBox = title.getBoundingClientRect();
    if (!imageBox.width || !titleBox.width || !titleBox.height) return;

    // Reuse the loaded image and its actual object-cover crop to compare
    // possible title positions without another image request.
    const scale = Math.max(
      imageBox.width / image.naturalWidth,
      imageBox.height / image.naturalHeight,
    );
    const [x, y] = objectPosition.split(" ").map((value) => Number.parseFloat(value) / 100);
    const sourceX = ((image.naturalWidth * scale - imageBox.width) * x) / scale;
    const sourceY = ((image.naturalHeight * scale - imageBox.height) * y) / scale;
    const canvas = document.createElement("canvas");
    const sampleScale = 128 / Math.max(imageBox.width, imageBox.height);
    canvas.width = Math.max(1, Math.round(imageBox.width * sampleScale));
    canvas.height = Math.max(1, Math.round(imageBox.height * sampleScale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    try {
      context.drawImage(
        image,
        sourceX,
        sourceY,
        imageBox.width / scale,
        imageBox.height / scale,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const next = chooseThumbnailCaption({
        pixels,
        width: canvas.width,
        height: canvas.height,
        captionWidth: (titleBox.width / imageBox.width) * canvas.width,
        captionHeight: (titleBox.height / imageBox.height) * canvas.height,
        preferredInk: artwork.ink,
        centered: artwork.layout === "poster",
      });
      setCaption((current) =>
        current?.left === next.left && current?.top === next.top && current?.ink === next.ink
          ? current
          : next,
      );
    } catch {
      // A restricted or unavailable image retains its design's original ink.
      setCaption(null);
    }
  }, [artwork.ink, artwork.layout, objectPosition]);

  useEffect(() => {
    updateCaption();
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateCaption);
    if (titleRef.current) observer?.observe(titleRef.current);
    if (imageRef.current) observer?.observe(imageRef.current);
    return () => observer?.disconnect();
  }, [updateCaption]);

  return (
    <TemplateThumbnailPreview scaled={false} style={{ containerType: "inline-size" }}>
      <div
        data-football-thumbnail={artwork.layout}
        data-compact={compact || undefined}
        className={`${styles.artwork} ${artwork.headerClass}`}
        style={{ color: caption?.ink ?? artwork.ink }}
      >
        <div className={styles.caption} data-caption-position={caption?.position}>
          <p
            ref={titleRef}
            className={styles.title}
            style={getGymMeetTitleTypography(design.id).fontStyle}
          >
            {design.name}
          </p>
        </div>
        <div className={styles.media}>
          <Image
            ref={imageRef}
            src={artwork.hero}
            alt=""
            fill
            sizes={compact ? "(max-width: 639px) 45vw, 180px" : "(max-width: 639px) 45vw, 25vw"}
            className="object-cover"
            style={{ objectPosition }}
            onLoad={updateCaption}
          />
        </div>
      </div>
    </TemplateThumbnailPreview>
  );
}

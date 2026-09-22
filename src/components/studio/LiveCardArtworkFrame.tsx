"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { liveCardArtworkFit } from "@/lib/live-card-artwork-layout";
import styles from "./LiveCardArtworkFrame.module.css";

type LiveCardArtworkFrameProps = {
  imageUrl: string;
  className?: string;
  aspectRatio?: number;
  sharedDesign?: boolean;
  children: ReactNode;
};

export default function LiveCardArtworkFrame({
  imageUrl,
  className = "",
  aspectRatio,
  sharedDesign,
  children,
}: LiveCardArtworkFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameRatio, setFrameRatio] = useState(0);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const { width, height } = frame.getBoundingClientRect();
      setFrameRatio(height > 0 ? width / height : 0);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);
  const style = {
    aspectRatio,
    "--live-card-image-fit": liveCardArtworkFit(aspectRatio || 0, frameRatio),
    "--live-card-artwork": `url(${JSON.stringify(imageUrl)})`,
    height: "var(--artwork-preview-height, auto)",
    width: "var(--artwork-preview-width, 100%)",
  } as CSSProperties;

  return (
    <div ref={frameRef} data-live-card-artwork data-shared-card-artwork={sharedDesign || undefined} className={`${styles.frame} ${className}`} style={style}>
      <span aria-hidden="true" className={styles.glow} />
      <span aria-hidden="true" className={styles.border}>
        <span className={styles.borderColors} />
      </span>
      <div className={styles.content}>{children}</div>
    </div>
  );
}

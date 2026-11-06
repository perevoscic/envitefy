import type { ReactNode } from "react";
import MarketingMotion from "./MarketingMotion";
import styles from "./marketing.module.css";

export type MarketingTone = "celebration" | "sports" | "product";

export default function MarketingPage({
  children,
  className = "",
  tone = "celebration",
  canvas = "app",
}: {
  children: ReactNode;
  className?: string;
  tone?: MarketingTone;
  canvas?: "app" | "editorial";
}) {
  return (
    <div className={`${styles.page} ${canvas === "app" ? styles.appCanvas : styles.editorialCanvas} ${className}`} data-marketing-page data-marketing-tone={tone} data-marketing-canvas={canvas}>
      <MarketingMotion />
      {children}
    </div>
  );
}

import type { ReactNode } from "react";
import MarketingMotion from "./MarketingMotion";
import styles from "./marketing.module.css";

export type MarketingTone = "celebration" | "sports" | "product";

export default function MarketingPage({
  children,
  className = "",
  tone = "celebration",
}: {
  children: ReactNode;
  className?: string;
  tone?: MarketingTone;
}) {
  return (
    <div className={`${styles.page} ${className}`} data-marketing-page data-marketing-tone={tone}>
      <MarketingMotion />
      {children}
    </div>
  );
}

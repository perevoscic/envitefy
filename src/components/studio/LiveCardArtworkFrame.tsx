import type { CSSProperties, ReactNode } from "react";
import styles from "./LiveCardArtworkFrame.module.css";

type LiveCardArtworkFrameProps = {
  imageUrl: string;
  className?: string;
  children: ReactNode;
};

export default function LiveCardArtworkFrame({
  imageUrl,
  className = "",
  children,
}: LiveCardArtworkFrameProps) {
  const style = {
    "--live-card-artwork": `url(${JSON.stringify(imageUrl)})`,
  } as CSSProperties;

  return (
    <div data-live-card-artwork className={`${styles.frame} ${className}`} style={style}>
      <span aria-hidden="true" className={styles.glow} />
      <span aria-hidden="true" className={styles.border}>
        <span className={styles.borderColors} />
      </span>
      <div className={styles.content}>{children}</div>
    </div>
  );
}

import Image, { type ImageProps } from "next/image";
import styles from "./brand-appearance.module.css";

type EnvitefyBrandImageProps = ImageProps & {
  whiteSrc: ImageProps["src"];
  preparedSrcSet?: string;
  whitePreparedSrcSet?: string;
};

/** CSS selects appearance before hydration; small, prepared brand assets load directly. */
export default function EnvitefyBrandImage({
  src,
  whiteSrc,
  alt,
  className = "",
  unoptimized = true,
  preparedSrcSet,
  whitePreparedSrcSet,
  ...props
}: EnvitefyBrandImageProps) {
  const accessibleName = alt ? { role: "img" as const, "aria-label": alt } : {};
  if (preparedSrcSet && whitePreparedSrcSet && typeof src === "string" && typeof whiteSrc === "string") {
    // Prepared static srcsets keep direct brand delivery and let the browser
    // choose the right size without an image-optimizer round trip.
    const { width, height, sizes, style, priority, loading, fetchPriority, onLoad, onError } = props;
    const imageProps = {
      width, height, sizes, style, onLoad, onError,
      decoding: "async" as const,
      loading: priority ? "eager" as const : loading ?? "lazy" as const,
      fetchPriority: fetchPriority ?? (priority ? "high" as const : undefined),
    };
    return (
      <span className={styles.imageSwitch} {...accessibleName}>
        <img {...imageProps} src={src} srcSet={preparedSrcSet} alt="" aria-hidden="true" className={`${styles.colorImage} ${className}`} />
        <img {...imageProps} src={whiteSrc} srcSet={whitePreparedSrcSet} alt="" aria-hidden="true" className={`${styles.whiteImage} ${className}`} />
      </span>
    );
  }
  return (
    <span className={styles.imageSwitch} {...accessibleName}>
      <Image {...props} unoptimized={unoptimized} src={src} alt="" aria-hidden="true" className={`${styles.colorImage} ${className}`} />
      <Image {...props} unoptimized={unoptimized} src={whiteSrc} alt="" aria-hidden="true" className={`${styles.whiteImage} ${className}`} />
    </span>
  );
}

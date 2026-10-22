import Image, { type ImageProps } from "next/image";
import styles from "./brand-appearance.module.css";

type EnvitefyBrandImageProps = ImageProps & {
  whiteSrc: ImageProps["src"];
};

/** CSS selects appearance before hydration; small, prepared brand assets load directly. */
export default function EnvitefyBrandImage({
  src,
  whiteSrc,
  alt,
  className = "",
  unoptimized = true,
  ...props
}: EnvitefyBrandImageProps) {
  const accessibleName = alt ? { role: "img" as const, "aria-label": alt } : {};
  return (
    <span className={styles.imageSwitch} {...accessibleName}>
      <Image {...props} unoptimized={unoptimized} src={src} alt="" aria-hidden="true" className={`${styles.colorImage} ${className}`} />
      <Image {...props} unoptimized={unoptimized} src={whiteSrc} alt="" aria-hidden="true" className={`${styles.whiteImage} ${className}`} />
    </span>
  );
}

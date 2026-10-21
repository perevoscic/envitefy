import Image, { type ImageProps } from "next/image";
import styles from "./brand-appearance.module.css";

type EnvitefyBrandImageProps = ImageProps & {
  whiteSrc: ImageProps["src"];
};

/** CSS selects the app appearance before hydration; the two source geometries stay intact. */
export default function EnvitefyBrandImage({
  src,
  whiteSrc,
  alt,
  className = "",
  ...props
}: EnvitefyBrandImageProps) {
  return (
    <span className={styles.imageSwitch} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      <Image {...props} src={src} alt="" aria-hidden="true" className={`${styles.colorImage} ${className}`} />
      <Image {...props} src={whiteSrc} alt="" aria-hidden="true" className={`${styles.whiteImage} ${className}`} />
    </span>
  );
}

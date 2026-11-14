import Image, { type ImageProps } from "next/image";
import { ENVITEFY_BRAND_ASSETS } from "@/lib/brand-assets";

/** User-approved artwork: preserve its colors, transparency and complete silhouette. */
export default function EnvitefyGymnasticsLogo({
  className = "",
  displayWidth = 220,
  ...props
}: Omit<ImageProps, "src" | "alt" | "width" | "height" | "unoptimized"> & { displayWidth?: number }) {
  const logo = ENVITEFY_BRAND_ASSETS.gymnastics;
  return <Image {...props} src={logo.logo} width={displayWidth} height={Math.round(displayWidth * logo.height / logo.width)}
    alt="Envitefy Gymnastics" className={className}
    style={{ ...props.style, width: displayWidth, maxWidth: "100%", height: "auto" }} unoptimized />;
}

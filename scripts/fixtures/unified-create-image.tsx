import NextImage, { getImageProps } from "next/dist/shared/lib/image-external";

export { getImageProps };

// Webpack's inline fixture assets lack Next's static image dimensions. Keep the
// real Image component in isolated journeys and render the actual logo directly
// when testing the shared mobile chrome.
export default function FixtureImage({ priority, unoptimized, fill, quality, ...props }: any) {
  if (new URLSearchParams(location.search).get("chrome") !== "1") {
    return <NextImage {...props} priority={priority} unoptimized={unoptimized} fill={fill} quality={quality} />;
  }
  return <img {...props} src={typeof props.src === "object" ? props.src.src : props.src} />;
}

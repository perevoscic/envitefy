import { type ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  quality?: number;
};
export function getImageProps({ fill, priority, unoptimized, quality, style, ...props }: Props) {
  return {
    props: {
      ...props,
      loading: priority ? ("eager" as const) : props.loading,
      style: {
        ...(fill
          ? ({ position: "absolute", height: "100%", width: "100%", inset: 0 } as const)
          : {}),
        ...style,
      },
    },
  };
}
export default function FixtureImage({
  fill,
  priority,
  unoptimized,
  style,
  alt = "",
  ...props
}: Props) {
  return (
    <img
      {...props}
      alt={alt}
      loading={priority ? "eager" : props.loading}
      style={{
        ...(fill
          ? ({ position: "absolute", height: "100%", width: "100%", inset: 0 } as const)
          : {}),
        ...style,
      }}
    />
  );
}

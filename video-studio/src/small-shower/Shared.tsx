import { OffthreadVideo } from "remotion";
import { staticFile, useVideoConfig } from "remotion";
export const asset = (name: string) =>
  staticFile(`projects/small-shower/${name}`);
export const usePortrait = () =>
  useVideoConfig().height > useVideoConfig().width;
export const Film = ({
  name,
  position = "50%",
  style = {},
  trimBefore = 0,
}: {
  name: string;
  position?: string;
  style?: React.CSSProperties;
  trimBefore?: number;
}) => (
  <OffthreadVideo
    src={asset(`${name}.mp4`)}
    startFrom={trimBefore}
    muted
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: `${position} center`,
      ...style,
    }}
  />
);
export const cream = "#f5f2e9";
export const ink = "#344638";

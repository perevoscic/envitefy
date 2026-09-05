import "./index.css";
import { type CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { EnvitefyVideo } from "./Composition";
import { loadBrandFonts } from "./fonts";
import { HostMode } from "./HostMode";
import type { VideoManifest, VideoProps } from "./types";

const calculateMetadata: CalculateMetadataFunction<VideoProps> = async ({ props }) => {
  if (!/^[a-z0-9-]+$/.test(props.projectId)) throw new Error("Invalid project id.");
  const response = await fetch(staticFile(`projects/${props.projectId}/manifest.json`));
  if (!response.ok)
    throw new Error(`Generate narration first: npm run narration -- ${props.projectId}`);
  const manifest: VideoManifest = await response.json();
  const expectedScenes = ["hook", "create", "share", "updates", "payoff"];
  if (
    manifest.scenes?.map((scene) => scene.id).join() !== expectedScenes.join() ||
    !Number.isInteger(manifest.durationInFrames) ||
    manifest.durationInFrames < 1
  )
    throw new Error("Invalid scene manifest for the introduction template.");
  await loadBrandFonts();
  return {
    durationInFrames: manifest.durationInFrames,
    fps: manifest.fps,
    width: manifest.width,
    height: manifest.height,
    props: { ...props, manifest },
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="EnvitefyHostModeSquare"
        component={HostMode}
        width={1080}
        height={1080}
        fps={30}
        durationInFrames={660}
      />
      <Composition
        id="EnvitefyHostMode"
        component={HostMode}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={660}
      />
      <Composition
        id="EnvitefyIntro"
        component={EnvitefyVideo}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        defaultProps={{ projectId: "intro" }}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};

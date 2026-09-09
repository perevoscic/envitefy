import { FridgeFreedomV5 } from "./FridgeFreedomV5";
import { FridgeFreedomV4 } from "./FridgeFreedomV4";
import { FridgeCameraScreenV4 } from "./fridge-freedom/CameraScreenV4";
import { FridgeFreedomV3 } from "./FridgeFreedomV3";
import { FridgeCameraScreen } from "./fridge-freedom/CameraScreenV3";
import { FridgeFreedomV2 } from "./FridgeFreedomV2";
import { JohnSpaceDiscoWide } from "./JohnSpaceDiscoWide";
import { JohnSpaceDisco } from "./JohnSpaceDisco";
import { FridgeFreedom } from "./FridgeFreedom";
import { WeddingCharacters } from "./WeddingCharacters";
import { BirthdaySupport } from "./BirthdaySupport";
import { Wedding200Texts } from "./Wedding200Texts";
import "./index.css";
import {
  type CalculateMetadataFunction,
  Composition,
  staticFile,
} from "remotion";
import { BirthdaySecondJob } from "./BirthdaySecondJob";
import { BirthdaySecondJobSquare } from "./BirthdaySecondJobSquare";
import { EnvitefyVideo } from "./Composition";
import { loadBrandFonts } from "./fonts";
import { HostMode } from "./HostMode";
import type { VideoManifest, VideoProps } from "./types";

const calculateMetadata: CalculateMetadataFunction<VideoProps> = async ({
  props,
}) => {
  if (!/^[a-z0-9-]+$/.test(props.projectId))
    throw new Error("Invalid project id.");
  const response = await fetch(
    staticFile(`projects/${props.projectId}/manifest.json`),
  );
  if (!response.ok)
    throw new Error(
      `Generate narration first: npm run narration -- ${props.projectId}`,
    );
  const manifest: VideoManifest = await response.json();
  const expectedScenes = ["hook", "create", "share", "updates", "payoff"];
  if (
    manifest.scenes?.map((scene) => scene.id).join() !==
      expectedScenes.join() ||
    !Number.isInteger(manifest.durationInFrames) ||
    manifest.durationInFrames < 1
  )
    throw new Error("Invalid scene manifest for the introduction template.");
  await loadBrandFonts();
  return {
    defaultOutName: `${props.projectId}/envitefy-${props.projectId}`,
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
        id="EnvitefyFridgeFreedomV5"
        component={FridgeFreedomV5}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        calculateMetadata={() => ({
          defaultOutName: "fridge-freedom/fridge-freedom-9x16-v5",
        })}
      />
      <Composition
        id="EnvitefyFridgeFreedomV4"
        component={FridgeFreedomV4}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        calculateMetadata={() => ({
          defaultOutName: "fridge-freedom/fridge-freedom-9x16-v4",
        })}
      />
      <Composition
        id="FridgeCameraScreenV4"
        component={FridgeCameraScreenV4}
        width={360}
        height={700}
        fps={30}
        durationInFrames={60}
        calculateMetadata={() => ({
          defaultOutName: "fridge-freedom/v4-camera-screen",
        })}
      />
      <Composition
        id="EnvitefyFridgeFreedomV3"
        component={FridgeFreedomV3}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        calculateMetadata={() => ({
          defaultOutName: "fridge-freedom/fridge-freedom-9x16-v3",
        })}
      />
      <Composition
        id="FridgeCameraScreenV3"
        component={FridgeCameraScreen}
        width={360}
        height={700}
        fps={30}
        durationInFrames={60}
        calculateMetadata={() => ({
          defaultOutName: "fridge-freedom/v3-camera-screen",
        })}
      />
      <Composition
        id="EnvitefyFridgeFreedomV2"
        component={FridgeFreedomV2}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        calculateMetadata={() => ({
          defaultOutName: "fridge-freedom/fridge-freedom-9x16-v2",
        })}
      />
      <Composition
        id="EnvitefyJohnSpaceDiscoWide"
        component={JohnSpaceDiscoWide}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={900}
        calculateMetadata={async () => {
          await loadBrandFonts();
          return {
            defaultOutName: "john-space-disco/john-space-disco-16x9-v5",
          };
        }}
      />
      <Composition
        id="EnvitefyJohnSpaceDisco"
        component={JohnSpaceDisco}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        calculateMetadata={() => ({
          defaultOutName: "john-space-disco/john-space-disco-9x16-v7",
        })}
      />
      <Composition
        id="EnvitefyFridgeFreedom"
        calculateMetadata={() => ({
          defaultOutName: "fridge-freedom/fridge-freedom-9x16-v1",
        })}
        component={FridgeFreedom}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
      />
      <Composition
        id="EnvitefyWeddingCharactersSquare"
        component={WeddingCharacters}
        width={1080}
        height={1080}
        fps={30}
        durationInFrames={750}
        calculateMetadata={() => ({
          defaultOutName: "wedding-characters/wedding-characters-1x1-v1",
        })}
      />
      <Composition
        id="EnvitefyWeddingCharactersWide"
        component={WeddingCharacters}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={750}
        calculateMetadata={() => ({
          defaultOutName: "wedding-characters/wedding-characters-16x9-v1",
        })}
      />
      <Composition
        id="EnvitefyWeddingCharacters"
        calculateMetadata={() => ({
          defaultOutName: "wedding-characters/wedding-characters-9x16-v4",
        })}
        component={WeddingCharacters}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={750}
      />
      <Composition
        id="EnvitefyWedding200Texts"
        component={Wedding200Texts}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={750}
      />
      <Composition
        id="EnvitefyBirthdaySupport"
        calculateMetadata={() => ({
          defaultOutName: "birthday-support/birthday-support-9x16-render",
        })}
        component={BirthdaySupport}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={750}
      />
      <Composition
        id="EnvitefyBirthdaySecondJob"
        calculateMetadata={() => ({
          defaultOutName: "birthday-second-job/birthday-second-job-9x16-render",
        })}
        component={BirthdaySecondJob}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
      />
      <Composition
        id="EnvitefyBirthdaySecondJobSquare"
        calculateMetadata={() => ({
          defaultOutName: "birthday-second-job/birthday-second-job-1x1-v1",
        })}
        component={BirthdaySecondJobSquare}
        width={1080}
        height={1080}
        fps={30}
        durationInFrames={900}
      />
      <Composition
        id="EnvitefyHostModeSquare"
        calculateMetadata={() => ({
          defaultOutName: "host-mode/envitefy-instagram-square",
        })}
        component={HostMode}
        width={1080}
        height={1080}
        fps={30}
        durationInFrames={660}
      />
      <Composition
        id="EnvitefyHostMode"
        calculateMetadata={() => ({
          defaultOutName: "host-mode/envitefy-tiktok-host-mode",
        })}
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

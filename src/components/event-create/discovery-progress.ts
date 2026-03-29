export type DiscoveryProgressFlow =
  | "gymnastics-upload"
  | "gymnastics-url"
  | "football-upload"
  | "football-url";

export const GYMNASTICS_URL_PARSE_START_PROGRESS = 72;
export const GYMNASTICS_URL_PARSE_TAIL_PROGRESS = 85;
export const GYMNASTICS_URL_PARSE_TAIL_LABEL = "Finalizing your meet page...";
const GYMNASTICS_URL_PARSE_PROGRESS_STEP_MS = 1_800;

type DiscoveryStage = {
  until: number;
  label: string;
};

const DISCOVERY_STAGE_COPY: Record<DiscoveryProgressFlow, DiscoveryStage[]> = {
  "gymnastics-upload": [
    { until: 16, label: "Uploading meet file..." },
    { until: 32, label: "Reading meet packet..." },
    { until: 48, label: "Matching host gym..." },
    { until: 62, label: "Gathering meet info..." },
    { until: 76, label: "Sorting meet details & admission..." },
    { until: 90, label: "Searching for gym..." },
    { until: 100, label: "Checking parking and arrival..." },
    { until: Number.POSITIVE_INFINITY, label: "Opening meet builder..." },
  ],
  "gymnastics-url": [
    { until: 18, label: "Checking live meet page..." },
    { until: 34, label: "Matching host gym..." },
    { until: 50, label: "Gathering meet info..." },
    { until: 64, label: "Sorting meet details & admission..." },
    { until: 78, label: "Checking coaches notes..." },
    { until: 85, label: "Searching for gym..." },
    { until: 100, label: "Checking parking and arrival..." },
    { until: Number.POSITIVE_INFINITY, label: "Opening meet builder..." },
  ],
  "football-upload": [
    { until: 18, label: "Uploading football file..." },
    { until: 34, label: "Reading schedule packet..." },
    { until: 50, label: "Matching stadium details..." },
    { until: 64, label: "Gathering game details..." },
    { until: 78, label: "Finding travel notes..." },
    { until: 90, label: "Searching for parking..." },
    { until: 100, label: "Checking arrival info..." },
    { until: Number.POSITIVE_INFINITY, label: "Opening football builder..." },
  ],
  "football-url": [
    { until: 18, label: "Checking team page..." },
    { until: 34, label: "Matching venue details..." },
    { until: 50, label: "Gathering schedule details..." },
    { until: 66, label: "Finding roster and travel info..." },
    { until: 82, label: "Checking gate info..." },
    { until: 94, label: "Searching for parking..." },
    { until: 100, label: "Checking bus arrival notes..." },
    { until: Number.POSITIVE_INFINITY, label: "Opening football builder..." },
  ],
};

export function getDiscoveryStageLabel(flow: DiscoveryProgressFlow, progress: number) {
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const stages = DISCOVERY_STAGE_COPY[flow];

  return (
    stages.find((stage) => clampedProgress < stage.until)?.label ??
    stages[stages.length - 1].label
  );
}

export function resolveGymnasticsUrlParseProgress(elapsedMs: number) {
  const safeElapsedMs = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const progress = Math.min(
    GYMNASTICS_URL_PARSE_START_PROGRESS +
      Math.floor(safeElapsedMs / GYMNASTICS_URL_PARSE_PROGRESS_STEP_MS),
    GYMNASTICS_URL_PARSE_TAIL_PROGRESS
  );
  const indeterminate = progress >= GYMNASTICS_URL_PARSE_TAIL_PROGRESS;

  return {
    progress,
    indeterminate,
    label: indeterminate
      ? GYMNASTICS_URL_PARSE_TAIL_LABEL
      : getDiscoveryStageLabel("gymnastics-url", progress),
  };
}

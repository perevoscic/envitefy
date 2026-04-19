export type LiveCardRailLayout = "default" | "spread" | "cluster";

export function getLiveCardRailLayout(params: {
  showcaseMode?: boolean;
  isClosed: boolean;
  buttonCount: number;
}): LiveCardRailLayout {
  if (!params.showcaseMode || !params.isClosed || params.buttonCount <= 0) {
    return "default";
  }

  return params.buttonCount >= 6 ? "cluster" : "spread";
}

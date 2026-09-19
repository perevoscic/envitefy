export type LiveCardRailLayout = "default" | "spread" | "cluster";
export type LiveCardPanelAlignment = "start" | "center" | "end";

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

export function getLiveCardPanelAlignment(params: {
  activeIndex: number;
  buttonCount: number;
}): LiveCardPanelAlignment {
  if (params.buttonCount <= 1 || params.activeIndex < 0) return "center";
  if (params.activeIndex === 0) return "start";
  if (params.activeIndex >= params.buttonCount - 1) return "end";
  return "center";
}

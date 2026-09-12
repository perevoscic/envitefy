import { parseScoreStreamWidget } from "./scorestream.ts";

export type ScoreStreamState = {
  code: string;
  name: string;
  widgetId: string;
};

// Public embed IDs created in the Envitefy ScoreStream account on September 12, 2026.
export const SCORESTREAM_STATES: readonly ScoreStreamState[] = [
  { code: "AL", name: "Alabama", widgetId: "70302" },
  { code: "AK", name: "Alaska", widgetId: "70303" },
  { code: "AZ", name: "Arizona", widgetId: "70304" },
  { code: "AR", name: "Arkansas", widgetId: "70305" },
  { code: "CA", name: "California", widgetId: "70306" },
  { code: "CO", name: "Colorado", widgetId: "70307" },
  { code: "CT", name: "Connecticut", widgetId: "70308" },
  { code: "DE", name: "Delaware", widgetId: "70309" },
  { code: "DC", name: "District of Columbia", widgetId: "70310" },
  { code: "FL", name: "Florida", widgetId: "70311" },
  { code: "GA", name: "Georgia", widgetId: "70312" },
  { code: "HI", name: "Hawaii", widgetId: "70313" },
  { code: "ID", name: "Idaho", widgetId: "70314" },
  { code: "IL", name: "Illinois", widgetId: "70315" },
  { code: "IN", name: "Indiana", widgetId: "70316" },
  { code: "IA", name: "Iowa", widgetId: "70317" },
  { code: "KS", name: "Kansas", widgetId: "70318" },
  { code: "KY", name: "Kentucky", widgetId: "70319" },
  { code: "LA", name: "Louisiana", widgetId: "70320" },
  { code: "ME", name: "Maine", widgetId: "70321" },
  { code: "MD", name: "Maryland", widgetId: "70322" },
  { code: "MA", name: "Massachusetts", widgetId: "70323" },
  { code: "MI", name: "Michigan", widgetId: "70324" },
  { code: "MN", name: "Minnesota", widgetId: "70325" },
  { code: "MS", name: "Mississippi", widgetId: "70326" },
  { code: "MO", name: "Missouri", widgetId: "70327" },
  { code: "MT", name: "Montana", widgetId: "70328" },
  { code: "NE", name: "Nebraska", widgetId: "70329" },
  { code: "NV", name: "Nevada", widgetId: "70330" },
  { code: "NH", name: "New Hampshire", widgetId: "70331" },
  { code: "NJ", name: "New Jersey", widgetId: "70332" },
  { code: "NM", name: "New Mexico", widgetId: "70333" },
  { code: "NY", name: "New York", widgetId: "70334" },
  { code: "NC", name: "North Carolina", widgetId: "70335" },
  { code: "ND", name: "North Dakota", widgetId: "70336" },
  { code: "OH", name: "Ohio", widgetId: "70337" },
  { code: "OK", name: "Oklahoma", widgetId: "70338" },
  { code: "OR", name: "Oregon", widgetId: "70339" },
  { code: "PA", name: "Pennsylvania", widgetId: "70340" },
  { code: "RI", name: "Rhode Island", widgetId: "70341" },
  { code: "SC", name: "South Carolina", widgetId: "70342" },
  { code: "SD", name: "South Dakota", widgetId: "70343" },
  { code: "TN", name: "Tennessee", widgetId: "70344" },
  { code: "TX", name: "Texas", widgetId: "70345" },
  { code: "UT", name: "Utah", widgetId: "70346" },
  { code: "VT", name: "Vermont", widgetId: "70347" },
  { code: "VA", name: "Virginia", widgetId: "70348" },
  { code: "WA", name: "Washington", widgetId: "70349" },
  { code: "WV", name: "West Virginia", widgetId: "70350" },
  { code: "WI", name: "Wisconsin", widgetId: "70351" },
  { code: "WY", name: "Wyoming", widgetId: "70352" },
];

export function scoreStreamStateUrl(state: ScoreStreamState): string {
  return `https://scorestream.com/widgets/scoreboards/vert?userWidgetId=${state.widgetId}`;
}

export function findScoreStreamState(value: string): ScoreStreamState | undefined {
  const widget = parseScoreStreamWidget(value);
  return widget?.layout === "vert"
    ? SCORESTREAM_STATES.find((state) => state.widgetId === widget.widgetId)
    : undefined;
}

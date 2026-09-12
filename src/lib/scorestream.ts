export type ScoreStreamWidget = {
  widgetId: string;
  layout: "vert" | "horz";
  url: string;
};

export const SCORESTREAM_WIDGET_CREATOR = "https://scorestream.com/widgetCreators/scoreboards/vert";

/** Read ScoreStream's embed formats without executing or retaining their HTML. */
export function parseScoreStreamWidget(value: unknown): ScoreStreamWidget | null {
  if (typeof value !== "string" || value.length > 4096) return null;
  const input = value.trim();
  const container = input.match(
    /^<div\s+([^>]*)>\s*<\/div>\s*(?:<script\s+[^>]*>\s*<\/script>)?$/i,
  );
  if (container) {
    const attributes = new Map<string, string>();
    for (const match of container[1].matchAll(/([^\s"'<>/=]+)\s*=\s*(["'])([\s\S]*?)\2/g)) {
      const name = match[1].toLowerCase();
      if (attributes.has(name)) return null;
      attributes.set(name, match[3]);
    }
    const widgetId = attributes.get("data-user-widget-id") || "";
    if (
      !attributes.get("class")?.split(/\s+/).includes("scorestream-widget-container") ||
      attributes.get("data-ss_widget_type") !== "vertScoreboard" ||
      !/^[1-9]\d{0,14}$/.test(widgetId)
    )
      return null;
    return {
      widgetId,
      layout: "vert",
      url: `https://scorestream.com/widgets/scoreboards/vert?userWidgetId=${widgetId}`,
    };
  }
  const iframe = input.match(
    /^<iframe\s+(?:[^>]*\s)?src\s*=\s*(["'])([\s\S]*?)\1[^>]*>\s*<\/iframe>$/i,
  );
  const candidate = iframe ? iframe[2].replace(/&amp;/gi, "&") : input;
  try {
    const url = new URL(candidate);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !["scorestream.com", "www.scorestream.com"].includes(url.hostname) ||
      url.username ||
      url.password ||
      url.port
    )
      return null;
    const path = url.pathname.match(/^\/widgets\/scoreboards\/(vert|horz)\/?$/);
    const ids = url.searchParams.getAll("userWidgetId");
    if (!path || ids.length !== 1 || !/^[1-9]\d{0,14}$/.test(ids[0])) return null;
    const layout = path[1] as ScoreStreamWidget["layout"];
    return {
      widgetId: ids[0],
      layout,
      url: `https://scorestream.com/widgets/scoreboards/${layout}?userWidgetId=${ids[0]}`,
    };
  } catch {
    return null;
  }
}

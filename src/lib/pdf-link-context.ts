type TextItem = { str?: string; transform?: number[]; width?: number; height?: number };
/** PDF text coordinates and annotation rectangles share page space (origin at bottom left). */
export function pdfLinkContext(rect: number[], items: TextItem[]) {
  if (rect.length !== 4 || rect.some((value) => !Number.isFinite(value)))
    return { label: null, contextText: null };
  const [x1, y1, x2, y2] = rect;
  const near = items
    .filter((item) => {
      const x = item.transform?.[4];
      const y = item.transform?.[5];
      return (
        x != null &&
        y != null &&
        item.str &&
        x <= x2 + 50 &&
        x + (item.width || 0) >= x1 - 80 &&
        y >= y1 - 20 &&
        y <= y2 + 100
      );
    })
    .sort((a, b) => b.transform![5] - a.transform![5] || a.transform![4] - b.transform![4]);
  const label = near
    .filter(
      (item) => item.transform![5] <= y2 + 2 && item.transform![5] + (item.height || 10) >= y1,
    )
    .map((item) => item.str)
    .join(" ")
    .trim();
  return { label: label || null, contextText: near.map((item) => item.str).join("\n") || null };
}

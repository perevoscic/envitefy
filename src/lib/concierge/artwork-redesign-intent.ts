function editDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row++) {
    const current = [row];
    for (let column = 1; column <= right.length; column++) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[right.length];
}

export function isArtworkRedesignRequest(message: string): boolean {
  const text = message.trim().toLowerCase();
  if (!text) return false;
  if (/\b(?:keep|preserve|reuse|use)\s+(?:the\s+)?same\s+image\b/.test(text)) return false;
  if (/\b(?:do not|don't|don’t|never)\s+(?:reg\w*|redo|redesign|remake|rebuild)\b/.test(text)) return false;
  if ([
    /\b(?:new|nme|fresh|different|another|alternate|alternative)\s+(?:design|image|flyer|invite|invitation|card|look|layout|style|version)\b/,
    /\b(?:completely|totally|entirely|brand)\s+(?:new|different)\b/,
    /\b(?:from scratch|start over|start again|redo|redesign|re[-\s]?design|regenerate|re[-\s]?generate|remake|rebuild)\b/,
    /\b(?:nothing|nothin|not)\s+(?:the\s+)?same\b/,
    /\bsame\s+image\b/,
  ].some((pattern) => pattern.test(text))) return true;

  // Bounded spelling tolerance, including transposed letters in "regenreate".
  return (text.match(/\b[a-z]+\b/g) || []).some((word) =>
    word.startsWith("reg") && word.length >= 8 && word.length <= 13 &&
    ["regenerate", "regenerated", "regeneration"].some((target) => editDistance(word, target) <= 2),
  );
}

/** Overflow uses screen pixels so dragging follows the pointer in scaled previews too. */
export function heroImageVerticalOverflow(
  width: number,
  height: number,
  naturalWidth: number,
  naturalHeight: number,
): number {
  if (
    ![width, height, naturalWidth, naturalHeight].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    return 0;
  const scale = Math.max(width / naturalWidth, height / naturalHeight);
  return Math.max(0, naturalHeight * scale - height);
}

export function heroImagePositionAfterDrag(
  startPosition: number,
  deltaY: number,
  overflow: number,
): number {
  if (!Number.isFinite(deltaY) || !Number.isFinite(overflow) || overflow <= 1) return startPosition;
  // Moving the image down reveals its top, a smaller object-position percentage.
  return (
    Math.round(Math.max(0, Math.min(100, startPosition - (deltaY / overflow) * 100)) * 10) / 10
  );
}

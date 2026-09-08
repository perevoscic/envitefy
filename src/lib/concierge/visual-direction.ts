/** Preservation instructions must not replace the existing creative brief. */
export function stripArtworkPreservationInstructions(message: string): string {
  return message
    .replace(/\b(?:keep|leave|preserve)\s+(?:the\s+)?(?:image|artwork|picture|poster|design)\s+(?:(?:exactly|completely)\s+)?(?:the same|unchanged|as[ -]is)\b/gi, "")
    .replace(/\b(?:keep|preserve|reuse|use)\s+(?:the\s+)?same\s+(?:image|artwork|picture|poster|design)\b/gi, "")
    .replace(/\b(?:do not|don't|don’t)\s+(?:change|alter|redraw|regenerate)\s+(?:the\s+)?(?:image|artwork|picture|poster|design)\b/gi, "");
}

export function hasVisualChangeWords(message: string): boolean {
  return /\b(?:image|artwork|picture|poster|design|theme|style|visible|printed|lettering|typography|characters?|background|foreground|colors?|colours?|palette|lighting|illustration)\b/i.test(message);
}

/** Keep explicit art instructions verbatim when structured extraction is unavailable. */
export function extractVisualDirection(message: string): string | null {
  const sentences = stripArtworkPreservationInstructions(message).match(/[^.!?\n]+(?:[.!?]+|$)/g) || [];
  const direction = sentences.filter((sentence) => {
    const text = sentence.trim();
    if (/^(?:please\s+)?(?:design|illustrate|render|depict)\s+/i.test(text)) return true;
    if (/^(?:artwork|visual direction|design direction|scene|palette|typography|lettering|composition)\s*:/i.test(text)) return true;
    return /^(?:please\s+)?(?:make|use|show|include|feature|keep|give|avoid|remove|no|do not|don't)\b/i.test(text)
      && /\b(?:artwork|scene|characters?|performers?|lettering|typography|composition|lighting|foreground|background|palette|colors?|colours?|illustration|calligraphy|balloons?|confetti|flowers?|florals?|photorealistic|portraits?)\b/i.test(text);
  }).map((sentence) => sentence.trim()).join(" ");
  return direction ? direction.slice(0, 6000) : null;
}

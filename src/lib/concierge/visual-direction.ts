/** Preservation instructions must not replace the existing creative brief. */
export function normalizeArtworkEditLanguage(message: string): string {
  return message
    .replace(/\b(?:memeber|memebrer|memebr|memeberr)(s)?\b/gi, "member$1")
    .replace(/\bcursvie\b/gi, "cursive");
}

export function stripArtworkPreservationInstructions(message: string): string {
  return message
    .replace(/\b(?:keep|leave|preserve)\s+(?:the\s+)?(?:image|artwork|picture|poster|design)\s+(?:(?:exactly|completely)\s+)?(?:the same|unchanged|as[ -]is)\b/gi, "")
    .replace(/\b(?:keep|preserve|reuse|use)\s+(?:the\s+)?same\s+(?:image|artwork|picture|poster|design)\b/gi, "")
    .replace(/\b(?:do not|don't|don’t)\s+(?:change|alter|redraw|regenerate)\s+(?:the\s+)?(?:image|artwork|picture|poster|design)\b/gi, "");
}

export function hasVisualChangeWords(message: string): boolean {
  const text = normalizeArtworkEditLanguage(message);
  return /\b(?:image|artwork|picture|poster|design|theme|style|visible|printed|lettering|typography|characters?|background|foreground|colors?|colours?|palette|lighting|illustration|cursive|calligraphy|fonts?)\b/i.test(text) ||
    /\b(?:no|without|remove|exclude|avoid|add|include|show)\s+(?:any\s+|all\s+|the\s+)?(?:band\s+members?|people|portraits?|performers?|faces?)\b/i.test(text);
}

/** These are visible acceptance criteria, not text to print on the invitation. */
export function requestedArtworkRequirements(message: string): string[] {
  const text = normalizeArtworkEditLanguage(message);
  const requirements: string[] = [];
  if (/\b(?:no|without|remove|exclude|avoid)\s+(?:any\s+|all\s+|the\s+)?band\s+members?\b/i.test(text)) {
    requirements.push("Remove every band member from the artwork, including member portraits, group photos, illustrated members, silhouettes and member photos on posters or album covers. Keep the requested artist-inspired artwork and studio setting through non-person imagery; do not replace the band with other people. This removal overrides preservation of the original subjects.");
  }
  if (/\b(?:cursive|calligraphy)\b/i.test(text) && !/\b(?:no|without|remove|avoid)\s+(?:the\s+)?(?:cursive|calligraphy)\b/i.test(text)) {
    requirements.push("Render the entire birthday headline in readable connected cursive/script lettering, including the name and turning-age wording. Preserve the approved name, age and headline words; spelling mistakes in the editing request are not replacement invitation copy. Replace the existing block or balloon letterforms; this typography change overrides preservation of the original font.");
  }
  return requirements;
}

/** Keep explicit art instructions verbatim when structured extraction is unavailable. */
export function extractVisualDirection(message: string): string | null {
  const sentences = stripArtworkPreservationInstructions(normalizeArtworkEditLanguage(message)).match(/[^.!?\n]+(?:[.!?]+|$)/g) || [];
  const direction = sentences.filter((sentence) => {
    const text = sentence.trim();
    if (/^(?:please\s+)?(?:design|illustrate|render|depict)\s+/i.test(text)) return true;
    if (/^(?:artwork|visual direction|design direction|scene|palette|typography|lettering|composition)\s*:/i.test(text)) return true;
    return /^(?:please\s+)?(?:make|use|show|include|feature|keep|give|avoid|remove|no|do not|don't)\b/i.test(text)
      && /\b(?:artwork|scene|characters?|performers?|band\s+members?|lettering|typography|composition|lighting|foreground|background|palette|colors?|colours?|illustration|calligraphy|cursive|fonts?|balloons?|confetti|flowers?|florals?|photorealistic|portraits?)\b/i.test(text);
  }).map((sentence) => sentence.trim()).join(" ");
  return direction ? direction.slice(0, 6000) : null;
}

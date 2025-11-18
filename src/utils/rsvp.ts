const RSVP_OPTION_START_REGEX = /[????]/;
const RSVP_OPTION_PHRASES = [
  /\bwill\s+attend\b/gi,
  /\bwill\s+not\s+attend\b/gi,
  /\bwill\s+not\s+be\s+able\s+to\s+attend\b/gi,
  /\bwon't\s+be\s+able\s+to\s+attend\b/gi,
  /\bmight\s+be\s+able\s+to\s+attend\b/gi,
  /\bmay\s+be\s+able\s+to\s+attend\b/gi,
  /\bpossibly\b/gi,
  /\bmaybe\b/gi,
];

export function cleanRsvpContactLabel(raw: string): string {
  let working = raw;
  const optionIndex = working.search(RSVP_OPTION_START_REGEX);
  if (optionIndex >= 0) {
    working = working.slice(0, optionIndex);
  }
  for (const pattern of RSVP_OPTION_PHRASES) {
    working = working.replace(pattern, "");
  }
  working = working.replace(/[????]/g, "");
  working = working.replace(/\s{2,}/g, " ").trim();
  working = working.replace(/[:;,.-]+$/, "").trim();
  return working;
}

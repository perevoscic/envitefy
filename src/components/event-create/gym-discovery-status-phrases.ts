/** Fun status lines for gym meet discovery progress UIs (rotate on each bar animation cycle). */
export const GYM_DISCOVERY_STATUS_PHRASES: readonly string[] = [
  "Checking coach notes",
  "Finding the venue",
  "Loading heat sheets",
  "Warming up routines",
  "Spotting the judges",
  "Gathering team info",
  "Scanning meet details",
  "Pulling session times",
  "Finding parking info",
  "Loading athlete roster",
  "Checking score tables",
  "Mapping the arena",
  "Finding ticket details",
  "Stretching the data",
  "Prepping event pages",
  "Organizing meet details",
  "Hunting for updates",
  "Syncing meet info",
  "Tracking live results",
  "Loading spectator guide",
  "Finding warmup times",
  "Checking floor rotation",
  "Building team pages",
  "Polishing the details",
  "Almost meet ready",
  "Sticking the landing",
  "Chalk in progress",
  "Leotards and logistics",
  "Vaulting through details",
  "Meet magic loading",
];

export function pickNextRandomPhrase(
  phrases: readonly string[],
  previous: string | null,
): string {
  if (phrases.length === 0) return "";
  if (phrases.length === 1) return phrases[0] ?? "";
  let next = phrases[Math.floor(Math.random() * phrases.length)] ?? "";
  let guard = 0;
  while (next === previous && guard < 16) {
    next = phrases[Math.floor(Math.random() * phrases.length)] ?? "";
    guard += 1;
  }
  return next;
}

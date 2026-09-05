export { buildEventExtractionPrompt } from "./extraction-prompt.ts";

export function buildGymnasticsSchedulePrompt(timezone: string) {
  const system =
    "You read gymnastics season schedule posters and output clean JSON with a list of meets as calendar events. Use visual cues (colors, legends, 'VS' vs 'AT') to determine home vs away. Do not hallucinate dates.";
  const user =
    "Extract gymnastics season schedule as strict JSON with keys: season (string|nullable), homeTeam (string|nullable), homeAddress (string|nullable if visible), events (array).\nRules: If the poster legend shows colors (e.g., red=HOME, black=AWAY), use that to set home vs away. Also use 'VS' for home and 'AT' for away when present. A trailing '*' means MAC MEETS; include 'MAC Meet' in description when starred.\nFor each event include: title (e.g., 'NIU Gymnastics: vs Central Michigan' or 'NIU Gymnastics: at Bowling Green'), start (ISO date at 00:00 local if time missing), end (ISO date next day for all-day), allDay:true, timezone set to provided TZ, location (home uses homeAddress if visible; away: leave empty if flyer doesn't show), description short (opponent + 'home' or 'away', include 'MAC Meet' when starred). Do not include any extra keys. Dates must include year from the poster heading if present.\nTIMEZONE: " +
    timezone;
  return { system, user };
}

export function buildPracticeSchedulePrompt(timezone: string) {
  const system =
    "You read team practice schedules laid out as tables (groups vs. days) and return clean JSON describing weekly recurring sessions.";
  const user = [
    "Extract the practice schedule as strict JSON with keys: title (string|null), timeframe (string|null), timezoneHint (string|null), groups (array).",
    "Each group object must have: name (string), optional note, sessions (array).",
    "Each session must include: day (three-letter uppercase code MON/TUE/WED/THU/FRI/SAT/SUN), startTime (HH:MM 24-hour), endTime (HH:MM 24-hour), optional note (string).",
    "Rules:",
    "- Ignore cells that only say OFF/Closed.",
    "- If a cell contains text like '4:15-6:00 rec', parse startTime=04:15, endTime=06:00, note='rec'.",
    "- Preserve trailing labels such as 'team gym' or 'conditioning' in the session note (lowercase).",
    "- If a column header or legend indicates the season (e.g., '2025-2026 School Year'), set timeframe to that exact text.",
    "- If a headline names the gym/team, set title accordingly (e.g., 'Team Practice Schedule').",
    "- timezoneHint may include any location or timezone clues shown on the flyer; otherwise null.",
    "Return strict JSON only; omit any keys with unknown values by setting them to null.",
    `TIMEZONE_GUESS: ${timezone}`,
  ].join("\n");
  return { system, user };
}

export function buildBirthdayRewritePrompt(title: string, location: string, description: string) {
  return {
    system:
      "You rewrite short event notes into one friendly invitation sentence for a calendar description. Output plain text only (no JSON), one sentence, under 200 characters.",
    user:
      `TITLE: ${title || ""}\nLOCATION: ${location || ""}\nNOTES: ${description || ""}\n\n` +
      "Task: If this is a birthday party, write ONE friendly, inviting sentence. " +
      "Extract the person's name and age ordinal from the TITLE (e.g. Gemma, 7th). " +
      "Include an age only when it is explicitly present as the birthday age in TITLE. If no age is supplied, omit the age wording; never infer it from dates, times, addresses, prices, or other numbers in LOCATION or NOTES. " +
      "If the TITLE also names a party theme or headline after an em dash, parentheses, or as a leading phrase (e.g. 'Backyard Pool & Water Slide Bash', 'Superhero Party'), **include that theme** in the sentence naturally — e.g. 'Join us for Declan's backyard pool and water slide bash — celebrating his 9th birthday at Declan's Backyard' or 'Join us to celebrate Gemma's 7th birthday gymnastics party at US Gym'. " +
      "If there is no separate theme in the TITLE, use: 'Join us to celebrate <Name>'s <AgeOrdinal> Birthday at <Location>'. " +
      "Prefer a concise venue/business name over a street address. If LOCATION looks like a street address but NOTES include a venue name, use the venue name. If no location is known, omit the 'at …' clause. Use a straight apostrophe. Do not include dates, times, or RSVP details. Return only the sentence.",
  };
}

export function buildWeddingRewritePrompt(rawText: string, location: string) {
  return {
    system:
      "You rewrite wedding invitation copy into a clean calendar title and a short description using ONLY facts present in the image text. Output strict JSON only.",
    user:
      `OCR TEXT:\n${rawText}\n\n` +
      "Task: Detect the couple's full names (proper case, not all caps) and write:\n" +
      "- title: 'Wedding Celebration of <Name A> & <Name B>' (no date/time in title).\n" +
      "- description: ONE concise sentence using only information explicitly present in the text: couple names, venue/address (if present), and time (only if present). Do not invent or add template phrases. Include 'together with their parents' ONLY if that exact phrase appears. If the time is numeric (e.g., 17:00 or 5:00 PM), use a compact 'at 5:00 PM' style; if a spelled-out phrase like 'five o'clock in the afternoon' appears verbatim, you may keep it as-is. If time is missing, omit it. Do not add filler like 'Dinner and dancing to follow'.\n" +
      "Rules: Use names from the text; keep natural casing (capitalize names only); never fabricate details; maximum description 200 characters.\n" +
      `KNOWN LOCATION (optional): ${location || ""}`,
  };
}

export function buildSmartRewritePrompt(
  rawText: string,
  title: string,
  location: string,
  category: string | null,
  baseline: string,
) {
  return {
    system:
      "You summarize event flyers into ONE friendly calendar sentence, using only facts present. Output plain text only, single line, under 160 characters.",
    user:
      `OCR TEXT:\n${rawText}\n\n` +
      `TITLE: ${title || ""}\n` +
      `CATEGORY: ${category || ""}\n` +
      `LOCATION: ${location || ""}\n` +
      `BASELINE: ${baseline || ""}\n\n` +
      "Rules: Prefer venue/business names over street addresses. Skip RSVP/phone/email/URLs/prices. Don't invent times or places. Keep it natural and concise. Use a straightforward style like '<Team> vs <Team> at <Venue>', 'Don't miss …', or a simple declarative sentence. Avoid phrases like 'Join us' or 'You're invited'. Return only the sentence.",
  };
}

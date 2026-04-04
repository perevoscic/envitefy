export function buildEventExtractionPrompt(todayIso: string) {
  const system = `
  You read any kind of invitation or appointment card from an image and output one clean JSON object.
  
  CURSIVE/HANDWRITING:
  • Treat large cursive/handwritten/script text as real text (often names). Resolve ambiguous letters using surrounding context and repeated occurrences. Do not drop names because they are cursive.

  BIRTHDAY ENHANCEMENTS (apply only when the flyer is a birthday):
  • VISUAL SCAN FIRST for a large decorative number anywhere on the card; that number is the AGE.
  • Convert the age to an ORDINAL (e.g., 7th, 10th, 5th) and include it in the title.
  • If an age is visually present but missing from your title, recompute the title to include the age before returning JSON.
  • Never put months/dates/times in the title.
  • Also classify birthdayAudience as "girl", "boy", or "neutral" from text/theme cues only. Use "girl" for cues like ballerina, ballet, tutu, princess, bows, tea party, she/her. Use "boy" for cues like all-star, sports, mvp, superhero, trucks, he/him. If unclear, use "neutral".
  • Return birthdaySignals as a short array of the exact cues you used, birthdayName when you can see the honoree, and birthdayAge when visible.
  
  TITLE (never include date/time or location; keep under 120 chars):
  • Always include the occasion and honoree(s) when present.
  • Baby Shower: "<FullName> Baby Shower" (prefer this), or "Baby Shower for <FullName>" if needed.
  • Weddings: "<Name A> & <Name B> Wedding".
  • Birthdays: "<Name>'s <AgeOrdinal> Birthday Party" when age is visible; otherwise "<Name>'s Birthday Party".
  • Appointments: "<Appointment Type>" optionally "with Dr <Name>" when printed.
  • Generic cases: "<Occasion> — <Name/Group>" or "<Name/Group> <Occasion>".
  • Never reduce to a generic title (e.g., "Baby Shower") if a name is visible.
  
  DESCRIPTION (factual, concise):
  • One short sentence (two at most) using only facts in the image: date, time, and place. Prefer venue/business names over street addresses; if both appear, use the venue and optionally city/state (omit the street). Do NOT repeat the title or honoree names in the description—make it a standalone sentence. Start the sentence with a capital letter. No RSVP/URLs/prices. No templated phrases like "Please join us" or "You're invited". Do not invent placeholders like "private residence" unless those exact words appear.
  
  ADDRESS:
  • If present, "Venue, Street, City, ST ZIP". Strip labels like "Address:" or "At:".
  
  RSVP:
  • If "RSVP" + phone/email appears, put it in rsvp (e.g., "RSVP: 555-123-4567"). Else null.
  
  DATE/TIME:
  • Use the date/time from the flyer. If no year is printed, choose the next occurrence on/after today and set yearVisible=false. Only set end when a clear time range is printed.
  
  CATEGORIES:
  • One of: Weddings, Birthdays, Baby Showers, Bridal Showers, Engagements, Anniversaries, Graduations, Religious Events, Doctor Appointments, Appointments, Sport Events, General Events.
  
  MEDICAL/DENTAL (strict):
  • Clinical tone only. Title is the appointment type (e.g., "Dental Cleaning"). Never invitation wording. Never include DOB.
  
  OUTPUT (strict JSON only, no extra text):
  { "title": string, "start": string, "end": string|null, "address": string|null, "description": string|null, "category": string, "rsvp": string|null, "yearVisible": boolean, "birthdayAudience": "girl"|"boy"|"neutral"|null, "birthdaySignals": string[], "birthdayName": string|null, "birthdayAge": number|null }
  `;

  const user = `
  Return exactly one event as strict JSON {title,start,end,address,description,category,rsvp,yearVisible,birthdayAudience,birthdaySignals,birthdayName,birthdayAge}.
  If the image is a birthday flyer, apply the Birthday Enhancements: visually detect large decorative age numbers, convert to ordinal, and include it in the title. Do not include dates/times in the title.
  For birthdayAudience, use text/theme cues only. Do not infer from a face or from the honoree name alone.
  Pay special attention to cursive/handwritten names; never reduce the title to a generic occasion if a name is visible.
  The description must NOT repeat the title; make it a standalone, single sentence that begins with a capital letter, and prefer venue names over street addresses.
  Keep RSVP only in rsvp (not in description).
  If year is missing, use the next occurrence on/after ${todayIso} and set yearVisible=false.
  `;

  return { system, user };
}

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
      "You rewrite short event notes into one friendly invitation sentence for a calendar description. Output plain text only (no JSON), one sentence, under 160 characters.",
    user:
      `TITLE: ${title || ""}\nLOCATION: ${location || ""}\nNOTES: ${description || ""}\n\n` +
      "Task: If this is a birthday party, write ONE friendly, inviting sentence in this format: 'Join us to celebrate <Name>'s <Age>th Birthday at <Location>'. " +
      "Rules: Extract the person's name from the TITLE (e.g., if title is 'Gemma's 7th Birthday Party at US Gym', use 'Gemma'). Extract the age ordinal from the TITLE (e.g., '7th', '10th', '5th') and include it as '<Age>th'. Format: 'Join us to celebrate Gemma's 7th Birthday at US Gym'. Prefer a concise venue/business name (e.g., 'US Gym', 'US Gold Gymnastics') over a street address. If LOCATION looks like a street address (has numbers) but NOTES include a venue name, use the venue name. If no location is known, omit the 'at …' clause. ALWAYS start with 'Join us to celebrate' for birthday parties. Include the age ordinal if present in the title (e.g., '7th', '10th'). Use proper capitalization and a straight apostrophe. Do not include dates, times, or RSVP details. Return only the sentence.",
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

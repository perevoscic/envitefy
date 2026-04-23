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
  • Birthdays: When age is visible use "<Name>'s <AgeOrdinal> Birthday" plus any **printed party headline or theme** from the flyer (large colorful title, e.g. "BACKYARD POOL & WATER SLIDE BASH", "Superhero Party", "Unicorn Bash"). Put them together, e.g. "<Name>'s <AgeOrdinal> Birthday — <PartyTheme>" or "<PartyTheme> — <Name>'s <AgeOrdinal> Birthday". Do **not** drop the flyer’s party name in favor of only "Birthday Party" when a distinct theme line exists. If there is no separate theme headline, "<Name>'s <AgeOrdinal> Birthday Party" or "<Name>'s Birthday Party" is fine.
  • Appointments: "<Appointment Type>" optionally "with Dr <Name>" when printed.
  • Generic cases: "<Occasion> — <Name/Group>" or "<Name/Group> <Occasion>".
  • Never reduce to a generic title (e.g., "Baby Shower") if a name is visible.
  
  DESCRIPTION (factual, concise):
  • One short sentence (two at most) using only facts in the image: date, time, and place. Prefer venue/business names over street addresses; if both appear, use the venue and optionally city/state (omit the street). Do not copy the full title verbatim; you may briefly name the party theme if it is not already obvious from the title. Start the sentence with a capital letter. No RSVP/URLs/prices. No templated phrases like "Please join us" or "You're invited". Do not invent placeholders like "private residence" unless those exact words appear.
  
  ADDRESS:
  • If present, "Venue, Street, City, ST ZIP". Strip labels like "Address:" or "At:".
  
  RSVP:
  • If RSVP wording appears, put the short RSVP/contact wording in rsvp. This may include a name, phone, email, or short RSVP instruction line.
  • If an RSVP website/link appears (The Knot, Zola, website URL, www link), put only that link in rsvpUrl. Else null.
  • If an RSVP-by or respond-by date appears, put the printed short date text in rsvpDeadline (e.g., "December 1st"). Else null.

  GOOD TO KNOW (guest reminders):
  • Read the **bottom** of the flyer and any **small or cursive** lines: practical tips for guests (e.g. "don't forget a towel and sunscreen!", "bring a swimsuit", "gifts optional"). Put that wording in **goodToKnow** — preserve meaning; fix obvious OCR typos only (e.g. "twoel" → "towel"). One sentence or short phrase; do **not** put RSVP, phone, address, or date/time here (those go in other fields). If nothing like that appears, goodToKnow is null.
  
  DATE/TIME:
  • Use the date/time from the flyer. If no year is printed, choose the next upcoming calendar date for that month/day (same calendar year when that date is still ahead this year; if that month/day has already passed this year, use next year — e.g. viewing in December for a January party uses the following year). Set yearVisible=false when the flyer does not print a year.
  • When the flyer shows a time window (e.g. "1PM to 4PM", "1:00 PM – 4:00 PM", "from 1 to 4 pm"), set start to the opening time and end to the closing time on the same calendar date as start (both full ISO datetimes). If only one time is shown, end may be null.
  
  CATEGORIES:
  • One of: Weddings, Birthdays, Baby Showers, Bridal Showers, Engagements, Anniversaries, Graduations, Religious Events, Doctor Appointments, Appointments, Sport Events, General Events.
  
  MEDICAL/DENTAL (strict):
  • Clinical tone only. Title is the appointment type (e.g., "Dental Cleaning"). Never invitation wording. Never include DOB.
  
  OUTPUT (strict JSON only, no extra text):
  { "title": string, "start": string, "end": string|null, "address": string|null, "description": string|null, "category": string, "rsvp": string|null, "rsvpUrl": string|null, "rsvpDeadline": string|null, "yearVisible": boolean, "birthdayAudience": "girl"|"boy"|"neutral"|null, "birthdaySignals": string[], "birthdayName": string|null, "birthdayAge": number|null, "goodToKnow": string|null }
  `;

  const user = `
  Return exactly one event as strict JSON {title,start,end,address,description,category,rsvp,rsvpUrl,rsvpDeadline,yearVisible,birthdayAudience,birthdaySignals,birthdayName,birthdayAge,goodToKnow}.
  If the image is a birthday flyer, apply the Birthday Enhancements: visually detect large decorative age numbers, convert to ordinal, and include it in the title. If the flyer has a big headline naming the party (pool party, bash, theme), keep it in the title together with the child’s name and age (see TITLE rules). Do not include dates/times in the title.
  For birthdayAudience, use text/theme cues only. Do not infer from a face or from the honoree name alone.
  Pay special attention to cursive/handwritten names; never reduce the title to a generic occasion if a name is visible.
  The description must NOT repeat the title; make it a standalone, single sentence that begins with a capital letter, and prefer venue names over street addresses.
  Keep RSVP details out of the description. Put RSVP wording in rsvp, RSVP links in rsvpUrl, and RSVP-by dates in rsvpDeadline.
  If year is missing, use the next occurrence on/after ${todayIso} and set yearVisible=false.
  If a start and end time are printed for the party, return both as start and end (same date).
  Always fill **goodToKnow** when the image has a bottom/footer guest tip (don't forget / bring / remember), including cursive. Keep those tips out of the main description sentence.
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
      "You rewrite short event notes into one friendly invitation sentence for a calendar description. Output plain text only (no JSON), one sentence, under 200 characters.",
    user:
      `TITLE: ${title || ""}\nLOCATION: ${location || ""}\nNOTES: ${description || ""}\n\n` +
      "Task: If this is a birthday party, write ONE friendly, inviting sentence. " +
      "Extract the person's name and age ordinal from the TITLE (e.g. Gemma, 7th). " +
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

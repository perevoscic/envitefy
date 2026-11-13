/** Recognize the document's purpose, rather than one occasion mentioned in its body. */
export function isSchoolMemoText(value: string): boolean {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const memo = /\b(?:weekly|class(?:room)?|school|teacher|parent)\s+(?:memo|newsletter|update|bulletin|reminders)\b|\b(?:school|class(?:room)?)\s+news\b|\bnewsletter\b|\b(?:peek at (?:the |our )?week|week (?:at a glance|ahead)|classroom (?:notes|reminders)|weekly (?:news|notes))\b/i.test(text);
  const school = /\b(?:school|class(?:es|room)?|students?|teachers?|homework|spelling|science|reading|math|bible\s+test|spirit\s+week|parent[ -]teacher)\b/i.test(text);
  const academics = /\b(?:class(?:es|room)?|teachers?|homework|spelling|science|reading|math|ELA|bible\s+test|parent[ -]teacher)\b/i.test(text);
  const teamSchedule = /\b(?:football|soccer|basketball|baseball|softball|volleyball|hockey|gymnastics|lacrosse|rugby|tennis)\b/i.test(text) && /\b(?:practice|training|games?|matches|fixtures)\b/i.test(text);
  return memo && school && (!teamSchedule || academics);
}

/** Older scans sometimes stored classroom instructions as a physical destination. */
export function schoolMemoLocationValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  if (!text || /^(?:(?:location|address|venue)\s*:?\s*)?(?:none|n\/?a|unknown|not (?:listed|provided|specified|applicable)|to be (?:announced|confirmed)|tbd|(?:at )?(?:home|school))\.?$/i.test(text)) return null;
  if (/\b(?:binders?|homework|dress code|donations?)\b|\b(?:test|quiz|exam)\s+(?:this|next|on|friday|monday|tuesday|wednesday|thursday)\b|\b(?:study|read|reading|initial|returned?|bring|taken)\b.*\b(?:daily|home|school|every|page|words|facts)\b|\b(?:due|daily|every day)\s*\.?$/i.test(text)) return null;
  return text;
}

/** Only a labelled physical destination may become a memo's parent location. */
export function schoolMemoLocation(source: string): { venue: string | null; location: string | null } {
  const lines = source.split(/\r?\n/);
  const read = (label: RegExp) => {
    const value = lines.map((line) => line.match(label)?.[1]?.trim()).find(Boolean);
    return schoolMemoLocationValue(value);
  };
  return { venue: read(/^\s*(?:venue|school name|location)\s*:\s*(.+)$/i), location: read(/^\s*(?:school address|address)\s*:\s*(.+)$/i) };
}

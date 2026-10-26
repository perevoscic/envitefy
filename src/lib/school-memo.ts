/** Recognize the document's purpose, rather than one occasion mentioned in its body. */
export function isSchoolMemoText(value: string): boolean {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const memo = /\b(?:weekly|class(?:room)?|school|teacher|parent)\s+(?:memo|newsletter|update|bulletin|reminders)\b|\b(?:school|class(?:room)?)\s+news\b|\bnewsletter\b|\b(?:peek at (?:the |our )?week|week (?:at a glance|ahead)|classroom (?:notes|reminders)|weekly (?:news|notes))\b/i.test(text);
  const school = /\b(?:school|class(?:es|room)?|students?|teachers?|homework|spelling|science|reading|math|bible\s+test|spirit\s+week|parent[ -]teacher)\b/i.test(text);
  const academics = /\b(?:class(?:es|room)?|teachers?|homework|spelling|science|reading|math|ELA|bible\s+test|parent[ -]teacher)\b/i.test(text);
  const teamSchedule = /\b(?:football|soccer|basketball|baseball|softball|volleyball|hockey|gymnastics|lacrosse|rugby|tennis)\b/i.test(text) && /\b(?:practice|training|games?|matches|fixtures)\b/i.test(text);
  return memo && school && (!teamSchedule || academics);
}

/** Only a labelled physical destination may become a memo's parent location. */
export function schoolMemoLocation(source: string): { venue: string | null; location: string | null } {
  const lines = source.split(/\r?\n/);
  const read = (label: RegExp) => {
    const value = lines.map((line) => line.match(label)?.[1]?.trim()).find(Boolean);
    if (!value || /\b(?:test|quiz|exam|binders?|homework|daily|donation|dress code|due)\b/i.test(value)) return null;
    return value;
  };
  return { venue: read(/^\s*(?:venue|school name|location)\s*:\s*(.+)$/i), location: read(/^\s*(?:school address|address)\s*:\s*(.+)$/i) };
}

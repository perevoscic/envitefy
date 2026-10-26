/** Recognize the document's purpose, rather than one occasion mentioned in its body. */
export function isSchoolMemoText(value: string): boolean {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const memo = /\b(?:weekly|class(?:room)?|school|teacher|parent)\s+(?:memo|newsletter|update|bulletin|reminders)\b|\b(?:school|class(?:room)?)\s+news\b|\bnewsletter\b/i.test(text);
  const school = /\b(?:school|class(?:es|room)?|students?|teachers?|homework|spelling|science|reading|math|bible\s+test|spirit\s+week|parent[ -]teacher)\b/i.test(text);
  const academics = /\b(?:class(?:es|room)?|teachers?|homework|spelling|science|reading|math|ELA|bible\s+test|parent[ -]teacher)\b/i.test(text);
  const teamSchedule = /\b(?:football|soccer|basketball|baseball|softball|volleyball|hockey|gymnastics|lacrosse|rugby|tennis)\b/i.test(text) && /\b(?:practice|training|games?|matches|fixtures)\b/i.test(text);
  return memo && school && (!teamSchedule || academics);
}

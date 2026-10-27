import type { EventPageComposition, EventInformationSection } from "./event-page-composition";
import { isSchoolMemoText } from "./school-memo.ts";

/** Long runs of isolated glyphs are PDF tracking, not ordinary word spacing. */
export function hasSchoolMemoLetterSpacing(value: string): boolean {
  return /\b(?:[A-Za-z]\s+){5,}[A-Za-z]\b/.test(value);
}

/** Reflow wrapped prose while retaining quotes, references and labelled task lines. */
export function schoolMemoParagraphs(value: string): string {
  const paragraphs = value
    .replace(/\n(?=\d+\s*[.)]|[A-Z][A-Z $]{6})/g, "\n\n")
    .replace(/\s+(?=(?:Test|Quiz|Exam|Deadline|Due)\s*:)/g, "\n\n")
    .replace(/([”"])\s+(?=(?:[1-3]\s+)?[A-Z][a-z]+(?:\s+[A-Za-z]+){0,2}\s+\d+\s*:)/g, "$1\n");
  return paragraphs.split(/\n\s*\n/).map(paragraph => {
    let text = "";
    for (const raw of paragraph.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const reference = /^(?:[1-3]\s+)?[A-Z][a-z]+(?:\s+[A-Za-z]+){0,2}\s+\d+\s*:\s*\d/.test(line);
      const quote = /^[“"]/.test(line);
      text += !text ? line : `${reference ? "\n" : quote ? "\n\n" : " "}${line}`;
    }
    return text;
  }).filter(Boolean).join("\n\n").trim();
}

/** Source notes stay separate from the memo's structured calendar items. */
export function schoolMemoSections(source: string): Array<{ title: string; body: string }> {
  const lines = source.replace(/\r\n/g, "\n")
    .replace(/(\d)\s+(st|nd|rd|th)\b/gi, "$1$2")
    .replace(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\n\s*(\d)/gi, "$1 $2")
    .split("\n");
  const sections: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } | undefined;
  const start = (title: string) => {
    current = sections.find(section => section.title === title);
    if (!current) { current = { title, lines: [] }; sections.push(current); }
  };
  for (const [lineIndex, raw] of lines.entries()) {
    const line = raw.replace(/\s+/g, " ").trim();
    if (!line) { current?.lines.push(""); continue; }
    if (/^Page\s+\d+(?:\s+of\s+\d+)?$/i.test(line) || /^(?:st|nd|rd|th)(?:\s+(?:st|nd|rd|th))*$/i.test(line)) continue;
    if (/\b(?:weekly(?: school)?|school|classroom)\s+memo\b/i.test(line) || /^(?:Mrs?|Ms|Miss|Dr)\.?\s+[\p{L}'’.-]+$/u.test(line)) continue;
    if (/^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?$/i.test(line) && (!current || lines.slice(Math.max(0, lineIndex - 2), lineIndex).some(previous => /(?:weekly|school|classroom)\s+memo/i.test(previous)))) continue;
    if (/^CREATE\s*\|\s*SHARE\s*\|\s*ENJOY$/i.test(line) || /^Created with Envitefy\b/i.test(line)) continue;
    const reminder = line.match(/^(Important Reminders|Reminders|At Home Partnership Tips|At.home Partnership|Important Events|Upcoming Events|Classroom News)\s*[:—–-]?\s*(.*)$/i);
    const subject = line.match(/^(Bible|Science|Spelling|Reading|Math|ELA|History|Social Studies)\s*[:—–-]\s*(.*)$/i);
    if (reminder || subject) {
      const match = (reminder || subject)!;
      start(match[1]);
      if (match[2]) current!.lines.push(match[2]);
      continue;
    }
    // PDF subject groups commonly wrap the teacher names across several lines.
    if (/^Reading\b/i.test(line) && /Math|ELA|\(/i.test(line)) { start("Reading, Math & ELA"); current!.lines.push(line); continue; }
    if (!current) start("Classroom news");
    current!.lines.push(line);
  }
  return sections.flatMap(section => {
    const body = section.lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!body) return [];
    // Keep source wording; only remove PDF line wrapping within a paragraph.
    const readable = schoolMemoParagraphs(body);
    return Array.from({ length: Math.ceil(readable.length / 6000) }, (_, index) => ({
      title: index ? `${section.title} (continued)` : section.title,
      body: readable.slice(index * 6000, (index + 1) * 6000),
    }));
  });
}

export function schoolMemoSectionLayout(sections: Array<{ id: string }>): NonNullable<EventPageComposition["sectionLayout"]> {
  const pairs: Array<[string, string]> = [];
  const widths: Record<string, 6 | 12> = { schedule: 12 };
  for (let index = 0; index + 1 < sections.length; index += 2) {
    const left = sections[index].id, right = sections[index + 1].id;
    pairs.push([left, right]); widths[left] = 6; widths[right] = 6;
  }
  return { version: 1, order: ["schedule", ...sections.map(section => section.id)], hidden: [], added: [], widths, pairs };
}

/** Repair the former generated transcript block in memory; only explicit saves persist it. */
export function organizeLegacySchoolMemo(value: EventPageComposition): EventPageComposition {
  if (!value.sections.length || !value.sections.every(section => /^info:import-\d+$/.test(section.id) && /^School memo(?: \(continued\))?$/i.test(section.title))) return value;
  const source = value.sections.map(section => section.body).join("\n");
  if (!isSchoolMemoText(source)) return value;
  const notes = schoolMemoSections(source);
  if (notes.length < 2) return value;
  const sections: EventInformationSection[] = notes.map((section, index) => ({ id: `info:school-note-${index}`, ...section }));
  return { ...value, sections, sectionLayout: schoolMemoSectionLayout(sections) };
}

/** Surface printed communication notes even on previously imported date items. */
export function schoolMemoDateNotes(notes?: string | null, sourceText?: string | null): string {
  const parts = notes ? [notes] : [];
  for (const match of (sourceText || "").matchAll(/\([^)]*\bSeeSaw\b[^)]*\)/gi)) {
    if (!parts.some(part => part.toLowerCase().includes(match[0].slice(1, -1).trim().toLowerCase()))) parts.push(match[0]);
  }
  return parts.join(" · ");
}

/** Recover list boundaries lost when PDF lines were reflowed into a paragraph. */
export function schoolMemoEventBullets(body: string): string[] {
  const lines = body.split(/\n/).map(line => line.replace(/^\s*[•*–-]\s+/, "").trim()).filter(Boolean);
  return lines.flatMap(line => {
    const items: string[] = [];
    const dateEnd = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*[-–—]\s*\d{1,2}(?:st|nd|rd|th)?)?(?:,?\s+\d{4})?(?:\s*\([^)]*\))?/gi;
    let start = 0;
    for (const match of line.matchAll(dateEnd)) {
      const end = match.index! + match[0].length;
      const rest = line.slice(end).trim();
      // Split only before another named, dated event; retain trailing source notes.
      if (rest && /^[A-Z]/.test(rest) && /^(?:[^.!?]{1,100}?)\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d/i.test(rest)) {
        items.push(line.slice(start, end).trim());
        start = end;
      }
    }
    items.push(line.slice(start).trim());
    return items.filter(Boolean);
  });
}

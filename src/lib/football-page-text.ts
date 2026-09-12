export type FootballPageTextKey =
  | "eventTitle"
  | "eventDetails"
  | "subtitle"
  | `copy:${string}`
  | `section:${string}:title`
  | `section:${string}:caption`
  | `nav:${string}`
  | `field:${string}:label`
  | `card:${string}:title`
  | `card:${string}:body`
  | `card:${string}:meta`
  | `line:${string}:body`;
export type FootballPageText = Partial<Record<FootballPageTextKey, string>>;
export type FootballPageTextChange = (key: FootballPageTextKey, value: string | undefined) => void;

export const footballCopyKey = (text: string): FootballPageTextKey =>
  `copy:${encodeURIComponent(text)}`;
export const footballPageTextLimit = (key: FootballPageTextKey) =>
  key === "eventDetails" || key.endsWith(":body") ? 4000 : 240;

/** Only display wording belongs here. Event titles and descriptions remain canonical fields. */
export function normalizeFootballPageText(value: unknown): FootballPageText {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: FootballPageText = {};
  for (const [key, text] of Object.entries(value)) {
    if (
      typeof text !== "string" ||
      !/^(?:subtitle|copy:[^:]{1,1500}|section:[^:]{1,200}:(?:title|caption)|nav:[^:]{1,200}|field:[^:]{1,200}:label|card:[^:]{1,400}:(?:title|body|meta)|line:[^:]{1,400}:body)$/.test(
        key,
      )
    )
      continue;
    const validKey = key as FootballPageTextKey;
    result[validKey] = text.slice(0, footballPageTextLimit(validKey));
  }
  return result;
}

export function updateFootballPageText<
  T extends { title: string; details: string; footballPageText?: FootballPageText },
>(data: T, key: FootballPageTextKey, value: string | undefined): T {
  if (key === "eventTitle") return { ...data, title: value ?? "" };
  if (key === "eventDetails") return { ...data, details: value ?? "" };
  const footballPageText = normalizeFootballPageText(data.footballPageText);
  if (value === undefined) delete footballPageText[key];
  else footballPageText[key] = value.slice(0, footballPageTextLimit(key));
  return { ...data, footballPageText };
}

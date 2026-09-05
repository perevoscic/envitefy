type BirthdayTitleInput = {
  title: string;
  text: string;
  birthdayAge?: number | string | null;
};

function normalizeAge(value: number | string | null): number | null {
  if (value === null) return null;
  if (typeof value === "string" && !/^\d{1,2}(?:st|nd|rd|th)?$/i.test(value.trim())) {
    return null;
  }
  const age = typeof value === "number" ? value : Number.parseInt(value, 10);
  return Number.isInteger(age) && age >= 1 && age <= 99 ? age : null;
}

function extractExplicitAge(text: string): number | null {
  const ages = new Set<number>();
  for (const pattern of [
    /(?<![\d.$/+-])\b(\d{1,2})(?:st|nd|rd|th)?\s+birthday\b/gi,
    /\b(?:turning|turns)\s+(\d{1,2})\b(?!\s*(?:[-–/+]|to\b|or\b|\.\d))/gi,
    /(?<![\d.$/+-])\b(\d{1,2})\s+years?\s+old\b/gi,
  ]) {
    for (const match of text.matchAll(pattern)) {
      const age = normalizeAge(match[1]);
      if (age !== null) ages.add(age);
    }
  }
  return ages.size === 1 ? [...ages][0] : null;
}

/** Preserve an explicitly unknown model age; text-only fallback requires birthday evidence. */
export function resolveOcrBirthdayTitle(input: BirthdayTitleInput): {
  title: string;
  ageOrdinal: string;
} {
  if (!/\bbirthday\b/i.test(input.title)) return { title: input.title, ageOrdinal: "" };
  const age =
    input.birthdayAge === undefined
      ? extractExplicitAge(`${input.title}\n${input.text}`)
      : normalizeAge(input.birthdayAge);
  const suffix =
    age !== null && (age % 100 < 11 || age % 100 > 13)
      ? (["th", "st", "nd", "rd"][age % 10] ?? "th")
      : "th";
  const ageOrdinal = age === null ? "" : `${age}${suffix}`;
  return {
    title: input.title.replace(
      /\b(?:\d{1,2}(?:st|nd|rd|th)?\s+)?birthday\b/i,
      `${ageOrdinal ? `${ageOrdinal} ` : ""}Birthday`,
    ),
    ageOrdinal,
  };
}

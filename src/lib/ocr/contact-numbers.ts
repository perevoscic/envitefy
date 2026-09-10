import type { OcrFact } from "./facts.ts";

export function contactNumberLabel(label: string): "Phone" | "Fax" | null {
  const key = label
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (/^(?:(?:clinic|office|provider|contact) )?(?:phone|telephone|tel)(?: number| no)?$/.test(key))
    return "Phone";
  if (/^(?:(?:clinic|office|provider) )?fax(?: number| no)?$/.test(key)) return "Fax";
  return null;
}

/** Read explicitly labelled numbers, including adjacent Phone/Fax fields in flattened OCR. */
export function extractLabeledContactNumbers(text: string): OcrFact[] {
  const pattern =
    /(?<![A-Za-z])((?:phone|telephone|tel\.?|fax)(?:\s+(?:number|no\.?))?)\s*[:#-]?\s*((?:\+?1[\s.-]*)?(?:\(\s*\d{3}\s*\)|\d{3})[\s.-]*\d{3}[\s.-]*\d{4}(?:\s*(?:ext\.?|extension|x)\s*\d+)?)(?!\d)/gi;
  const facts: OcrFact[] = [];
  for (const match of text.matchAll(pattern)) {
    const label = contactNumberLabel(match[1]);
    const value = match[2].replace(/\s+/g, " ").trim();
    if (label && !facts.some((fact) => fact.label === label && fact.value === value))
      facts.push({ label, value });
  }
  return facts;
}

/** Recover omitted contacts from saved text without changing existing source facts. */
export function withMissingContactNumbers(facts: OcrFact[], sourceText: string): OcrFact[] {
  const present = new Set(facts.map((fact) => contactNumberLabel(fact.label)).filter(Boolean));
  const missing = extractLabeledContactNumbers(sourceText).filter(
    (fact) => !present.has(contactNumberLabel(fact.label)),
  );
  return missing.length ? [...facts, ...missing] : facts;
}

export type OcrFactCard = {
  label: string;
  values: string[];
  contacts?: Array<{ label: "Phone" | "Fax"; value: string }>;
};

export function combinePhoneAndFaxCards(cards: OcrFactCard[]): OcrFactCard[] {
  const contacts = cards.flatMap((card) => {
    const label = contactNumberLabel(card.label);
    return label ? card.values.map((value) => ({ label, value })) : [];
  });
  if (
    !contacts.some((contact) => contact.label === "Phone") ||
    !contacts.some((contact) => contact.label === "Fax")
  )
    return cards;
  const firstIndex = cards.findIndex((card) => contactNumberLabel(card.label));
  return cards.flatMap((card, index) =>
    index === firstIndex
      ? [
          {
            label: "Phone & Fax",
            values: [],
            contacts: contacts.sort((a, b) =>
              a.label === b.label ? 0 : a.label === "Phone" ? -1 : 1,
            ),
          },
        ]
      : contactNumberLabel(card.label)
        ? []
        : [card],
  );
}

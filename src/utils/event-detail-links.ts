export type EventDetailSegment = {
  text: string;
  kind?: "phone" | "email" | "address" | "website";
  href?: string;
};

const CONTACT_LABEL = /\b(?:phone|fax|tel|telephone|mobile|call|contact)\b/i;
const IDENTIFIER_LABEL = /\b(?:id|identifier|confirmation|account|patient number|member number)\b/i;
const LOCATION_LABEL =
  /^(?:(?:event|venue|street|mailing|office)\s+)?(?:address|location|where|venue)$/i;
const STREET = String.raw`\d{1,6}[ \t]+(?:[\p{L}\d.'-]+[ \t]+){1,7}(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|boulevard|blvd|way|place|pl|parkway|pkwy|highway|hwy|loop|circle|cir|terrace|ter)\b\.?`;
const ADDRESS = String.raw`${STREET}(?:[ ,\t]+(?:suite|ste|apt|unit|#)[ .\t]*[\w-]+)?(?:,[ \t]*[\p{L} .'-]+,[ \t]*[A-Z]{2}[ \t]+\d{5}(?:-\d{4})?)?`;
const EMAIL = String.raw`[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}`;
const PHONE = String.raw`(?<![\w])(?:\+?\d[\d ().-]{5,}\d|\(\d{2,4}\)[ .-]*\d[\d .-]{4,}\d)(?:[ \t]*(?:ext\.?|x|#)[ \t]*\d+)?(?![\w])`;

function phoneHref(value: string, context: string): string | null {
  if (IDENTIFIER_LABEL.test(context) || /^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const extension = value.match(/[ \t]*(?:ext\.?|x|#)[ \t]*(\d+)$/i);
  const number = extension ? value.slice(0, extension.index).trim() : value.trim();
  const digits = number.replace(/\D/g, "");
  const hasPhoneLabel = CONTACT_LABEL.test(context);
  if (digits.length < (hasPhoneLabel ? 7 : 10) || digits.length > 15) return null;
  if (!hasPhoneLabel && !/[()+.-]/.test(number)) return null;
  return `tel:${number.startsWith("+") ? "+" : ""}${digits}${extension ? `;ext=${extension[1]}` : ""}`;
}

/** Link visible contact values without treating dates, ZIP codes, or IDs as phone numbers. */
export function splitEventDetailLinks(text: string, label = ""): EventDetailSegment[] {
  if (!text) return [];
  if (
    LOCATION_LABEL.test(label.trim()) &&
    !/\b(?:tbd|tbc|to be confirmed|to be announced)\b/i.test(text) &&
    !/(?:https?:\/\/|www\.|@)/i.test(text)
  ) {
    return [{ text, kind: "address" }];
  }
  const pattern = new RegExp(
    String.raw`https?:\/\/[^\s<>]+|www\.[^\s<>]+|${EMAIL}|${ADDRESS}|${PHONE}`,
    "giu",
  );
  const segments: EventDetailSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const raw = match[0];
    const index = match.index;
    let value = raw;
    let segment: EventDetailSegment | null = null;
    if (/^(?:https?:\/\/|www\.)/i.test(raw)) {
      value = raw.replace(/[.,;!?)]+$/, "");
      segment = {
        text: value,
        kind: "website",
        href: /^www\./i.test(value) ? `https://${value}` : value,
      };
    } else if (new RegExp(`^${EMAIL}$`, "i").test(raw)) {
      segment = { text: value, kind: "email", href: `mailto:${value}` };
    } else if (new RegExp(`^${STREET}`, "iu").test(raw)) {
      segment = { text: value, kind: "address" };
    } else {
      const prefix =
        text
          .slice(Math.max(0, index - 35), index)
          .split(/[\n;]/)
          .pop() || "";
      const href = phoneHref(raw, `${label} ${prefix}`);
      if (href) segment = { text: value, kind: "phone", href };
    }
    if (!segment) continue;
    if (index > cursor) segments.push({ text: text.slice(cursor, index) });
    segments.push(segment);
    cursor = index + value.length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

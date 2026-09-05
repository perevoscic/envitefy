import type { TravelAccommodationHotel } from "./travel-accommodation-discovery";

export const HOTEL_FIELDS = [
  "name",
  "address",
  "imageUrl",
  "distanceFromVenue",
  "groupRate",
  "parking",
  "breakfast",
  "reservationDeadline",
  "phone",
  "bookingInstructions",
  "bookingUrl",
] as const;
export type HotelField = (typeof HOTEL_FIELDS)[number];
export type HotelEvidence = {
  sourceUrl: string | null;
  sourceId: string;
  pageNumber: number | null;
  quote: string;
  value: string;
  method: "text" | "link" | "model";
};
export type HotelSource = {
  id: string;
  url: string | null;
  parentUrl: string | null;
  parentId?: string | null;
  pageNumber: number | null;
  type: "pdf" | "web";
  checkedAt: string;
};
export type HotelContext = {
  sourceUrl?: string | null;
  sourceId?: string;
  pageNumber?: number | null;
  sourceType?: "pdf" | "web";
  links?: HotelLink[];
};
export type HotelLink = {
  url: string;
  label?: string | null;
  contextText?: string | null;
  sourceUrl?: string | null;
  pageNumber?: number | null;
  sectionHeading?: string | null;
};

export function hotelDeadlineIso(value: string | null): string | null {
  if (!value) return null;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const words = value.match(/^([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/i);
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  const year = Number(iso?.[1] || words?.[3]);
  const month = iso
    ? Number(iso[2])
    : words
      ? months.indexOf(words[1].slice(0, 3).toLowerCase()) + 1
      : 0;
  const day = Number(iso?.[3] || words?.[2]);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  return date.toISOString().slice(0, 10);
}

export function hotelId(name: string): string {
  let hash = 5381;
  for (const char of name.toLowerCase().replace(/[^a-z0-9]/g, ""))
    hash = (hash * 33) ^ char.charCodeAt(0);
  return `hotel-${(hash >>> 0).toString(36)}`;
}

/** Keep group codes, case-sensitive paths, query parameters and section anchors. */
export function hotelUrl(value: unknown, base?: string | null): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim(), base || undefined);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function hotelLine(value: string): string {
  return value
    .replace(/^\s*(?:#{1,6}\s*|[-*•]\s+)/, "")
    .replace(/\*\*|__/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
export const HOTEL_SECTION =
  /^(?:(?:host|official|recommended|historic district)\s+)?hotels?(?:\s+(?:information|info|list|accommodations))?$|^(?:hotels?\s*(?:&|and)\s*travel|travel(?:\s+accommodations?|\s+information)?|lodging|accommodations?)$/i;
const BOUNDARY =
  /^(?:local attractions|things to do|parking(?: information)?|traffic(?: & arrival)?|quick access|documents|results|admission(?: & sales)?|spectator(?: information)?|venue details|event info|photo(?:\/video| gallery)?|vendors?|sponsors?|meet our sponsors)\s*:??$/i;
const NAME =
  /\b(?:hotel|hilton|hampton|hyatt|indigo|aloft|homewood|springhill|fairfield|courtyard|doubletree|embassy|holiday inn|marriott|suites|inn|resort|lodge|westin|sheraton)\b/i;
const BOOK = /\b(?:book|reserve|reservation)\b/i;
export function hotelEvidenceContent(content: string): string {
  const lines = content.split(/\n/);
  const start = lines.findIndex((line) => HOTEL_SECTION.test(hotelLine(line).replace(/:$/, "")));
  if (start < 0) return content.slice(0, 24000);
  const end = lines.findIndex((line, index) => index > start && BOUNDARY.test(hotelLine(line)));
  return lines
    .slice(start, end < 0 ? undefined : end)
    .join("\n")
    .slice(0, 24000);
}
export function hotelName(line: string): boolean {
  return (
    line.length >= 3 &&
    line.length <= 110 &&
    NAME.test(line) &&
    !HOTEL_SECTION.test(line) &&
    !BOOK.test(line) &&
    !/:|\$/.test(line)
  );
}

export function markdownHotelLinks(text: string, base?: string | null): HotelLink[] {
  return [
    ...text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s]+?|\/[^\s]*?)(?:\s+"[^"]*")?\)(?=\s|$)/g),
  ].flatMap((match) => {
    const url = hotelUrl(match[2], base);
    return url ? [{ url, label: match[1], contextText: text, sourceUrl: base }] : [];
  });
}

export function evidenceFor(
  field: HotelField,
  value: string,
  quote: string,
  context: HotelContext,
  method: HotelEvidence["method"] = "text",
): Partial<Record<HotelField, HotelEvidence[]>> {
  return {
    [field]: [
      {
        value,
        quote,
        sourceUrl: context.sourceUrl || null,
        sourceId: context.sourceId || context.sourceUrl || "uploaded-pdf",
        pageNumber: context.pageNumber ?? null,
        method,
      },
    ],
  };
}

/** Only explicit hotel blocks; a booking CTA and a nearby attraction are never hotel names. */
export function parseHotelEvidence(
  content: string,
  context: HotelContext = {},
): TravelAccommodationHotel[] {
  const rows = content
    .replace(/\r\n?/g, "\n")
    .split(/\n+/)
    .map((raw) => ({ raw, text: hotelLine(raw) }))
    .filter((row) => row.text);
  const section = rows.findIndex((row) => HOTEL_SECTION.test(row.text.replace(/:$/, "")));
  if (section < 0) return [];
  const cards: (typeof rows)[] = [];
  let current: typeof rows = [];
  for (const row of rows.slice(section + 1)) {
    if (BOUNDARY.test(row.text)) break;
    if (/^#{1,2}\s/.test(row.raw) && !HOTEL_SECTION.test(row.text) && !hotelName(row.text)) break;
    const inline = row.text.replace(/\s*\[[^\]]+\]\([\s\S]*$/, "");
    if (hotelName(inline)) {
      if (current.length) cards.push(current);
      current = [{ ...row, text: inline }];
      const tail = row.text.slice(inline.length).trim();
      if (tail) current.push({ raw: tail, text: tail });
    } else if (current.length && !HOTEL_SECTION.test(row.text) && row.text !== "#")
      current.push(row);
  }
  if (current.length) cards.push(current);
  return cards.map((card) => {
    const name = card[0].text;
    const hotel: TravelAccommodationHotel = {
      id: hotelId(name),
      name,
      address: null,
      imageUrl: null,
      distanceFromVenue: null,
      groupRate: null,
      parking: null,
      breakfast: null,
      reservationDeadline: null,
      phone: null,
      bookingInstructions: null,
      bookingUrl: null,
      notes: [],
      sourceType: context.sourceType || "web",
      contentOrigin: "source_text",
      confidence: 0.9,
      evidence: evidenceFor("name", name, card[0].raw, context),
    };
    const set = (
      field: HotelField,
      value: string,
      raw: string,
      method: HotelEvidence["method"] = "text",
    ) => {
      if (!value) return;
      hotel[field] = value;
      hotel.evidence = { ...hotel.evidence, ...evidenceFor(field, value, raw, context, method) };
    };
    for (const row of card.slice(1)) {
      let consumed = false;
      const definitions: Array<[HotelField, RegExp]> = [
        ["distanceFromVenue", /^(?:distance from venue|distance)\s*:\s*(.+)/i],
        ["groupRate", /^(?:group rates?|rates?)\s*:\s*(.+)/i],
        ["parking", /^parking\s*:\s*(.+)/i],
        ["breakfast", /^breakfast\s*:\s*(.+)/i],
        [
          "reservationDeadline",
          /^(?:reservation deadline|booking deadline|deadline to book|book by)\s*:\s*(.+)/i,
        ],
        ["address", /^(?:hotel address|address)\s*:\s*(.+)/i],
      ];
      for (const [field, pattern] of definitions) {
        const match = row.text.match(pattern);
        if (match) {
          set(field, match[1], row.raw);
          consumed = true;
          break;
        }
      }
      const phone = row.text.match(/(?:\+1[ .-]?)?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}/);
      if (!consumed && phone) {
        set("phone", phone[0], row.raw);
        const instructions = row.text
          .slice((phone.index || 0) + phone[0].length)
          .replace(/^[;,\s]+/, "");
        if (instructions) set("bookingInstructions", instructions, row.raw);
        consumed = true;
      }
      if (
        !consumed &&
        /^\d{1,6}\s+.+\b(?:st(?:reet)?|ave(?:nue)?|road|rd|drive|dr|blvd|boulevard|way|place|lane)\b/i.test(
          row.text,
        )
      ) {
        set("address", row.text, row.raw);
        consumed = true;
      }
      const links = markdownHotelLinks(row.raw, context.sourceUrl);
      const booking = links.find(
        (link) => BOOK.test(link.label || "") || hotelName(link.label || ""),
      );
      if (booking) {
        set("bookingUrl", booking.url, row.raw, "link");
        consumed = true;
      }
      const plainUrl = /^https?:\/\/\S+$/.test(row.text) ? hotelUrl(row.text) : null;
      if (
        plainUrl &&
        (BOOK.test(card.map((item) => item.text).join(" ")) ||
          /book|reserve|hotel|passkey/i.test(plainUrl))
      ) {
        set("bookingUrl", plainUrl, row.raw, "link");
        consumed = true;
      }
      if (!consumed && !BOOK.test(row.text) && !/^https?:\/\//.test(row.text))
        hotel.notes.push(row.text);
    }
    if (!hotel.bookingUrl) {
      const links = (context.links || []).filter(
        (link) =>
          (!context.pageNumber || !link.pageNumber || context.pageNumber === link.pageNumber) &&
          hotelLine(link.contextText || link.label || "")
            .toLowerCase()
            .includes(name.toLowerCase()),
      );
      const urls = [
        ...new Set(links.map((link) => hotelUrl(link.url, context.sourceUrl)).filter(Boolean)),
      ];
      if (urls.length === 1 && urls[0])
        set("bookingUrl", urls[0], links[0].contextText || links[0].label || urls[0], "link");
    }
    return hotel;
  });
}

export type HotelProjection = Partial<Record<HotelField, string | null>> & {
  name: string;
  id?: string;
  discoveredValues?: Partial<Record<HotelField, string | null>>;
  editedFields?: HotelField[];
};

/** Preserve explicit clears and edits, and do not re-add hotels deleted from the last projection. */
export function projectTravelHotels(
  discovered: HotelProjection[],
  existing: HotelProjection[] = [],
  previousIds: string[] = [],
) {
  const hotels = discovered
    .filter(
      (hotel) =>
        !previousIds.includes(hotel.id || hotelId(hotel.name)) ||
        existing.some(
          (item) => (item.id || hotelId(item.name)) === (hotel.id || hotelId(hotel.name)),
        ),
    )
    .map((hotel) => {
      const id = hotel.id || hotelId(hotel.name);
      const old = existing.find((item) => (item.id || hotelId(item.name)) === id);
      const next: HotelProjection = {
        ...hotel,
        id,
        discoveredValues: Object.fromEntries(
          HOTEL_FIELDS.map((field) => [field, hotel[field] ?? null]),
        ),
      };
      const edited = new Set(old?.editedFields || []);
      if (old)
        for (const field of HOTEL_FIELDS) {
          if (field in old && (!old.discoveredValues || old[field] !== old.discoveredValues[field]))
            edited.add(field);
          if (edited.has(field)) {
            if (field === "name") next.name = old.name;
            else next[field] = old[field] ?? null;
          }
        }
      next.editedFields = [...edited];
      return next;
    });
  for (const old of existing)
    if (!hotels.some((item) => item.id === (old.id || hotelId(old.name)))) hotels.push(old);
  return { hotels, discoveredHotelIds: discovered.map((hotel) => hotel.id || hotelId(hotel.name)) };
}

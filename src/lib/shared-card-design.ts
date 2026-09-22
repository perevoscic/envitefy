/** A background and typography recipe shared by the Live Card and its invitation. */
export type SharedCardDesign = {
  version: 1;
  backgroundUrl: string;
  font: "classic" | "modern" | "playful";
  ink: string;
  accent: string;
  surface: string;
};

export const CARD_WIDTH = 1000;
export const CARD_HEIGHT = 1500;
export const CARD_FONTS = {
  classic: { family: "EnvitefyCardClassic", url: "/fonts/birthday/playfairdisplay.ttf" },
  modern: { family: "EnvitefyCardModern", url: "/fonts/birthday/spacegrotesk.ttf" },
  playful: { family: "EnvitefyCardPlayful", url: "/fonts/birthday/quicksand.ttf" },
  body: { family: "EnvitefyCardBody", url: "/fonts/birthday/montserrat.ttf" },
} as const;

export function readSharedCardDesign(value: unknown): SharedCardDesign | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const raw = value as Record<string, unknown>;
  if (
    raw.version !== 1 ||
    typeof raw.backgroundUrl !== "string" ||
    !/^(?:https?:\/\/|data:image\/(?:webp|png|jpeg);base64,|\/(?!\/))/.test(raw.backgroundUrl)
  )
    return;
  const color = (key: string, fallback: string) =>
    typeof raw[key] === "string" && /^#[\da-f]{6}$/i.test(raw[key]) ? raw[key] : fallback;
  return {
    version: 1,
    backgroundUrl: raw.backgroundUrl,
    font: raw.font === "modern" || raw.font === "playful" ? raw.font : "classic",
    ink: color("ink", "#342332"),
    accent: color("accent", "#895c42"),
    surface: color("surface", "#fff6ee"),
  };
}

export type CardTextSource = {
  title?: string;
  headlineIntro?: string;
  sharedDesign?: SharedCardDesign;
  eventDetails?: {
    product?: string;
    eventDate?: string;
    startTime?: string;
    endTime?: string;
    calendarEndISO?: string;
    timezone?: string;
    venueName?: string;
    location?: string;
    detailsDescription?: string;
    guestInstructions?: string[];
    rsvpEnabled?: boolean;
    rsvpName?: string;
    rsvpContact?: string;
    rsvpUrl?: string;
    rsvpDeadline?: string;
    registryLink?: string;
    giftNote?: string;
    additionalLocations?: unknown;
  } | null;
};
export type CardTextContent = { intro: string; title: string; paragraphs: string[] };

function localDate(date: string | undefined): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return date || "";
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isFinite(parsed.getTime())
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(parsed)
    : date;
}
function localTime(time: string | undefined): string {
  if (!time) return "";
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return time;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
}

export function sharedCardContent(source: CardTextSource): CardTextContent {
  const event = source.eventDetails || {};
  let endDate = "";
  if (event.calendarEndISO && event.timezone) {
    try {
      endDate = new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: event.timezone,
      }).format(new Date(event.calendarEndISO));
    } catch {
      /* Leave unknown dates out. */
    }
  }
  const more = Array.isArray(event.additionalLocations)
    ? event.additionalLocations.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const location = item as Record<string, unknown>;
        return [
          [
            location.label,
            location.timeText,
            location.venue,
            location.address || location.location,
            location.description,
          ]
            .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
            .join("\n"),
        ];
      })
    : [];
  return {
    intro: source.headlineIntro ?? "You're invited",
    title: source.title || "",
    paragraphs: [
      event.detailsDescription || "",
      [
        localDate(event.eventDate),
        [
          localTime(event.startTime),
          endDate && endDate !== event.eventDate
            ? `${localDate(endDate)}, ${localTime(event.endTime)}`
            : localTime(event.endTime),
        ]
          .filter(Boolean)
          .join(" – "),
      ]
        .filter(Boolean)
        .join("\n"),
      [event.venueName, event.location].filter(Boolean).join("\n"),
      ...more,
      ...(event.guestInstructions || []),
      event.rsvpEnabled
        ? [
            event.rsvpName ? `RSVP to ${event.rsvpName}` : "RSVP",
            event.rsvpContact || event.rsvpUrl,
            event.rsvpDeadline ? `Reply by ${localDate(event.rsvpDeadline)}` : "",
          ]
            .filter(Boolean)
            .join("\n")
        : "",
      event.registryLink
        ? ["Registry", event.registryLink, event.giftNote].filter(Boolean).join("\n")
        : "",
    ]
      .map((text) => text.trim())
      .filter(Boolean),
  };
}

export type CardTextLine = {
  text: string;
  x: number;
  y: number;
  size: number;
  font: string;
  color: string;
  weight: number;
};
export type CardTextLayout = { lines: CardTextLine[]; overflow: boolean };
export type CardTextMeasure = (text: string, size: number, font: string, weight: number) => number;

function wrap(
  text: string,
  size: number,
  font: string,
  weight: number,
  measure: CardTextMeasure,
): string[] {
  return text.split(/\r?\n/).flatMap((paragraph) => {
    const lines: string[] = [];
    let line = "";
    for (const word of paragraph.trim().split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && measure(next, size, font, weight) > 740) {
        lines.push(line);
        line = "";
      }
      // Break long URLs/words without dropping any characters.
      if (measure(word, size, font, weight) > 740) {
        if (line) {
          lines.push(line);
          line = "";
        }
        for (const letter of word) {
          if (line && measure(line + letter, size, font, weight) > 740) {
            lines.push(line);
            line = "";
          }
          line += letter;
        }
      } else line = line ? `${line} ${word}` : word;
    }
    if (line) lines.push(line);
    return lines;
  });
}

/** Same geometry and measured line breaks for preview and export. Never ellipsize facts. */
export function layoutSharedCard(
  design: SharedCardDesign,
  content: CardTextContent,
  mode: "live_card" | "digital_flyer",
  measure: CardTextMeasure,
): CardTextLayout {
  const headingFont = CARD_FONTS[design.font].family;
  const bodyFont = CARD_FONTS.body.family;
  const lines: CardTextLine[] = [];
  const intro = wrap(content.intro, 27, bodyFont, 600, measure);
  intro.forEach((text, index) => {
    lines.push({
      text,
      x: 500,
      y: 230 + index * 36,
      size: 27,
      font: bodyFont,
      weight: 600,
      color: design.accent,
    });
  });
  let size = 90;
  let title = wrap(content.title, size, headingFont, 600, measure);
  while (title.length * size * 1.12 > 290 && size > 44) {
    size -= 2;
    title = wrap(content.title, size, headingFont, 600, measure);
  }
  let y = Math.max(310, 260 + intro.length * 36);
  title.forEach((text) => {
    lines.push({ text, x: 500, y, size, font: headingFont, weight: 600, color: design.ink });
    y += size * 1.12;
  });
  if (mode === "live_card") return { lines, overflow: y > 1050 };
  const startY = y + 34;
  let bodySize = 34;
  const paragraphsAt = (fontSize: number) =>
    content.paragraphs.map((text) => wrap(text, fontSize, bodyFont, 400, measure));
  let paragraphs = paragraphsAt(bodySize);
  const height = () =>
    paragraphs.reduce((sum, paragraph) => sum + paragraph.length * bodySize * 1.38 + 26, 0);
  while (startY + height() > 1310 && bodySize > 28) {
    bodySize -= 1;
    paragraphs = paragraphsAt(bodySize);
  }
  y = startY;
  for (const paragraph of paragraphs) {
    for (const text of paragraph) {
      lines.push({
        text,
        x: 500,
        y,
        size: bodySize,
        font: bodyFont,
        weight: 400,
        color: design.ink,
      });
      y += bodySize * 1.38;
    }
    y += 26;
  }
  return { lines, overflow: y > 1310 };
}

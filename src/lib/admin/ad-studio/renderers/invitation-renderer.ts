import type { InvitationDesign } from "@/lib/admin/ad-studio/types";

const EVENT_LABELS: Record<string, string> = {
  "baby-shower": "Baby Shower",
  wedding: "Wedding",
  birthday: "Birthday",
  graduation: "Graduation",
  "gymnastics-meet": "Meet Day",
  "sports-event": "Game Day",
  "school-event": "School Event",
  "open-house": "Open House",
  "local-business-event": "Local Event",
  "general-event": "You're Invited",
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textLines(value: string, maxChars: number, maxLines: number): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.length ? lines : [""];
}

function compact(value: string, maxLength: number): string {
  const text = value.trim().replace(/\s+/g, " ");
  return text.length > maxLength ? text.slice(0, maxLength).trim() : text;
}

function shortTheme(design: InvitationDesign): string {
  const eventLabel = EVENT_LABELS[design.metadata.eventType] || "You're Invited";
  const theme = compact(design.theme, 28);
  if (!theme || theme.length > 24 || /\bwith\b/i.test(theme)) return eventLabel;
  return theme;
}

function fontSizeFor(lines: string[], base: number, min: number, maxLineChars: number): number {
  const longest = Math.max(...lines.map((line) => line.length), 0);
  const overage = Math.max(0, longest - maxLineChars);
  return Math.max(min, base - overage * 2 - Math.max(0, lines.length - 2) * 8);
}

function svgText({
  lines,
  x,
  y,
  size,
  lineHeight,
  fill,
  weight = 700,
  anchor = "middle",
  family = "Inter, Arial, sans-serif",
}: {
  lines: string[];
  x: number;
  y: number;
  size: number;
  lineHeight: number;
  fill: string;
  weight?: number;
  anchor?: "middle" | "start";
  family?: string;
}) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXml(line)}</text>`,
    )
    .join("");
}

export function renderInvitationSvg(design: InvitationDesign): string {
  const width = 700;
  const height = 980;
  const palette = design.colorPalette;
  const eyebrow = shortTheme(design).toUpperCase();
  const titleLines = textLines(design.fields.title, 17, 3);
  const subtitleLines = textLines(design.fields.subtitle, 34, 3);
  const locationLines = textLines(design.fields.location, 30, 2);
  const rsvpLines = textLines(design.fields.rsvp, 30, 1);
  const registryLines = design.fields.registry ? textLines(design.fields.registry, 30, 1) : [];
  const titleSize = fontSizeFor(titleLines, 74, 52, 15);
  const titleLineHeight = Math.round(titleSize * 1.04);
  const titleBlockHeight = (titleLines.length - 1) * titleLineHeight;
  const titleY = 236;
  const subtitleY = 320 + titleBlockHeight;
  const detailsY = subtitleY + 108;
  const locationY = detailsY + 152;
  const rsvpY = locationY + 96;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="paper" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.background}"/>
      <stop offset="0.56" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="${palette.accentSoft}"/>
    </linearGradient>
    <linearGradient id="wash" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${palette.accentSoft}" stop-opacity="0.72"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#0F172A" flood-opacity="0.14"/>
    </filter>
    <filter id="texture" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.028"/>
      </feComponentTransfer>
    </filter>
    <clipPath id="cardClip">
      <rect x="42" y="42" width="${width - 84}" height="${height - 84}" rx="32"/>
    </clipPath>
  </defs>
  <rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="34" fill="url(#paper)" filter="url(#shadow)"/>
  <rect x="42" y="42" width="${width - 84}" height="${height - 84}" rx="32" fill="#FFFDFB" stroke="${palette.accent}" stroke-opacity="0.2" stroke-width="2"/>
  <g clip-path="url(#cardClip)">
    <rect x="42" y="42" width="${width - 84}" height="${height - 84}" fill="#FFFFFF"/>
    <rect x="42" y="42" width="${width - 84}" height="${height - 84}" fill="url(#paper)"/>
    <rect x="42" y="42" width="${width - 84}" height="${height - 84}" filter="url(#texture)" opacity="0.8"/>
    <circle cx="86" cy="94" r="118" fill="url(#wash)"/>
    <circle cx="614" cy="118" r="92" fill="${palette.accentSoft}" opacity="0.55"/>
    <circle cx="606" cy="804" r="128" fill="${palette.accent}" opacity="0.08"/>
    <circle cx="92" cy="858" r="88" fill="${palette.accentSoft}" opacity="0.54"/>
  </g>
  <path d="M116 188c44-48 92-55 142-20M446 184c52-36 98-28 138 22" stroke="${palette.accent}" stroke-width="3" stroke-linecap="round" opacity="0.18" fill="none"/>
  <path d="M104 706c20-34 45-44 76-30M524 690c32-26 62-24 90 6" stroke="${palette.accent}" stroke-width="3" stroke-linecap="round" opacity="0.16" fill="none"/>
  <circle cx="148" cy="138" r="7" fill="${palette.accent}" opacity="0.18"/>
  <circle cx="552" cy="176" r="6" fill="${palette.accent}" opacity="0.22"/>
  <circle cx="540" cy="824" r="8" fill="${palette.accent}" opacity="0.18"/>
  <rect x="162" y="96" width="376" height="54" rx="27" fill="#FFFFFF" fill-opacity="0.76" stroke="${palette.accent}" stroke-opacity="0.16"/>
  <text x="350" y="130" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="900" letter-spacing="4" fill="${palette.accent}">${escapeXml(eyebrow)}</text>
  ${svgText({
    lines: titleLines,
    x: 350,
    y: titleY,
    size: titleSize,
    lineHeight: titleLineHeight,
    fill: palette.text,
    weight: 900,
    family: "Georgia, Times New Roman, serif",
  })}
  ${svgText({
    lines: subtitleLines,
    x: 350,
    y: subtitleY,
    size: 27,
    lineHeight: 35,
    fill: palette.muted,
    weight: 700,
  })}
  <line x1="188" y1="${detailsY - 54}" x2="512" y2="${detailsY - 54}" stroke="${palette.accent}" stroke-opacity="0.22" stroke-width="2"/>
  <rect x="112" y="${detailsY}" width="476" height="128" rx="32" fill="#FFFFFF" fill-opacity="0.82" stroke="${palette.accent}" stroke-opacity="0.16"/>
  <text x="350" y="${detailsY + 52}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="900" fill="${palette.text}">${escapeXml(compact(design.fields.date, 30))}</text>
  <text x="350" y="${detailsY + 92}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="900" fill="${palette.accent}">${escapeXml(compact(design.fields.time, 30))}</text>
  <text x="350" y="${locationY}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="900" letter-spacing="3" fill="${palette.accent}">LOCATION</text>
  ${svgText({
    lines: locationLines,
    x: 350,
    y: locationY + 42,
    size: 23,
    lineHeight: 30,
    fill: palette.text,
    weight: 800,
  })}
  <rect x="172" y="${rsvpY}" width="356" height="58" rx="29" fill="${palette.accent}"/>
  ${svgText({
    lines: rsvpLines,
    x: 350,
    y: rsvpY + 37,
    size: 21,
    lineHeight: 24,
    fill: "#FFFFFF",
    weight: 900,
  })}
  ${
    registryLines.length
      ? svgText({
          lines: registryLines,
          x: 350,
          y: rsvpY + 96,
          size: 19,
          lineHeight: 26,
          fill: palette.muted,
          weight: 700,
        })
      : ""
  }
  ${
    design.metadata.qrPlaceholder
      ? `<rect x="528" y="828" width="74" height="74" rx="16" fill="#FFFFFF" fill-opacity="0.86" stroke="${palette.accent}" stroke-opacity="0.18"/><path d="M544 844h16v16h-16zM574 844h12v12h-12zM544 874h12v12h-12zM572 870h18v18h-18z" fill="${palette.accent}" fill-opacity="0.52"/>`
      : ""
  }
</svg>`;
}

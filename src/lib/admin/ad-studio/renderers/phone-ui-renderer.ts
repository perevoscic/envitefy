import type { PhoneUIDesign } from "@/lib/admin/ad-studio/types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fit(value: string, maxLength: number): string {
  const text = value.trim().replace(/\s+/g, " ");
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…` : text;
}

export function renderPhoneUiSvg(design: PhoneUIDesign): string {
  const width = 420;
  const height = 860;
  const tokens = design.themeTokens;
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="phoneBg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${tokens.background}"/>
      <stop offset="1" stop-color="#F8FAFC"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" rx="46" fill="#020617"/>
  <rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="36" fill="url(#phoneBg)"/>
  <rect x="150" y="34" width="120" height="20" rx="10" fill="#020617" fill-opacity="0.78"/>
  <text x="44" y="88" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="900" fill="${tokens.primary}">Envitefy</text>
  <rect x="44" y="118" width="332" height="216" rx="28" fill="${tokens.surface}" stroke="#E2E8F0"/>
  <text x="68" y="164" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="800" fill="${tokens.primary}">${escapeXml(fit(design.eventPageCard.subtitle, 28))}</text>
  <text x="68" y="214" font-family="Inter, Arial, sans-serif" font-size="31" font-weight="900" fill="${tokens.text}">${escapeXml(fit(design.eventPageCard.title, 18))}</text>
  <text x="68" y="258" font-family="Inter, Arial, sans-serif" font-size="19" font-weight="800" fill="${tokens.text}">${escapeXml(design.eventPageCard.date)} · ${escapeXml(design.eventPageCard.time)}</text>
  <text x="68" y="294" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="700" fill="${tokens.muted}">${escapeXml(fit(design.eventPageCard.location, 30))}</text>
  <rect x="44" y="360" width="332" height="62" rx="20" fill="${tokens.primary}"/>
  <text x="210" y="399" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="900" fill="${tokens.primaryText}">${escapeXml(design.ctaButtonText)}</text>
  <rect x="44" y="450" width="154" height="116" rx="24" fill="${tokens.surface}" stroke="#E2E8F0"/>
  <text x="68" y="490" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="800" fill="${tokens.muted}">${escapeXml(design.rsvpModule.label)}</text>
  <text x="68" y="536" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="900" fill="${tokens.text}">${design.rsvpModule.yesCount}</text>
  <text x="116" y="536" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="800" fill="${tokens.muted}">yes</text>
  <rect x="222" y="450" width="154" height="116" rx="24" fill="${tokens.surface}" stroke="#E2E8F0"/>
  <text x="246" y="490" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="800" fill="${tokens.muted}">${escapeXml(design.shareModule.label)}</text>
  <text x="246" y="532" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="900" fill="${tokens.text}">${escapeXml(fit(design.shareModule.shareText, 14))}</text>
  <rect x="44" y="596" width="332" height="92" rx="24" fill="${tokens.surface}" stroke="#E2E8F0"/>
  <text x="68" y="634" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="800" fill="${tokens.primary}">${escapeXml(design.locationCard.label)}</text>
  <text x="68" y="670" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" fill="${tokens.text}">${escapeXml(fit(design.locationCard.address, 31))}</text>
  ${
    design.registryCard
      ? `<rect x="44" y="716" width="332" height="76" rx="24" fill="${tokens.surface}" stroke="#E2E8F0"/>
  <text x="68" y="748" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="800" fill="${tokens.primary}">${escapeXml(design.registryCard.label)}</text>
  <text x="68" y="777" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="900" fill="${tokens.text}">${escapeXml(design.registryCard.urlLabel)}</text>`
      : ""
  }
</svg>`;
}

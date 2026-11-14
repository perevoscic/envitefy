export type VenuePhotoPermission = {
  version: 1;
  use: "event-promotion";
  termsUrl: string;
  imageUrl: string;
  statement: string;
  checkedAt: string;
};

function explicitEventPhotoGrant(statement: string): boolean {
  const [grant, ...restrictions] = statement.split(/\.\s+/);
  // Only these restrictions have an unambiguous scope outside the permitted use.
  if (restrictions.some(clause => !/^(?:all other (?:uses|usages) are (?:forbidden|prohibited) without (?:the )?prior written (?:consent|permission) of [\p{L}\p{N} '&-]+(?:, and will constitute copyright infringement)?|use of images for resale is strictly forbidden)\.?$/iu.test(clause))) return false;
  // Narrow positive grants only. Conditional credit/approval requirements need a
  // human review; they cannot be satisfied by assuming that a source link is enough.
  if (/\b(?:credit|attribution|provided|subject to|approval|required|requires?|must|non.?commercial|personal use|non.?profit|permission|consent)\b/i.test(grant)) return false;
  if (/\b(?:may not|must not|cannot|not permitted|not allowed|forbidden|prohibited)\b/i.test(grant)) return false;
  return /\b(?:photos?|photographs?|images?)[^.]{0,200}\b(?:may be used|can be used|are (?:only )?to be used)[^.]{0,180}\b(?:marketing\s*\/\s*promotional\s+event materials|promotional\s+event materials|event\s+(?:marketing|promotion|promotional materials))\b/i.test(grant);
}

/** Reuse the already-fetched image source page; no research or provider calls. */
export function verifyVenuePhotoPermission(html: string, sourceUrl: string, imageUrl: string): VenuePhotoPermission | undefined {
  const visible = html.replace(/<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(?:p|div|h[1-6]|li)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ").replace(/&(?:nbsp|amp|quot|#39);/gi, " ")
    .split("\n").map(line => line.replace(/\s+/g, " ").trim()).join("\n").trim();
  const heading = /\b(?:image|photo|photograph)(?:s|graphy)?\s+(?:usage|use)\s+(?:terms(?:\s+and\s+conditions)?|permission|policy)\s*:?\s*/i.exec(visible);
  if (!heading) return;
  const paragraphs = visible.slice(heading.index + heading[0].length).trim().split("\n").filter(Boolean);
  const terms = [paragraphs[0]];
  for (const paragraph of paragraphs.slice(1, 4)) {
    if (!/\b(?:permission|consent|copyright|credit|attribution|licen[sc]e|approval|use|usage|resale|commercial|rights|conditions|restriction)\b/i.test(paragraph)) break;
    terms.push(paragraph);
  }
  const statement = terms.join(" ").trim();
  if (!statement || statement.length > 1500 || !explicitEventPhotoGrant(statement)) return;
  return { version: 1, use: "event-promotion", termsUrl: sourceUrl, imageUrl, statement, checkedAt: new Date().toISOString() };
}

export function readVenuePhotoPermission(value: unknown, sourceUrl: string, imageUrl: string): VenuePhotoPermission | undefined {
  if (!value || typeof value !== "object") return;
  const raw = value as VenuePhotoPermission;
  if (raw.version !== 1 || raw.use !== "event-promotion" || raw.termsUrl !== sourceUrl || raw.imageUrl !== imageUrl ||
    typeof raw.statement !== "string" || raw.statement.length > 1500 || !explicitEventPhotoGrant(raw.statement) ||
    typeof raw.checkedAt !== "string" || !Number.isFinite(Date.parse(raw.checkedAt))) return;
  return { version: 1, use: "event-promotion", termsUrl: sourceUrl, imageUrl, statement: raw.statement, checkedAt: raw.checkedAt };
}

import { ENVITEFY_BRAND_ASSETS } from "./brand-assets.ts";
import { ENVITEFY_SOCIAL_LINKS } from "./envitefy-social-links.ts";

/** Email appearance is owned by the inbox, independently of the website theme. */
export const CURRENT_EMAIL_DESIGN_VERSION = "adaptive-v1" as const;
export type EmailDesignVersion = "legacy" | typeof CURRENT_EMAIL_DESIGN_VERSION;

/** Missing persisted metadata deliberately identifies an existing, legacy composition. */
export function persistedEmailDesignVersion(value: unknown): EmailDesignVersion {
  return value === CURRENT_EMAIL_DESIGN_VERSION ? CURRENT_EMAIL_DESIGN_VERSION : "legacy";
}

export const EMAIL_COLORS = {
  canvas: "#F5F2FF", surface: "#FFFFFF", detail: "#F9FAFB", text: "#302738",
  muted: "#655A70", border: "#E8E1FF", link: "#67459E",
  band: "#251F2D", white: "#FFFFFF", primary: "#C5A7FF", primaryText: "#25103E",
  darkCanvas: "#181818", darkSurface: "#251F2D", darkDetail: "#302738",
  darkText: "#F2EAFA", darkMuted: "#C0B3D0", darkBorder: "#51435F",
} as const;

export const EMAIL_WHITE_ASSETS = {
  symbol: ENVITEFY_BRAND_ASSETS.symbol.emailWhiteMatteWebp,
  wordmark: ENVITEFY_BRAND_ASSETS.wordmark.emailWhiteMatteWebp,
  social: (name: string) => ENVITEFY_SOCIAL_LINKS.find(link => link.name.toLowerCase() === name.toLowerCase())?.emailWhiteIconSrc.replace(/\.png$/, ".webp") || "",
} as const;

// A solid gradient keeps the button fill paired with its text in auto-darkening
// inboxes; text-fill protects the label when the client rewrites link colors.
const EMAIL_CTA_STYLE = "background-color:#C5A7FF;background-image:linear-gradient(#C5A7FF,#C5A7FF);color:#25103E !important;-webkit-text-fill-color:#25103E !important;";

function protectEmailCtas(html: string): string {
  return html.replace(/<a\b([^>]*(?:data-email-cta|background-color\s*:\s*#7F67D3|class="btn")[^>]*)>([\s\S]*?)<\/a>/gi, (_match, attributes: string, label: string) => {
    let tag = `<a${attributes}>`;
    if (!/data-email-cta\s*=/i.test(tag)) tag = tag.replace(/>$/, ' data-email-cta="primary">');
    if (!/\bclass="[^"]*\bemail-cta\b/i.test(tag)) tag = addClasses(tag, ["email-cta"]);
    tag = /\bstyle="/i.test(tag)
      ? tag.replace(/\bstyle="([^"]*)"/i, (_style, value: string) => `style="${value};${EMAIL_CTA_STYLE}"`)
      : tag.replace(/>$/, ` style="${EMAIL_CTA_STYLE}">`);
    return `${tag}<span class="email-cta-label" style="color:#25103E !important;-webkit-text-fill-color:#25103E !important;">${label}</span></a>`;
  });
}

/** Explicit classes let email clients override inline fallback colors without touching artwork. */
export const ADAPTIVE_EMAIL_CSS = `
:root { color-scheme: light dark; supported-color-schemes: light dark; }
.email-brand-band,.email-footer-band { background-color:#251F2D !important; color:#FFFFFF !important; }
.email-brand-band a,.email-footer-band a,.email-footer-band p,.email-footer-band div { color:#FFFFFF !important; }
.email-cta { background-color:#C5A7FF !important; background-image:linear-gradient(#C5A7FF,#C5A7FF) !important; }
.email-cta,.email-cta-label { color:#25103E !important; -webkit-text-fill-color:#25103E !important; }
.email-link { color:#67459E !important; text-decoration:underline; }
.email-muted { color:#655A70 !important; }
.email-accent { color:#67459E !important; }
@media (prefers-color-scheme: dark) {
  body,.email-canvas,.wrapper { background:#181818 !important; }
  .email-shell,.email-content,.container,.white,.email-surface { background:#251F2D !important; color:#F2EAFA !important; }
  .email-detail,.card { background:#302738 !important; border-color:#51435F !important; }
  .email-text,.h1,.h2,.hero-title,.feature-title,.body { color:#F2EAFA !important; }
  .email-muted,.small,.eyebrow,.legacy-note { color:#C0B3D0 !important; }
  .email-link,.email-accent { color:#C5A7FF !important; }
  .email-border,.divider { border-color:#51435F !important; }
  .email-success { background:#203A32 !important; color:#80D8B3 !important; }
  .email-success-text { color:#80D8B3 !important; }
  .hero { background:linear-gradient(135deg,#462F4D,#233A4E) !important; }
}
[data-ogsc] .email-canvas,[data-ogsc] .wrapper { background:#181818 !important; }
[data-ogsc] .email-surface,[data-ogsc] .email-content,[data-ogsc] .email-shell,[data-ogsc] .container,[data-ogsc] .white { background:#251F2D !important; color:#F2EAFA !important; }
[data-ogsc] .email-detail,[data-ogsc] .card { background:#302738 !important; border-color:#51435F !important; }
[data-ogsc] .email-text,[data-ogsc] .h1,[data-ogsc] .h2,[data-ogsc] .hero-title,[data-ogsc] .feature-title,[data-ogsc] .body { color:#F2EAFA !important; }
[data-ogsc] .email-muted,[data-ogsc] .small,[data-ogsc] .eyebrow,[data-ogsc] .legacy-note { color:#C0B3D0 !important; }
[data-ogsc] .email-link,[data-ogsc] .email-accent { color:#C5A7FF !important; }
[data-ogsc] .email-success { background:#203A32 !important; }
[data-ogsc] .email-success-text { color:#80D8B3 !important; }
[data-ogsc] .email-border,[data-ogsc] .divider { border-color:#51435F !important; }
[data-ogsc] .hero { background:linear-gradient(135deg,#462F4D,#233A4E) !important; }
@media only screen and (max-width:640px) {
  .container { table-layout:fixed; }
  .email-legacy-brand { white-space:normal !important; }
  .email-brand-band img { height:auto !important; }
  .email-showcase-column { display:block !important; width:100% !important; padding:8px 0 !important; }
  .email-showcase-column a,.email-showcase-column span,.email-showcase-column img { width:100% !important; max-width:320px !important; margin-left:auto !important; margin-right:auto !important; }
}
`;

function addClasses(tag: string, classes: string[]): string {
  if (!classes.length) return tag;
  return /\bclass="[^"]*"/i.test(tag)
    ? tag.replace(/\bclass="([^"]*)"/i, (_match, existing: string) => `class="${existing} ${classes.join(" ")}"`)
    : tag.replace(/^(<[\w-]+)/, `$1 class="${classes.join(" ")}"`);
}

/** Annotate our own email fragments only. A host-authored block is an explicit color boundary. */
export function adaptiveEmailBody(html: string): string {
  const authored: string[] = [];
  const protectedHtml = html.replace(/<!-- email-authored:start -->[\s\S]*?<!-- email-authored:end -->/g, block => {
    authored.push(block);
    return `<!-- email-authored:${authored.length - 1} -->`;
  });
  return protectEmailCtas(protectedHtml).replace(/<[a-z][^>]*>/gi, tag => {
    const classes: string[] = [];
    const style = tag.match(/\bstyle="([^"]*)"/i)?.[1] || "";
    if (/background(?:-color)?\s*:\s*#(?:f5f2ff|f3f0ff)/i.test(style)) classes.push("email-canvas");
    if (/(?:background(?:-color)?\s*:\s*#(?:fff(?:fff)?|fbfaff))\b/i.test(style)) classes.push("email-surface");
    if (/background(?:-color)?\s*:\s*#(?:f9fafb|f7f4ff|f5f5f4)/i.test(style)) classes.push("email-detail");
    if (/background(?:-color)?\s*:\s*#f0fdf4/i.test(style)) classes.push("email-success");
    if (/(?:^|;)\s*color\s*:\s*#(?:065f46|047857)/i.test(style)) classes.push("email-success-text");
    if (/(?:^|;)\s*color\s*:\s*#(?:737373|9ca3af|6b7280|5b5675|655a70)/i.test(style)) classes.push("email-muted");
    if (/(?:^|;)\s*color\s*:\s*#(?:7f67d3|9c8be0)/i.test(style)) classes.push("email-accent");
    if (/(?:^|;)\s*color\s*:\s*#(?:4e4e50|111827|2e2c2d|2a1f5c|172033|243047|302738|1f1a37|17112d|3a3552|1c1539|111111|40375d)/i.test(style)) classes.push("email-text");
    if (/^<a\b/i.test(tag) && !/data-email-cta|class="btn"|background(?:-color)?\s*:/i.test(tag)) classes.push("email-link");
    if (/border(?:-[\w-]+)?\s*:[^;]*#/i.test(style)) classes.push("email-border");
    const fallback = /background\s*:\s*linear-gradient\([^;]*#1d1538/i.test(style)
      ? tag.replace(/\bstyle="([^"]*)"/i, (_match, value: string) => `style="${value};background-color:#251F2D;"`)
      : tag;
    return addClasses(fallback, classes);
  }).replace(/<!-- email-authored:(\d+) -->/g, (_match, index: string) => authored[Number(index)]);
}

export function hasEmailCta(html: string): boolean {
  return /data-email-cta\s*=|background-color\s*:\s*#7F67D3/i.test(html);
}

/** Convert a newly composed built-in full document; never run on persisted raw campaign HTML. */
export function adaptiveEmailDocument(html: string): string {
  if (/data-email-design="adaptive-v1"/i.test(html)) return html;
  let out = html
    .replace(/<meta name="(?:color-scheme|supported-color-schemes)"[^>]*>/gi, "")
    .replace(/:root\s*\{[^}]*color-scheme[^}]*\}/gi, "")
    .replace(/color-scheme:light;?/gi, "")
    .replace(/\/email\/envitefy-wordmark-email\.png/g, EMAIL_WHITE_ASSETS.wordmark)
    .replace(/\/email\/social-(instagram|facebook|youtube|tiktok|reddit)\.png/g, "/email/white-v1/matte/social-$1.webp");
  out = adaptiveEmailBody(out);
  out = out.replace(/<img\b[^>]*>/gi, img => {
    const source = img.match(/\bsrc="([^"]+)"/i)?.[1] || "";
    if (!source.endsWith(EMAIL_WHITE_ASSETS.wordmark)) return img;
    const base = source.slice(0, -EMAIL_WHITE_ASSETS.wordmark.length) || "https://envitefy.com";
    const wordmark = img.replace(/\sheight="[^"]*"/i, "");
    return `<div class="email-brand-band" style="padding:20px;background-color:#251F2D;border-radius:12px;"><img src="${base}${EMAIL_WHITE_ASSETS.symbol}" width="56" height="36" alt="Envitefy logo" style="display:block;width:56px;max-width:100%;height:auto;margin:0 auto 12px;border:0;" />${wordmark}</div>`;
  });
  out = out.replace(/class="footer-shell([^"]*)"/g, 'class="footer-shell email-footer-band$1"');
  out = out.replace(/<[a-z][^>]*class="[^"]*email-(?:brand|footer)-band[^>]*>/gi, tag => {
    const withBackground = tag.replace(/\sbgcolor="[^"]*"/gi, "").replace(/\bstyle="([^"]*)"/i,
      (_match, style: string) => `style="${style};background-color:#251F2D;color:#FFFFFF;"`);
    return withBackground.replace(/>$/, ' bgcolor="#251F2D">');
  });
  return out.replace(/<html\b([^>]*)>/i, `<html$1 data-email-design="adaptive-v1">`)
    .replace(/<\/head>/i, `<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><style>${ADAPTIVE_EMAIL_CSS}</style></head>`);
}

import { ENVITEFY_SOCIAL_LINKS } from "./envitefy-social-links";
import { resolvePublicAssetOrigin } from "./public-asset-url";
import { createLegacyEmailTemplate } from "./email-template-legacy";
import { ADAPTIVE_EMAIL_CSS, adaptiveEmailBody, EMAIL_WHITE_ASSETS, type EmailDesignVersion } from "./email-design";

export function escapeHtml(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export type EmailTemplateParams = {
  preheader?: string;
  title: string;
  body: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
  unsubscribeUrl?: string;
  postalAddress?: string;
  emailDesignVersion?: EmailDesignVersion;
};

/** Client-safe: previews and delivery compose the same HTML without a browser theme dependency. */
export function createEmailTemplate(params: EmailTemplateParams): string {
  if (params.emailDesignVersion === "legacy") return createLegacyEmailTemplate(params);
  const baseUrl = resolvePublicAssetOrigin();
  const social = ENVITEFY_SOCIAL_LINKS.map(({ name, href }) => `<td class="social-icon-cell" style="padding:0 12px;"><a href="${href}" target="_blank" rel="noopener noreferrer" title="${name}"><img src="${baseUrl}${EMAIL_WHITE_ASSETS.social(name)}" width="36" height="36" alt="${name}" style="display:block;border:0;" /></a></td>`).join("");
  const button = params.buttonText && params.buttonUrl
    ? `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 20px;"><tr><td bgcolor="#C5A7FF" style="background-color:#C5A7FF;border-radius:12px;"><a data-email-cta="primary" class="email-cta" href="${escapeHtml(params.buttonUrl)}" target="_blank" style="display:inline-block;border:1px solid #C5A7FF;border-radius:12px;padding:14px 28px;background-color:#C5A7FF;color:#25103E;font-weight:700;text-decoration:none;">${escapeHtml(params.buttonText)}</a></td></tr></table>` : "";
  const footerText = params.footerText ? `<div class="email-muted" style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#655A70;">${adaptiveEmailBody(params.footerText)}</div>` : "";
  return `<!doctype html>
<html lang="en" data-email-design="adaptive-v1">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light dark" /><meta name="supported-color-schemes" content="light dark" />
<title>${escapeHtml(params.title)}</title>
<style>
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}img{-ms-interpolation-mode:bicubic;border:0;outline:0;text-decoration:none;}body{margin:0;padding:0;background:#F5F2FF;}
.preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;}
@media only screen and (max-width:640px){.social-icon-cell{padding:0 4px!important;}.email-page-cell{padding:0!important;}.email-shell{border-radius:0!important;border-left:0!important;border-right:0!important;}.email-brand,.email-content,.email-footer{padding:24px 20px!important;}}
${ADAPTIVE_EMAIL_CSS}
</style></head>
<body class="email-canvas" bgcolor="#F5F2FF" style="margin:0;padding:0;background-color:#F5F2FF;">
${params.preheader ? `<div class="preheader">${escapeHtml(params.preheader)}</div>` : ""}
<table role="presentation" class="email-canvas" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F5F2FF" style="width:100%;background-color:#F5F2FF;"><tr><td class="email-page-cell" align="center" style="padding:32px 16px;">
<table role="presentation" class="email-shell" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="width:100%;max-width:600px;margin:0 auto;background-color:#FFFFFF;border:1px solid #E8E1FF;border-radius:16px;overflow:hidden;">
<tr><td class="email-brand email-brand-band" align="center" bgcolor="#251F2D" style="padding:28px;background-color:#251F2D;"><a href="${escapeHtml(baseUrl)}" target="_blank"><img src="${baseUrl}${EMAIL_WHITE_ASSETS.symbol}" width="36" height="36" alt="Envitefy logo" style="display:block;width:36px;height:36px;margin:0 auto 12px;" /><img src="${baseUrl}${EMAIL_WHITE_ASSETS.wordmark}" width="164" height="53" alt="Envitefy" style="display:block;width:164px;max-width:100%;height:auto;" /></a></td></tr>
<tr><td class="email-content email-surface" bgcolor="#FFFFFF" style="padding:28px;background-color:#FFFFFF;color:#302738;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;">
${adaptiveEmailBody(params.body)}${button}${footerText}
<p class="email-muted" style="margin:24px 0 0;color:#655A70;font-size:14px;font-style:italic;">Sincerely,<br/><strong>Envitefy Team</strong></p>
<p class="email-muted" style="margin:4px 0 0;color:#655A70;font-size:11px;font-weight:700;letter-spacing:1.6px;">CREATE | SHARE | ENJOY</p>
</td></tr>
<tr><td class="email-footer email-footer-band" align="center" bgcolor="#251F2D" style="padding:24px 28px;background-color:#251F2D;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 16px;font-size:14px;color:#FFFFFF;">Connect with us</p>
<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr>${social}</tr></table>
<p style="margin:24px 0 0;font-size:12px;color:#FFFFFF;">&copy; ${new Date().getFullYear()} Envitefy. All rights reserved.</p>
${params.postalAddress ? `<p style="margin:8px 0 0;font-size:12px;line-height:1.5;color:#FFFFFF;">${escapeHtml(params.postalAddress)}</p>` : ""}
${params.unsubscribeUrl ? `<p style="margin:8px 0 0;font-size:12px;"><a href="${escapeHtml(params.unsubscribeUrl)}" style="color:#FFFFFF;text-decoration:underline;">Unsubscribe</a></p>` : ""}
</td></tr></table></td></tr></table></body></html>`;
}

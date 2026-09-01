import { resolvePublicAssetOrigin } from "./public-asset-url";

/**
 * Client-safe email template generator
 * This file has no server dependencies and can be used in client components
 */

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Generate a beautiful HTML email template with consistent branding
 */
export function createEmailTemplate(params: {
  preheader?: string;
  title: string;
  body: string; // HTML content
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
  unsubscribeUrl?: string;
  postalAddress?: string;
}): string {
  const baseUrl = resolvePublicAssetOrigin();
  const wordmarkUrl = `${baseUrl}/email/envitefy-wordmark-email.png`;
  const currentYear = new Date().getFullYear();
  const socialIcons = [
    {
      href: "https://www.instagram.com/envitefy/",
      title: "Instagram",
      src: `${baseUrl}/email/social-instagram.png`,
    },
    {
      href: "https://www.facebook.com/envitefy/",
      title: "Facebook",
      src: `${baseUrl}/email/social-facebook.png`,
    },
    {
      href: "https://www.youtube.com/@envitefy",
      title: "YouTube",
      src: `${baseUrl}/email/social-youtube.png`,
    },
    {
      href: "https://www.tiktok.com/@envitefy",
      title: "TikTok",
      src: `${baseUrl}/email/social-tiktok.png`,
    },
  ];
  const socialIconsRow = socialIcons
    .map(
      (link) => `
                    <td style="padding: 0 12px;">
                      <a href="${link.href}" target="_blank" title="${link.title}" style="display: inline-block;">
                        <img src="${link.src}" width="36" height="36" alt="${link.title}" style="display: block;" />
                      </a>
                    </td>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(params.title)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
    <style>
      :root { color-scheme: light only; supported-color-schemes: light; }
      /* Reset */
      body,table,td,a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table,td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; outline: 0; text-decoration: none; display: block; }
      a { text-decoration: none; }
      body { margin: 0; padding: 0; background: #F5F2FF; }
      .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all; }
      @media only screen and (max-width: 640px) {
        .email-page-cell { padding: 0 !important; }
        .email-shell { border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; box-shadow: none !important; }
        .email-brand { padding: 24px 20px 12px !important; }
        .email-content { padding: 20px !important; }
        .email-footer { padding: 24px 20px !important; }
      }
      @media (prefers-color-scheme: dark) {
        .email-shell, .email-brand, .email-content, .email-footer { background-color: #FFFFFF !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#F5F2FF; color-scheme:light;" bgcolor="#F5F2FF">
    ${params.preheader ? `<div class="preheader">${escapeHtml(params.preheader)}</div>` : ""}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="width:100%; margin:0; background-color:#F5F2FF;" bgcolor="#F5F2FF">
      <tr>
        <td class="email-page-cell" align="center" style="padding:32px 16px; background-color:#F5F2FF;" bgcolor="#F5F2FF">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-shell" style="width:100%; max-width:600px; margin:0 auto; background-color:#FFFFFF; border:1px solid #E8E1FF; border-radius:16px; box-shadow:0 10px 30px rgba(32,24,72,0.08); overflow:hidden;" bgcolor="#FFFFFF">
            <tr>
              <td class="email-brand" align="center" style="padding:28px 28px 12px; background-color:#FFFFFF;" bgcolor="#FFFFFF">
                <a href="${escapeHtml(baseUrl)}" target="_blank" style="display:inline-block; text-decoration:none;">
                  <img src="${wordmarkUrl}" width="164" height="53" alt="Envitefy" style="display:block; width:164px; height:auto; max-width: 100%;" />
                </a>
              </td>
            </tr>
            <tr>
              <td class="email-content" style="padding:20px 28px 32px; background-color:#FFFFFF; color:#4E4E50; font-family:'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;" bgcolor="#FFFFFF">
                ${params.body}
                ${
                  params.buttonText && params.buttonUrl
                    ? `
                <div style="text-align:center; margin:28px 0 20px;">
                  <a href="${escapeHtml(params.buttonUrl)}" style="background-color:#7F67D3 !important; color:#FFFFFF !important; border-radius:12px; padding:14px 28px; font-weight:700; display:inline-block; text-decoration:none; font-family:'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;" target="_blank">${escapeHtml(params.buttonText)}</a>
                </div>
                `
                    : ""
                }
                ${params.footerText ? `<p style="margin:20px 0 0; font-size:13px; line-height:1.6; color:#737373;">${params.footerText}</p>` : ""}
                <p style="font-style:italic; color:#737373; margin:24px 0 0; font-size:14px; line-height:1.5;">
                  Sincerely,<br/>
                  <strong>Envitefy Team</strong>
                </p>
                <p style="margin:4px 0 0; font-size:11px; letter-spacing:1.6px; color:#9CA3AF; font-weight:700; text-transform:uppercase;">
                  CREATE | SHARE | ENJOY
                </p>
              </td>
            </tr>
            <tr>
              <td class="email-footer" align="center" style="padding:24px 28px 28px; background-color:#FFFFFF; border-top:1px solid #EEEAF8;" bgcolor="#FFFFFF">
                <p style="margin:0 0 16px; font-size:14px; color:#737373; font-family:'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Connect with us
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
${socialIconsRow}
                  </tr>
                </table>
                <p style="margin:24px 0 0; font-size:12px; color:#9CA3AF; font-family:'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  &copy; ${currentYear} Envitefy. All rights reserved.
                </p>
                ${params.postalAddress ? `<p style="margin:8px 0 0; font-size:12px; line-height:1.5; color:#9CA3AF;">${escapeHtml(params.postalAddress)}</p>` : ""}
                ${params.unsubscribeUrl ? `<p style="margin:8px 0 0; font-size:12px; color:#737373;"><a href="${escapeHtml(params.unsubscribeUrl)}" style="color:#52605c; text-decoration:underline;">Unsubscribe from marketing emails</a></p>` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

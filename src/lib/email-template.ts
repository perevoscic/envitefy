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
}): string {
  // Resolve a public, absolute base URL for images/links used in emails.
  // Avoid localhost values which are not reachable by email clients.
  const candidate =
    process.env.PUBLIC_BASE_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    "";
  let baseUrl = candidate || "https://snapmydate.com";
  try {
    const u = new URL(baseUrl);
    const host = (u.hostname || "").toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".local") ||
      u.protocol.startsWith("http") === false
    ) {
      baseUrl = "https://snapmydate.com";
    }
  } catch {
    baseUrl = "https://snapmydate.com";
  }
  const logoUrl = `${baseUrl}/SnapMyDateSnapItSaveitDone_black_h.png`;
  
  return `<!doctype html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(params.title)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Pacifico&display=swap" rel="stylesheet" />
    <style>
      /* Reset */
      body,table,td,a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table,td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; outline: 0; text-decoration: none; display: block; }
      a { text-decoration: none; }
      body { margin: 0; padding: 0; background: #FFFBF7; }
      .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all; }
      /* Typography */
      .montserrat { font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; }
      .pacifico { font-family: 'Pacifico', 'Brush Script MT', cursive; }
      /* Colors */
      .bg-surface { background: #FFFFFF; }
      .text-fore { color: #4E4E50; }
      .muted { color: #737373; }
      .border { border: 1px solid #E0E0E0; }
      .btn { background: #2DD4BF; color: #FFFFFF !important; border-radius: 12px; padding: 14px 28px; font-weight: 700; display: inline-block; text-decoration: none; }
      .btn:hover { opacity: 0.95; }
      .container { width: 100%; max-width: 600px; margin: 0 auto; }
      .card { border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
      .signature { font-style: italic; color: #737373; margin-top: 24px; font-size: 14px; }
    </style>
  </head>
  <body>
    ${params.preheader ? `<div class="preheader">${escapeHtml(params.preheader)}</div>` : ""}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="background:#FFFBF7; padding: 32px 16px;">
      <tr>
        <td>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="container">
            <!-- Logo -->
            <tr>
              <td align="center" style="padding: 0 0 24px 0;">
                <a href="${escapeHtml(baseUrl)}" target="_blank" style="display:inline-block;">
                  <img src="${logoUrl}" width="280" height="auto" alt="Snap My Date" style="display:block; margin: 0 auto;" />
                </a>
              </td>
            </tr>
            <!-- Main Card -->
            <tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="bg-surface card border" style="border-radius:16px;">
                  <tr>
                    <td style="padding: 32px 28px;" class="montserrat text-fore">
                      ${params.body}
                      ${params.buttonText && params.buttonUrl ? `
                      <div style="text-align: center; margin: 28px 0 20px 0;">
                        <a href="${escapeHtml(params.buttonUrl)}" class="btn" target="_blank">${escapeHtml(params.buttonText)}</a>
                      </div>
                      ` : ""}
                      ${params.footerText ? `<p class="muted" style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.6; color:#737373;">${params.footerText}</p>` : ""}
                      <p class="signature" style="font-style: italic; color: #737373; margin-top: 24px; font-size: 14px; line-height: 1.5;">
                        Sincerely,<br/>
                        <strong>Snap My Date Team</strong>
                      </p>
                      <p style="margin: 0; font-size: 11px; letter-spacing: 1.6px; color: #9CA3AF; font-weight: 700; text-transform: uppercase;">
                        SNAP IT. SAVE IT. DONE.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}


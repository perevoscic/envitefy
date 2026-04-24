import { buildLandingShowcasePath } from "@/lib/landing-showcase";
import { buildPublicAssetUrl, resolvePublicAssetOrigin } from "@/lib/public-asset-url";

/**
 * Magazine-style relaunch email.
 *
 * The hero image path must point at a publicly reachable asset on envitefy.com
 * so preview/editor/email clients can all load the same image reliably.
 */

export const MAGAZINE_1_SUBJECT = "Envitefy is back — reimagined.";

export const MAGAZINE_1_HERO_IMAGE_PATH =
  "/api/blob/event-media/system/email-assets/envitefy-magazine-1.webp";

export const MAGAZINE_1_WORDMARK_IMAGE_PATH =
  "/email/envitefy-wordmark-email.png";

type MagazineShowcaseCard = {
  title: string;
  imagePath: string;
  href: string;
};

const MAGAZINE_1_SHOWCASE_CARDS: MagazineShowcaseCard[] = [
  {
    title: "Ava & James Garden Vows",
    imagePath: "/api/blob/event-media/system/email-assets/ava-james-garden-vows.webp",
    href: buildLandingShowcasePath("garden-vows"),
  },
  {
    title: "Elena's Beary Sweet Shower",
    imagePath: "/api/blob/event-media/system/email-assets/elena-beary-sweet-shower.webp",
    href: buildLandingShowcasePath("elena-s-beary-sweet-shower"),
  },
  {
    title: "Friday Night Lights",
    imagePath: "/api/blob/event-media/system/email-assets/friday-night-lights-email.webp",
    href: buildLandingShowcasePath("friday-night-lights-a"),
  },
];

export const MAGAZINE_1_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Envitefy is back</title>
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; display:block; }
    table { border-collapse:collapse !important; }
    body {
      margin:0 !important; padding:0 !important; width:100% !important; height:100% !important;
      background-color:#f3f0ff;
      font-family: Arial, Helvetica, sans-serif;
      color:#1f1a37;
    }
    .wrapper { width:100%; background:linear-gradient(180deg,#f6f3ff 0%,#f2f7ff 100%); }
    .container { width:100%; max-width:640px; margin:0 auto; background:#ffffff; }
    .px { padding-left:32px; padding-right:32px; }
    .hero {
      background:linear-gradient(135deg,#faf8ff 0%,#eef4ff 100%);
    }
    .eyebrow {
      font-size:12px; letter-spacing:1.3px; text-transform:uppercase; color:#6b52d9; font-weight:bold;
    }
    .h1 {
      font-size:38px; line-height:44px; font-weight:700; color:#17112d;
    }
    .h2 {
      font-size:26px; line-height:32px; font-weight:700; color:#17112d;
    }
    .body {
      font-size:17px; line-height:27px; color:#3a3552;
    }
    .small { font-size:14px; line-height:22px; color:#5b5675; }
    .card {
      border:1px solid #e8e1ff;
      border-radius:18px;
      background:#fbfaff;
    }
    .feature-title {
      font-size:18px; line-height:24px; font-weight:700; color:#1c1539;
    }
    .btn {
      background:linear-gradient(90deg,#6f45ff 0%,#169dff 100%);
      border-radius:999px;
      color:#ffffff !important;
      display:inline-block;
      font-size:16px;
      font-weight:bold;
      line-height:16px;
      text-decoration:none;
      padding:16px 26px;
    }
    .divider {
      height:1px; line-height:1px; font-size:1px; background:#ece8f8;
    }
    @media screen and (max-width:640px) {
      .px { padding-left:20px !important; padding-right:20px !important; }
      .h1 { font-size:30px !important; line-height:36px !important; }
      .h2 { font-size:22px !important; line-height:28px !important; }
      .body { font-size:16px !important; line-height:25px !important; }
    }
    @media (prefers-color-scheme: dark) {
      body,
      .wrapper {
        background:#0f0c1b !important;
      }
      .container {
        background:#171326 !important;
      }
      .hero {
        background:linear-gradient(135deg,#1b1530 0%,#13203a 100%) !important;
      }
      .eyebrow {
        color:#a89cff !important;
      }
      .h1,
      .h2,
      .feature-title {
        color:#f6f2ff !important;
      }
      .body {
        color:#d7d1ea !important;
      }
      .small {
        color:#b7b0cd !important;
      }
      .card {
        border-color:#3a3256 !important;
        background:#201a34 !important;
      }
      .divider {
        background:#2a2342 !important;
      }
      .legacy-note {
        color:#b6aece !important;
      }
      .legacy-brand-primary,
      .legacy-brand-secondary {
        color:#f5f2fb !important;
      }
      .footer-shell {
        background:#171326 !important;
      }
      .footer-kicker {
        color:#b7b0cd !important;
      }
      .footer-copy {
        color:#8f88ad !important;
      }
    }
  </style>
</head>
<body>
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    Envitefy is back with a redesigned experience, smarter event pages, and more than just Snap and Upload.
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="wrapper">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="container" style="border-radius:24px; overflow:hidden; box-shadow:0 18px 60px rgba(77,56,160,0.12);">

          <tr>
            <td class="hero px" style="padding-top:26px; padding-bottom:18px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td class="h1" style="text-align:center;">
                    <img
                      src="{{WORDMARK_IMAGE_URL}}"
                      alt="Envitefy"
                      width="320"
                      style="display:block; width:100%; max-width:320px; height:auto; margin:0 auto;"
                    >
                    <br>
                    <span style="display:inline-block; margin-top:12px; line-height:1.08; white-space:nowrap;">
                      <span
                        class="legacy-note"
                        style="
                          display:inline-block;
                          margin-right:10px;
                          font-family:Arial, Helvetica, sans-serif;
                          font-size:0.4em;
                          font-weight:700;
                          letter-spacing:0.12em;
                          text-transform:uppercase;
                          color:#40375d;
                          vertical-align:middle;
                        "
                      >
                        formerly known as
                      </span>
                      <span
                        class="legacy-brand-primary"
                        style="
                          display:inline-block;
                          font-family:'Brush Script MT','Segoe Script','Lucida Handwriting',cursive;
                          font-size:0.92em;
                          font-weight:700;
                          color:#111111;
                          line-height:0.95;
                          vertical-align:middle;
                        "
                      >
                        Snap
                      </span>
                      <span
                        class="legacy-brand-secondary"
                        style="
                          display:inline-block;
                          margin-left:10px;
                          font-family:Arial, Helvetica, sans-serif;
                          font-size:0.82em;
                          font-weight:500;
                          letter-spacing:-0.02em;
                          color:#111111;
                          vertical-align:middle;
                        "
                      >
                        My Date
                      </span>
                    </span>
                  </td>
                </tr>
                <tr><td style="height:12px;"></td></tr>
                <tr>
                  <td class="eyebrow" align="center">new look - new features</td>
                </tr>
                <tr><td style="height:24px;"></td></tr>
                <tr>
                  <td align="center">
                    <img src="{{HERO_IMAGE_URL}}" alt="Envitefy redesign preview" style="width:100%; max-width:576px; height:auto; border-radius:22px;">
                  </td>
                </tr>
                <tr><td style="height:18px;"></td></tr>
                <tr>
                  <td class="body">
                    <p style="margin:0;">
                      We started as <strong>Snap My Date</strong> with a simple idea: snap or upload an invitation and turn it into something easier to share. Now, we&rsquo;re <strong>Envitefy</strong> &mdash; a more polished, flexible, and modern way to bring invitations, flyers, and schedules to life.
                    </p>
                    <p style="margin:16px 0 0 0;">
                      Envitefy returns with a cleaner design, richer event pages, and a better experience for guests, families, and organizers. What used to be a simple upload can now become a live event page people can open, revisit, and actually use.
                    </p>
                  </td>
                </tr>
                <tr><td style="height:24px;"></td></tr>
                <tr>
                  <td align="center">
                    <a href="https://envitefy.com" class="btn">See the new Envitefy</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td class="divider"></td></tr>

          <tr>
            <td class="px" style="padding-top:26px; padding-bottom:34px;">
              <div style="text-align:center; padding-bottom:18px;">
                <div class="h2" style="font-size:24px; line-height:30px;">Introducing Live Cards</div>
                <div style="height:8px;"></div>
                <div class="body" style="font-size:16px; line-height:24px;">2 in 1. Digital invite and a live event</div>
              </div>
              {{SHOWCASE_CARDS_HTML}}
              <div style="height:18px;"></div>
              <div style="text-align:center;">
                <a href="{{STUDIO_URL}}" class="btn">Try Envitefy Studio</a>
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" style="background:linear-gradient(135deg,#1d1538 0%,#342162 100%);" class="px">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr><td style="height:34px;"></td></tr>
                <tr>
                  <td align="center" style="font-size:28px; line-height:34px; font-weight:700; color:#ffffff;">
                    <span style="display:block;">A fresh design.</span>
                    <span style="display:block;">More useful features.</span>
                    <span style="display:block;">Same simple idea.</span>
                  </td>
                </tr>
                <tr><td style="height:12px;"></td></tr>
                <tr>
                  <td align="center" style="font-size:17px; line-height:27px; color:#e4dcff;">
                    Envitefy is returning with a more complete way to move from invite to live event page.
                  </td>
                </tr>
                <tr><td style="height:22px;"></td></tr>
                <tr>
                  <td align="center">
                    <a href="https://envitefy.com" class="btn">Visit envitefy.com</a>
                  </td>
                </tr>
                <tr><td style="height:34px;"></td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td
              align="center"
              class="footer-shell"
              style="padding:32px 32px 22px 32px; background:#ffffff;"
            >
              {{SOCIAL_FOOTER_HTML}}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export interface MagazineRenderOptions {
  baseUrl: string;
}

function renderMagazineSocialFooter(options: MagazineRenderOptions): string {
  const base = resolvePublicAssetOrigin(options.baseUrl);
  const currentYear = new Date().getFullYear();
  const socialIcons = [
    {
      href: "https://www.instagram.com/envitefy/",
      title: "Instagram",
      src: `${base}/email/social-instagram.png`,
    },
    {
      href: "https://www.facebook.com/envitefy/",
      title: "Facebook",
      src: `${base}/email/social-facebook.png`,
    },
    {
      href: "https://www.youtube.com/@envitefy",
      title: "YouTube",
      src: `${base}/email/social-youtube.png`,
    },
    {
      href: "https://www.tiktok.com/@envitefy",
      title: "TikTok",
      src: `${base}/email/social-tiktok.png`,
    },
  ];

  const socialIconsRow = socialIcons
    .map(
      (link) => `
                      <td style="padding:0 12px;">
                        <a href="${link.href}" target="_blank" title="${link.title}" style="display:inline-block;">
                          <img src="${link.src}" width="36" height="36" alt="${link.title}" style="display:block;">
                        </a>
                      </td>`,
    )
    .join("\n");

  return `
                <div class="footer-kicker" style="margin:0 0 16px 0; font-size:14px; color:#737373; font-family:Arial, Helvetica, sans-serif;">
                  Connect with us
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
${socialIconsRow}
                  </tr>
                </table>
                <div class="footer-copy" style="margin:24px 0 0 0; font-size:12px; color:#9CA3AF; font-family:Arial, Helvetica, sans-serif;">
                  &copy; ${currentYear} Envitefy. All rights reserved.
                </div>
              `;
}

function renderMagazineShowcaseCards(options: MagazineRenderOptions): string {
  const base = resolvePublicAssetOrigin(options.baseUrl);
  const [leftCard, centerCard, rightCard] = MAGAZINE_1_SHOWCASE_CARDS;

  if (!leftCard || !centerCard || !rightCard) return "";

  function renderCardColumn(
    card: MagazineShowcaseCard,
    width: number,
    radius: number,
  ): string {
    const href = `${base}${card.href}`;
    const imageSrc = `${base}${card.imagePath}`;

    return `
                        <td width="${width}" valign="top" style="padding:0 8px;">
                          <a
                            href="${href}"
                            target="_blank"
                            rel="noopener noreferrer"
                            style="display:block; width:${width}px; text-decoration:none;"
                          >
                            <span style="display:block; width:${width}px;">
                              <img
                                src="${imageSrc}"
                                alt="${card.title}"
                                width="${width}"
                                style="display:block; width:${width}px; height:auto; border-radius:${radius}px; box-shadow:0 24px 56px rgba(58,44,109,0.16);"
                              >
                            </span>
                          </a>
                        </td>`;
  }

  return `
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
${renderCardColumn(leftCard, 138, 28)}
${renderCardColumn(centerCard, 228, 30)}
${renderCardColumn(rightCard, 138, 28)}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            `;
}

/**
 * Resolve the magazine email HTML with a given origin so that hosted images
 * work from email clients.
 */
export function renderMagazineEmail(options: MagazineRenderOptions): string {
  const heroUrl = buildPublicAssetUrl(MAGAZINE_1_HERO_IMAGE_PATH, options.baseUrl);
  const wordmarkUrl = buildPublicAssetUrl(MAGAZINE_1_WORDMARK_IMAGE_PATH, options.baseUrl);
  const studioUrl = buildPublicAssetUrl("/studio", options.baseUrl);
  return MAGAZINE_1_HTML
    .replace(/\{\{HERO_IMAGE_URL\}\}/g, heroUrl)
    .replace(/\{\{WORDMARK_IMAGE_URL\}\}/g, wordmarkUrl)
    .replace(/\{\{STUDIO_URL\}\}/g, studioUrl)
    .replace(/\{\{SOCIAL_FOOTER_HTML\}\}/g, renderMagazineSocialFooter(options))
    .replace(/\{\{SHOWCASE_CARDS_HTML\}\}/g, renderMagazineShowcaseCards(options));
}

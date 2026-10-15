import { resolvePublicAssetOrigin } from "@/lib/public-asset-url";

/**
 * October 2026 features campaign: Snap, Live Cards, Event Pages, Sign-up Forms
 * and RSVP & Registry. Images were generated for this campaign and live in
 * public/email/features-oct26/ (prompts in docs/email-campaigns/).
 */

export const FEATURES_OCT26_SUBJECT = "Every event, one link";

export const FEATURES_OCT26_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>Every event, one link</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
    <style>
      :root { color-scheme: light only; supported-color-schemes: light; }
      body,table,td,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
      table,td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
      img { -ms-interpolation-mode:bicubic; border:0; outline:0; text-decoration:none; display:block; }
      a { text-decoration:none; }
      body { margin:0; padding:0; background:#F5F2FF; }
      .preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all; }
      @media only screen and (max-width: 640px) {
        .email-page-cell { padding:0 !important; }
        .email-shell { border-radius:0 !important; border-left:0 !important; border-right:0 !important; box-shadow:none !important; }
        .pad { padding-left:20px !important; padding-right:20px !important; }
        .stack { display:block !important; width:100% !important; max-width:100% !important; }
        .stack-img { padding:0 0 18px 0 !important; text-align:center !important; }
        .stack-img img { width:230px !important; max-width:70% !important; height:auto !important; margin:0 auto !important; }
        .hero-img img { width:100% !important; max-width:100% !important; }
        .stack-copy { padding:0 !important; }
        .hero-title { font-size:28px !important; line-height:34px !important; }
        .mini { display:block !important; width:100% !important; padding:0 0 12px 0 !important; }
        .social-icon-cell { padding:0 4px !important; }
      }
      @media (prefers-color-scheme: dark) {
        .email-shell, .white { background-color:#FFFFFF !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#F5F2FF; color-scheme:light;" bgcolor="#F5F2FF">
    <div class="preheader">Snap an invite, design a Live Card, collect RSVPs and fill sign-up slots, all from one shareable link.</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="width:100%; background-color:#F5F2FF;" bgcolor="#F5F2FF">
      <tr>
        <td class="email-page-cell" align="center" style="padding:32px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-shell" style="width:100%; max-width:600px; margin:0 auto; background-color:#FFFFFF; border:1px solid #E8E1FF; border-radius:16px; box-shadow:0 10px 30px rgba(32,24,72,0.08); overflow:hidden;" bgcolor="#FFFFFF">

            <!-- Brand -->
            <tr>
              <td class="white" align="center" style="padding:28px 28px 8px; background-color:#FFFFFF;">
                <a href="{{ORIGIN}}/?utm_source=email&amp;utm_medium=campaign&amp;utm_campaign=features_oct26" target="_blank" style="display:inline-block;">
                  <img src="{{ORIGIN}}/email/envitefy-wordmark-email.png" width="164" height="53" alt="Envitefy" style="display:block; width:164px; height:auto;" />
                </a>
              </td>
            </tr>

            <!-- Hero -->
            <tr>
              <td class="pad white" style="padding:16px 40px 8px; font-family:'Montserrat',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; color:#4E4E50;">
                <p style="margin:0 0 14px; font-size:15px; line-height:24px;">{{greeting}},</p>
                <h1 class="hero-title" style="margin:0 0 14px; font-size:32px; line-height:40px; font-weight:700; color:#2A1F5C;">Every event you host or get invited to, in one live link.</h1>
                <p style="margin:0 0 24px; font-size:15px; line-height:24px;">Invitations get lost in group chats, sign-up sheets turn into spreadsheets, and guests keep asking for the address. Envitefy puts the details, RSVPs, calendar saves, directions, registries and sign-ups in one page that stays current after you share it.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" bgcolor="#7F67D3" style="border-radius:12px; background-color:#7F67D3;">
                      <a href="{{ORIGIN}}/?utm_source=email&amp;utm_medium=campaign&amp;utm_campaign=features_oct26&amp;utm_content=hero" target="_blank" style="display:inline-block; padding:14px 28px; font-family:'Montserrat',Arial,sans-serif; font-size:15px; font-weight:700; color:#FFFFFF; border-radius:12px;">Create an event</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="pad white hero-img" style="padding:28px 40px 8px;">
                <a href="{{ORIGIN}}/live-cards?utm_source=email&amp;utm_medium=campaign&amp;utm_campaign=features_oct26&amp;utm_content=hero_image" target="_blank">
                  <img src="{{ORIGIN}}/email/features-oct26/hero.webp" width="520" alt="A backyard evening party with a guest checking an invitation on a phone" style="display:block; width:100%; max-width:520px; height:auto; border-radius:14px;" />
                </a>
              </td>
            </tr>

            <!-- Section label -->
            <tr>
              <td class="pad white" align="center" style="padding:32px 40px 4px; font-family:'Montserrat',Arial,sans-serif;">
                <p style="margin:0; font-size:11px; letter-spacing:1.6px; font-weight:700; text-transform:uppercase; color:#7F67D3;">Five ways to use Envitefy</p>
              </td>
            </tr>

            <!-- Feature 1: Snap (image left) -->
            <tr>
              <td class="pad white" style="padding:24px 40px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td class="stack stack-img" width="200" valign="top" style="width:200px; padding-right:24px;">
                      <img src="{{ORIGIN}}/email/features-oct26/snap.webp" width="200" alt="A parent photographing a printed birthday invitation with a phone" style="display:block; width:200px; height:auto; border-radius:12px;" />
                    </td>
                    <td class="stack stack-copy" valign="middle" style="font-family:'Montserrat',Arial,sans-serif; color:#4E4E50;">
                      <p style="margin:0 0 6px; font-size:11px; letter-spacing:1.4px; font-weight:700; text-transform:uppercase; color:#9C8BE0;">01 · Envitefy Snap</p>
                      <h2 style="margin:0 0 10px; font-size:21px; line-height:28px; font-weight:700; color:#2A1F5C;">Snap the invite. Keep the event.</h2>
                      <p style="margin:0 0 14px; font-size:14px; line-height:22px;">Photograph or upload a paper invitation, flyer, screenshot, schedule or PDF. Envitefy reads the date, time, place and RSVP details and saves a polished event you can add to your calendar, share and reopen later. The original stays one tap away.</p>
                      <a href="{{ORIGIN}}/snap?utm_source=email&amp;utm_medium=campaign&amp;utm_campaign=features_oct26&amp;utm_content=snap" target="_blank" style="font-size:14px; font-weight:700; color:#7F67D3;">Try Snap &rarr;</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Feature 2: Live Cards (image right on desktop) -->
            <tr>
              <td class="pad white" style="padding:32px 40px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" dir="rtl">
                  <tr>
                    <td class="stack stack-img" width="200" valign="top" dir="ltr" style="width:200px; padding-left:24px;">
                      <img src="{{ORIGIN}}/email/features-oct26/live-card.webp" width="200" alt="A couple smiling at a wedding invitation on a phone" style="display:block; width:200px; height:auto; border-radius:12px;" />
                    </td>
                    <td class="stack stack-copy" valign="middle" dir="ltr" style="font-family:'Montserrat',Arial,sans-serif; color:#4E4E50; text-align:left;">
                      <p style="margin:0 0 6px; font-size:11px; letter-spacing:1.4px; font-weight:700; text-transform:uppercase; color:#9C8BE0;">02 · Live Cards</p>
                      <h2 style="margin:0 0 10px; font-size:21px; line-height:28px; font-weight:700; color:#2A1F5C;">An invitation that does the work.</h2>
                      <p style="margin:0 0 14px; font-size:14px; line-height:22px;">Describe the look you want and Envitefy creates one-of-a-kind artwork with your title lettered in. Guests tap RSVP, Overview, Location, Calendar and Registry right on the card. Need something printable? Download a JPEG invitation with QR codes for your RSVP and registry.</p>
                      <a href="{{ORIGIN}}/live-cards?utm_source=email&amp;utm_medium=campaign&amp;utm_campaign=features_oct26&amp;utm_content=live_cards" target="_blank" style="font-size:14px; font-weight:700; color:#7F67D3;">Design a Live Card &rarr;</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Feature 3: Event Pages -->
            <tr>
              <td class="pad white" style="padding:32px 40px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td class="stack stack-img" width="200" valign="top" style="width:200px; padding-right:24px;">
                      <img src="{{ORIGIN}}/email/features-oct26/event-page.webp" width="200" alt="A host reviewing an event website on a laptop" style="display:block; width:200px; height:auto; border-radius:12px;" />
                    </td>
                    <td class="stack stack-copy" valign="middle" style="font-family:'Montserrat',Arial,sans-serif; color:#4E4E50;">
                      <p style="margin:0 0 6px; font-size:11px; letter-spacing:1.4px; font-weight:700; text-transform:uppercase; color:#9C8BE0;">03 · Event Pages</p>
                      <h2 style="margin:0 0 10px; font-size:21px; line-height:28px; font-weight:700; color:#2A1F5C;">A full event website in minutes.</h2>
                      <p style="margin:0 0 14px; font-size:14px; line-height:22px;">Pick a template for a wedding, birthday, shower, game day or meet, then add schedules, weather, a parking map and your own sections. Change the plan after you share and every guest sees the update on the same link.</p>
                      <a href="{{ORIGIN}}/templates?utm_source=email&amp;utm_medium=campaign&amp;utm_campaign=features_oct26&amp;utm_content=event_pages" target="_blank" style="font-size:14px; font-weight:700; color:#7F67D3;">Browse templates &rarr;</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Feature 4: Sign-up forms -->
            <tr>
              <td class="pad white" style="padding:32px 40px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" dir="rtl">
                  <tr>
                    <td class="stack stack-img" width="200" valign="top" dir="ltr" style="width:200px; padding-left:24px;">
                      <img src="{{ORIGIN}}/email/features-oct26/signup.webp" width="200" alt="Volunteers setting out dishes at a community potluck" style="display:block; width:200px; height:auto; border-radius:12px;" />
                    </td>
                    <td class="stack stack-copy" valign="middle" dir="ltr" style="font-family:'Montserrat',Arial,sans-serif; color:#4E4E50; text-align:left;">
                      <p style="margin:0 0 6px; font-size:11px; letter-spacing:1.4px; font-weight:700; text-transform:uppercase; color:#9C8BE0;">04 · Sign-up Forms</p>
                      <h2 style="margin:0 0 10px; font-size:21px; line-height:28px; font-weight:700; color:#2A1F5C;">Volunteers, snacks and shifts, sorted.</h2>
                      <p style="margin:0 0 14px; font-size:14px; line-height:22px;">Choose from 150 designs and add roles, items to bring and time slots with limits and automatic waitlists. Guests sign up from the link without an account, and you see what's claimed and what's still needed at a glance.</p>
                      <a href="{{ORIGIN}}/signup-forms?utm_source=email&amp;utm_medium=campaign&amp;utm_campaign=features_oct26&amp;utm_content=signup_forms" target="_blank" style="font-size:14px; font-weight:700; color:#7F67D3;">Build a sign-up form &rarr;</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Feature 5: RSVP & registry -->
            <tr>
              <td class="pad white" style="padding:32px 40px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td class="stack stack-img" width="200" valign="top" style="width:200px; padding-right:24px;">
                      <img src="{{ORIGIN}}/email/features-oct26/rsvp.webp" width="200" alt="A host reviewing guest responses on a laptop" style="display:block; width:200px; height:auto; border-radius:12px;" />
                    </td>
                    <td class="stack stack-copy" valign="middle" style="font-family:'Montserrat',Arial,sans-serif; color:#4E4E50;">
                      <p style="margin:0 0 6px; font-size:11px; letter-spacing:1.4px; font-weight:700; text-transform:uppercase; color:#9C8BE0;">05 · RSVP &amp; Registry</p>
                      <h2 style="margin:0 0 10px; font-size:21px; line-height:28px; font-weight:700; color:#2A1F5C;">Know who's coming, without the chasing.</h2>
                      <p style="margin:0 0 14px; font-size:14px; line-height:22px;">Guests reply Yes, Maybe or No with their party size and your questions, and you get an email when they do. Track headcounts live, send updates to everyone attending, and keep registry or gift links right beside the invitation.</p>
                      <a href="{{ORIGIN}}/how-it-works?utm_source=email&amp;utm_medium=campaign&amp;utm_campaign=features_oct26&amp;utm_content=rsvp" target="_blank" style="font-size:14px; font-weight:700; color:#7F67D3;">See how it works &rarr;</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Also included strip -->
            <tr>
              <td class="pad white" style="padding:36px 40px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F7F4FF" style="background-color:#F7F4FF; border-radius:14px;">
                  <tr>
                    <td style="padding:22px 22px 10px; font-family:'Montserrat',Arial,sans-serif;">
                      <p style="margin:0 0 14px; font-size:11px; letter-spacing:1.6px; font-weight:700; text-transform:uppercase; color:#7F67D3;">Also included</p>
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td class="mini" width="33%" valign="top" style="padding:0 10px 12px 0; font-size:13px; line-height:20px; color:#4E4E50;">
                            <strong style="display:block; color:#2A1F5C; font-size:14px; margin-bottom:2px;">Add to calendar</strong>
                            Google, Apple or Outlook in one tap.
                          </td>
                          <td class="mini" width="33%" valign="top" style="padding:0 10px 12px; font-size:13px; line-height:20px; color:#4E4E50;">
                            <strong style="display:block; color:#2A1F5C; font-size:14px; margin-bottom:2px;">Invite a co-host</strong>
                            Share the planning from their own account.
                          </td>
                          <td class="mini" width="33%" valign="top" style="padding:0 0 12px 10px; font-size:13px; line-height:20px; color:#4E4E50;">
                            <strong style="display:block; color:#2A1F5C; font-size:14px; margin-bottom:2px;">No app for guests</strong>
                            Everything opens in the browser.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Closing CTA -->
            <tr>
              <td class="pad white" align="center" style="padding:36px 40px 8px; font-family:'Montserrat',Arial,sans-serif; color:#4E4E50;">
                <h2 style="margin:0 0 8px; font-size:22px; line-height:30px; font-weight:700; color:#2A1F5C;">What are you planning next?</h2>
                <p style="margin:0 0 22px; font-size:15px; line-height:24px;">Start with a photo, a template or just an idea.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td align="center" bgcolor="#7F67D3" style="border-radius:12px; background-color:#7F67D3;">
                      <a href="{{ORIGIN}}/?utm_source=email&amp;utm_medium=campaign&amp;utm_campaign=features_oct26&amp;utm_content=footer_cta" target="_blank" style="display:inline-block; padding:14px 28px; font-family:'Montserrat',Arial,sans-serif; font-size:15px; font-weight:700; color:#FFFFFF; border-radius:12px;">Create an event</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Signature -->
            <tr>
              <td class="pad white" style="padding:28px 40px 32px; font-family:'Montserrat',Arial,sans-serif;">
                <p style="font-style:italic; color:#737373; margin:0; font-size:14px; line-height:1.5;">Sincerely,<br /><strong>Envitefy Team</strong></p>
                <p style="margin:4px 0 0; font-size:11px; letter-spacing:1.6px; color:#9CA3AF; font-weight:700; text-transform:uppercase;">CREATE | SHARE | ENJOY</p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td class="white" align="center" style="padding:24px 28px 28px; border-top:1px solid #EEEAF8; font-family:'Montserrat',Arial,sans-serif;">
                <p style="margin:0 0 16px; font-size:14px; color:#737373;">Connect with us</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td class="social-icon-cell" style="padding:0 12px;"><a href="https://www.instagram.com/envitefy/" target="_blank" title="Instagram"><img src="{{ORIGIN}}/email/social-instagram.png" width="36" height="36" alt="Instagram" /></a></td>
                    <td class="social-icon-cell" style="padding:0 12px;"><a href="https://www.facebook.com/envitefy/" target="_blank" title="Facebook"><img src="{{ORIGIN}}/email/social-facebook.png" width="36" height="36" alt="Facebook" /></a></td>
                    <td class="social-icon-cell" style="padding:0 12px;"><a href="https://www.youtube.com/@envitefy" target="_blank" title="YouTube"><img src="{{ORIGIN}}/email/social-youtube.png" width="36" height="36" alt="YouTube" /></a></td>
                    <td class="social-icon-cell" style="padding:0 12px;"><a href="https://www.tiktok.com/@envitefy" target="_blank" title="TikTok"><img src="{{ORIGIN}}/email/social-tiktok.png" width="36" height="36" alt="TikTok" /></a></td>
                    <td class="social-icon-cell" style="padding:0 12px;"><a href="https://www.reddit.com/user/envitefy/" target="_blank" title="Reddit"><img src="{{ORIGIN}}/email/social-reddit.png" width="36" height="36" alt="Reddit" /></a></td>
                  </tr>
                </table>
                <p style="margin:20px 0 0; font-size:12px; color:#9CA3AF;">You're receiving this because you have an Envitefy account.</p>
                <p style="margin:6px 0 0; font-size:12px; color:#9CA3AF;"><a href="{{unsubscribeUrl}}" target="_blank" style="color:#737373; text-decoration:underline;">Unsubscribe</a></p>
                <p style="margin:6px 0 0; font-size:12px; color:#9CA3AF;">&copy; 2026 Envitefy. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export interface FeaturesEmailRenderOptions {
  baseUrl: string;
}

/** Resolve hosted image and link URLs against a public origin (never localhost). */
export function renderFeaturesEmail(options: FeaturesEmailRenderOptions): string {
  const origin = resolvePublicAssetOrigin(options.baseUrl);
  return FEATURES_OCT26_HTML.replace(/\{\{ORIGIN\}\}/g, origin);
}

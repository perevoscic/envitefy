# Google Play Data safety draft — September 23, 2026

Prepared in Play Console for `com.envitefy.app` / Envitefy. The Android app is a Trusted Web Activity serving the live Envitefy website, so the declaration covers website features, not only native Android dependencies.

## Console state and remaining work

- Content ratings and Target audience were already marked actioned when the separate declaration tab was opened.
- Target audience is **13+**, explicitly confirmed by the user. Saved and verified the selected groups **13–15, 16–17, and 18 and over**. An earlier change to 18+ based solely on the account policy was incorrect and has been reversed. The optional Google Play minor-blocking restriction was not enabled. The separate 18+ account wording in the terms/privacy policy was not changed in this correction.
- Subsequently inspected Content ratings. The existing September 23, 9:17 AM result declares digital goods purchases and omits user-content sharing. These conflict with the audited functionality: no in-app digital purchase implementation was found, and guests/hosts exchange event content and messages. Started a replacement questionnaire with All Other App Types and `no-reply@envitefy.com`, but left **IARC Terms of Use unchecked** pending explicit user approval required by the browser confirmation policy. The previous rating remains in place.
- Completed all 19 selected Data safety data types and reviewed the expanded store-listing preview.
- Used **Save as draft** on the preview. Console confirmed: “Change saved. Send for review in Publishing overview.” No Send for review or release publication was performed.
- App content subsequently displayed **“You're all caught up”**, and all three original declarations were listed under Actioned. This checklist status does not resolve the content-rating correction or live deletion-page issues below.
- Draft account-deletion URL: `https://envitefy.com/delete-account`.
- **Do not send this declaration for review until the deletion page is deployed and verified.** The live URL redirected to the homepage during this check. The separate “Add profile section” task implemented the page and Profile request form locally and reported passing TypeScript, Biome, and mocked browser tests.
- Exact deletion-completion and backup/retention periods remain undefined. The page must accurately describe the actual operational process; do not invent fixed periods.
- The optional separate data-deletion URL answer was cleared because the existing general privacy page did not prominently describe that request flow.

## Draft answers

Collects data: Yes. Encryption in transit: Yes. Account creation: Username and password; OAuth.

All selected types were declared collected, non-ephemeral, and optional. Optionality reflects guest access, user-submitted content/feature choices, location permission, and opt-in analytics. Sharing was not selected based on the policy's service-provider processing and user-initiated sharing exemptions; this depends on providers actually processing under the described restrictions.

| Data type | Purposes |
| --- | --- |
| Name | App functionality; account management |
| Email address | App functionality; developer communications; advertising or marketing; account management |
| User IDs | App functionality; analytics; fraud prevention/security/compliance; account management |
| Address | App functionality |
| Phone number | App functionality |
| Approximate location | Analytics |
| Precise location | App functionality |
| Emails | App functionality |
| Other in-app messages | App functionality |
| Photos | App functionality; analytics; account management |
| Health info | App functionality |
| Contacts | App functionality |
| Calendar events | App functionality |
| Diagnostics | Analytics |
| Files and docs | App functionality; analytics |
| App interactions | Analytics; fraud prevention/security/compliance |
| In-app search history | App functionality |
| Other user-generated content | App functionality |
| Device or other IDs | App functionality; analytics; fraud prevention/security/compliance |

## Evidence checked

- Live `https://envitefy.com/privacy`, including 18+ account eligibility, uploads, AI/OCR processing, health appointments, guest responses, service providers, optional analytics, calendar handling, privacy requests, and retention wording.
- `docs/android-full-site-release-plan.md`, Android manifest, and Android release documentation.
- `src/lib/auth.ts`, signup route, and account/profile handling.
- `src/components/PrivacyControls.tsx`, `src/lib/privacy-preferences.ts`, `src/utils/event-tracking-client.ts`, and analytics events API: analytics consent gating and visitor identifiers.
- `src/lib/dashboard-origin.ts` and dashboard enrichment route: optional foreground geolocation and Mapbox travel estimates.
- Upload/original-file routes and medical appointment category: images/PDFs and sensitive event content.
- `src/app/api/events/[id]/messages/route.ts` and `src/lib/event-messages.ts`: stored guest email messages and recipient contact lists.
- `src/hooks/useRecaptcha.ts`: optional form workflows use reCAPTCHA for abuse prevention.
- Public account-deletion page verification was read-only; no real deletion request or support message was sent.

Google's data-category and exemption guidance: https://support.google.com/googleplay/android-developer/answer/10787469

# Envitefy iOS preparation — September 19, 2026

## Verified account status

Apple Developer sign-in succeeded. Its account page displays **Join the Apple Developer Program**. After the user accepted the App Store Connect Terms of Service, the portal displayed **Your Apple Account isn't enabled for App Store Connect**. No store record or production bundle ID was registered. Proposed registration data is in `ios/app-store/app.json`; `teamId` and `appStoreAppleId` are intentionally null.

Paid Apple Developer Program membership is the next account prerequisite. Registration and listing editing can happen from Windows after enrollment. An iOS build, native compilation, signing, device tests and real app screenshots remain for macOS/Xcode.

## Architecture and implemented code

Use a native SwiftUI target with WKWebView for the existing live Next.js app and server APIs. Do not static-export this server-dependent app or overwrite the Android TWA. The target has no CocoaPods or third-party native SDK dependencies and no privileged entitlements, so initial personal-team testing does not depend on paid capabilities.

The native shell provides a safe-area-aware bottom control strip, Back, Home, Refresh, Sign in, public-event sharing, file-download sharing and external links. The website continues to own event composition and explicit draft saves. The page bridge routes destructive navigation through UnsavedProgressProvider. Native swipe-to-go-back is disabled so it cannot skip this prompt. Backgrounding does not auto-save or reload. Web-content process termination is reported honestly; in-memory work cannot survive a crashed process.

The 1024px AppIcon PNG derives from the existing approved 512px icon without changing its artwork or colors. It is an existing-asset resize required by Apple's asset catalog, not newly generated artwork. The original is retained. A higher-resolution approved source can replace it before distribution if available.

## Authentication contract

1. Native sign-in and calendar requests first use the existing Save / Discard / Keep editing guard. After resolution, the app generates independent 32-byte random verifier and state values in memory, and opens `/mobile/sign-in` with the S256 challenge and state through ASWebAuthenticationSession.
2. The system-browser session is ephemeral. The existing email and Google flows run in the browser, retaining signup intent and explicit legal acceptance. The screen identifies the signed-in account and requires **Continue in Envitefy**.
3. The authenticated, same-origin JSON POST to `/api/mobile/auth/authorize` creates a 90-second one-use code in Postgres. Only a code hash is stored; the session value is the existing encrypted NextAuth JWT. An atomic database quota allows at most 20 authorizations per account in a ten-minute window, across instances.
4. Only the opaque code and native state appear in the `envitefy://auth/callback` URL. The active native browser session checks the exact callback host/path and state. General app URL openings do not import sessions.
5. Native POSTs the code and verifier to the fixed HTTPS exchange endpoint, refuses HTTP redirects, and receives the session through Secure/HttpOnly cookies. PostgreSQL atomically consumes the code, clears its session column and verifies user existence and both expiry times. Native installs cookies in WKHTTPCookieStore; page JavaScript never receives them.
6. The web session refreshes and navigation uses the existing unsaved-progress guard. No event is saved or published by authentication.

Apply `prisma/manual_sql/mobile_auth_codes.sql`, add hourly cleanup, deploy the web integration and then set `IOS_AUTH_ENABLED=1`. No production database/schema/flag changes were performed in this task. New endpoints fail closed without the flag or configured secret. Unit tests mock the database boundary; separate checks execute the actual SQL in isolated, in-memory PostgreSQL through PGlite. These passed for expiry, replay protection, quota enforcement and restricted table access. PGlite uses one connection, so this does not establish production behavior under multiple simultaneous database connections.

Ordinary Google/Outlook calendar connections reopen this browser flow and use the existing OAuth `next` return parameter. The account shown to the user is the one that receives the calendar connection. Legacy OAuth requests with an embedded event operation and admin Analytics connections are explicitly deferred to the website rather than silently losing their original payload. These flows need device verification before full parity can be claimed.

## Store registration values

| Field | Prepared value |
| --- | --- |
| Name | Envitefy |
| Platform | iOS (iPhone and iPad) |
| Explicit bundle ID | com.envitefy.app — proposed, availability unverified |
| SKU | envitefy-ios |
| Language | English (U.S.) |
| Version / build | 1.0.0 / 1 |
| Minimum iOS | 17.0 |
| Categories | Lifestyle / Productivity — proposed |
| Support | https://envitefy.com/contact |
| Marketing | https://envitefy.com |
| Privacy | https://envitefy.com/privacy |

Listing text is checked against Apple's field-length limits and exported to `ios/app-store/en-US/`. There is no fabricated seller name, review login, age rating, export-compliance answer or privacy label.

## Remaining release requirements

These are explicit false entries in `ios/app-store/release-status.json`. The archive helper checks them. The source is prepared for initial Mac testing, not a submission-ready release.

- **Sign in with Apple or another qualifying equivalent:** current production authentication exposes email/password and Google. `src/lib/apple.ts` contains a client-secret helper, but an Apple provider and end-to-end account lifecycle are not connected. Configure a primary App ID, a Services ID, approved domains/return URL and signing key after membership activation, then implement and test first-time signup, subsequent login, relay email delivery and revocation. Do not market the existing helper as working Apple login. Apple's login-services review requirement must be resolved before distribution.
- **In-app account deletion:** existing account deletion is admin-only. Implement authenticated, reverified self-service initiation and complete related account/content/token cleanup, including Apple token revocation if Apple sign-in is added. Test on disposable data. A support email alone is not a completed implementation.
- **Paid functionality:** inspect the actual iOS storefront/payment flow and applicable regional rules before exposing digital purchases or external purchase links. No StoreKit purchase implementation or payment compliance decision is included in this preparation.
- **Privacy and tracking:** inventory the loaded website, uploads, AI processing, location, connected calendars, cookies and analytics. Confirm consent/ATT behavior and record App Store privacy disclosures for actual data collection. The native privacy manifest currently records only the absence of directly used required-reason APIs. It does not assert that the website collects no data.
- **Age rating / export compliance / rights:** answer Apple's questionnaires from verified behavior and actual company ownership. The build intentionally does not pre-answer encryption exemption.
- **Native utility and review:** validate native file sharing, camera and calendar workflows as usable features. Apple reviews minimum functionality; adding a web view alone does not guarantee approval.
- **Device evidence:** clean Xcode build, XCTest results, first-party and external navigation, capture/upload, file downloads (including blobs), calendar flows, explicit saves, accessibility, small phones, large text, rotation and iPad. Supply authentic screenshots and a working review account through App Store Connect.

## First-device checklist

| Area | Required evidence |
| --- | --- |
| Identity | Correct app icon/name; signing team and bundle match the store record |
| Login | Email and Google success/cancel/error; signup intent and legal acceptance preserved; same account in web and app; sign-out then sign-in; cookie chunking |
| Creation | Every enabled category and Create; reference uploads; accepted artwork; save, resume, discard; Save failures keep editor open |
| Guest flows | RSVP and signup, private links, permissions, recovery links; no private management URL shared by native toolbar |
| Files | Camera, photo picker, PDF uploads, generated image/PDF/video/blob downloads and native share sheet |
| Planning | Google/Outlook connect/cancel/error and existing sync; Apple calendar subscription links; directions and location denial |
| Lifecycle | Background/foreground without auto-save, offline retry, server failure, web-process crash message, no invisible reload |
| Navigation | Internal links, target=_blank, external HTTPS, phone/mail/calendar schemes, disabled unsafe schemes, guarded Back/Home/Refresh |
| Accessibility | VoiceOver labels, 44pt controls, larger Dynamic Type, reduced motion, keyboard focus and portrait/landscape |
| Store | Account deletion, qualifying login, payment rules, privacy answers, age rating, export compliance, screenshot sizes and reviewer access |

## Validation recorded on Windows

- `node ios/scripts/prepare.mjs` and `verify.mjs`: passed project-reference, metadata-length, TLS and opaque 1024px PNG checks.
- Handoff unit tests plus middleware/auth routing regressions: 20 passed, including the native message contract and ordinary-browser fallback. Database behavior is mocked in these tests; no live-session or production mutation was performed.
- `node ios/scripts/test-postgres.mjs`: passed actual migration idempotency, PKCE verification, replay and expiry rejection, session clearing, authorization quota, restricted-role access and account-deletion cascade in disposable PostgreSQL. No live data was accessed.
- Biome lint: passed new integration files and touched website integration files.
- Browser: authenticated handoff confirmation rendered at 375×812 and 812×375, with no horizontal clipping. Native SwiftUI layout remains unrendered until Xcode is available.
- Editor diagnostics: unavailable because the Chat to CLI bridge is not running. Full-repository TypeScript exhausted the default Node heap. The focused `ios/scripts/typecheck.mjs` check found zero diagnostics in integration files and 76 existing diagnostics in imported `src/lib/meet-discovery/core.ts`.
- The local browser also logged existing database-pool/connectivity failures; UI rendering is verified, but the existing logged-in session is not evidence of a live end-to-end authentication round trip.
- Not run: Xcode/Swift compilation, XCTest, device installation, actual ASWebAuthenticationSession/cookie exchange, production schema/deployment, registration and upload.

## Primary references

- [Apple developer account and free provisioning](https://developer.apple.com/help/account/basics/about-your-developer-account)
- [Program enrollment](https://developer.apple.com/programs/enroll/)
- [Add an App Store Connect app](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app)
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Configure Sign in with Apple for the web](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/)
- [WKDownload destination contract](https://developer.apple.com/documentation/webkit/wkdownloaddelegate/download(_:decidedestinationusing:suggestedfilename:completionhandler:))

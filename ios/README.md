# Envitefy for iPhone and iPad

Native SwiftUI / WKWebView project for the live Envitefy website. Bundle identifier: `com.envitefy.app`; iOS 17+; version 1.0.0 (1). No Node, API keys, database credentials, or backend code ships in the app. The existing Android project is independent.

**Status: source prepared on Windows, not compiled or tested on an Apple device. Not ready for App Store submission.** Apple Developer was signed in and App Store Connect was checked on September 19, 2026. Apple reports that the account is not enabled for App Store Connect; the account dashboard offers enrollment. No App ID, store record, signing certificate, paid membership, or upload was created.

## Prepared

- Xcode project and shared build/test scheme; no project generator is required on the Mac.
- Native Back and app-actions menu, public-event sharing, download-to-share-sheet, retry/error states, camera/photo permission descriptions, and external links.
- System-browser email/Google sign-in using ASWebAuthenticationSession, PKCE, an expiring one-use code, and HttpOnly session cookies. No passwords or session tokens in URLs, page scripts, UserDefaults or native logs.
- Google/Outlook calendar connection through the same browser session. Account selection is explicit; existing connected calendars remain on the server. Legacy calendar requests carrying embedded event state and admin Google Analytics connections still need the website.
- Web integration for explicit-save navigation guards. Native navigation does not silently discard or save editor progress.
- Opaque 1024px icon derived from the existing approved icon; metadata and registration values in `app-store/`.
- Distribution gate that lists unfinished review requirements instead of representing the project as ready.

## Windows checks

Run from the repository root after installing the existing root dependencies:

```sh
node ios/scripts/prepare.mjs
node ios/scripts/verify.mjs
node ios/scripts/typecheck.mjs
node --test src/lib/mobile-auth.test.mjs src/middleware.auth-routing.test.mjs
```

Optional database checks run the actual migration and authentication SQL in an isolated in-memory PostgreSQL engine, without loading environment files or connecting to the live database:

```sh
npm install --prefix .qa/ios-postgres --no-save --package-lock=false @electric-sql/pglite
node ios/scripts/test-postgres.mjs
```

This checks expiry, replay protection, the authorization quota and restricted table access. The single-connection engine does not replace a multi-instance production load test.

`prepare.mjs` regenerates the project, asset catalog and localized listing files from checked-in sources. It does not contact Apple or change credentials. Keep `app-store/app.json` as the source of truth for bundle/version/listing values. Keep private signing material out of Git; `.gitignore` covers local signing files.

## Backend prerequisite

Deploy the new website code and apply `prisma/manual_sql/mobile_auth_codes.sql` to the same database used by the website. Use the existing privileged application database connection; these two tables deliberately have RLS enabled and no public policies. Set `IOS_AUTH_ENABLED=1` on the server only after migration. Keep the existing `AUTH_SECRET` / `NEXTAUTH_SECRET` and canonical HTTPS `NEXTAUTH_URL`; no new client secret is needed for this handoff. Keep request bodies and cookies out of telemetry for `/api/mobile/auth/*`.

Schedule the SQL file's two cleanup statements hourly. Turning off `IOS_AUTH_ENABLED` disables issuance and exchange immediately. These code changes are local; the production migration, deployment and flag have not been applied by this task.

The app connects to `https://envitefy.com`; a localhost dev page on Windows is only a browser preview. Do not weaken App Transport Security or put localhost/credentials in a release configuration.

## First Mac session

1. Open `Envitefy.xcodeproj` in a compatible current Xcode. For simulator testing, no paid account is needed.
2. Run `bash ios/scripts/build-mac.sh simulator` from the repository root, or build the Envitefy scheme in Xcode.
3. Run `xcrun simctl list devices available`, set `IOS_SIMULATOR_ID`, then run `bash ios/scripts/build-mac.sh test`.
4. For a personal iPhone test, select your Personal Team in Signing & Capabilities. Keep the default target without paid capabilities. Apple free provisioning expires after seven days. If the proposed bundle ID is unavailable, choose a temporary development ID; do not change a registered production identity casually.
5. Execute the device checklist in `docs/ios-release-plan.md`. Capture real simulator/device screenshots only after behavior is verified.

When enrolled, set the actual team and App Store app ID in `app-store/app.json`, regenerate, and select the enrolled team for the app and test targets. Never invent these IDs. The supplied archive script runs `verify.mjs --release` and refuses to archive until every release gate is complete; it does not upload or publish.

## App Store connection

The free account cannot create the store record. After membership activation, use `app-store/app.json` to register an explicit App ID, then add an iOS app in App Store Connect with the matching bundle ID and SKU. Registration itself does not require a Mac. Do not accept paid enrollment or binding agreements on someone else's behalf without their approval.

Read `docs/ios-release-plan.md` for Apple sign-in, account deletion, payments, privacy, export compliance, screenshots and review-account requirements. Those are release work, not solved by wrapping a website.

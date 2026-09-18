# Envitefy Android: full live-site release plan

Planning date: September 18, 2026.

Implementation started September 18, 2026 after approval. Version 1.0.2 / code 4
is now active in Play Internal Testing with the official Envitefy launcher icon
and foreground location delegation, retaining the 1.0.1 launch crash fix.
The website association is deployed through GitHub main to Vercel. See
[the current build record](android-release-1.0.2.md) for the installation link,
validation, artifact locations and remaining device checks.

## Agreed product scope

The first Android release must provide all features currently available on the live Envitefy website. There is no reduced-feature first release. Preserve existing accounts, permissions, data, URLs, artwork, creation tools, signup forms and Studio functionality.

Use the deployed site as the parity baseline. Local changes are included only after their normal web release. Keep the product name Envitefy and application ID `com.envitefy.app`.

## Recommended architecture

Complete the existing Android Trusted Web Activity (TWA) project for this release. The installed app launches the live HTTPS site through a supporting browser, preserving the existing Next.js server, APIs and browser-based sign-in. Android packaging supplies the app icon, launcher and platform integration.

Google documents TWA as an Android integration for owned web content, with app/site ownership verified through Digital Asset Links. It uses browser-rendered content; it does not turn server code into a local native application. [Chrome TWA documentation](https://developer.chrome.com/docs/android/trusted-web-activity)

This architecture follows the full-site requirement. The TWA now produces a signed Android App Bundle. Capacitor is not a prerequisite for an `.aab`.

The app remains an online product, like the live website. Network-dependent features must offer clear loading, error and retry states. Full offline creation or native background rendering is not part of the stated requirement.

## Repository findings before implementation

| Area | Observed state | Work required |
| --- | --- | --- |
| Android application | `android/app/build.gradle` already declares `com.envitefy.app`; version code 1, version name 1.0.0 | Confirm Play package and previously used version codes before signing |
| Android launcher | `LauncherActivity` from Android Browser Helper; launch URL `https://envitefy.com/` | Retain and verify the full live-site route |
| Capacitor | No root config or declared/installed core package was found | Do not initialize over the existing TWA project |
| Web packaging | Existing Next.js server build; no `out/index.html` | Keep the server deployment for the recommended TWA route |
| SDK | Compile and target SDK 35 | Move to a supported API 36+ toolchain |
| Build reproducibility | AGP 8.7.3; no `android/gradlew.bat` | Commit a compatible, pinned Gradle wrapper and document the JDK/SDK versions |
| Website association | Local `public/.well-known/assetlinks.json` names `com.snapmydate.twa` | Add the Envitefy package and correct release signing certificate; confirm whether the legacy association still serves an installed app before removing it |
| Association template | `android/assetlinks.template.json` has the correct package but a placeholder certificate | Replace through the signing workflow, not a guessed fingerprint |
| PWA support | Web manifest and service worker already exist | Validate deployed assets, navigation, updates and offline behavior |
| Local tools | Java 21 and Android platform-tools are discoverable | Verify Android Studio, SDK platform and the chosen Gradle/JDK combination during implementation |

The initial HTTPS check found only the legacy package association. Both the
upload certificate for direct APK testing and the Play app-signing certificate
have since been deployed through GitHub main to Vercel. Live verification passed
for both certificate/package pairs, preserving the legacy entry.

## Implementation sequence

### 1. Establish the release baseline

- Record the exact deployed web version and every customer-visible feature and role.
- Inventory sign-in providers, creation paths, file types, downloads, calendar connections, signup/RSVP flows and Studio tools.
- Confirm Play app ownership, application ID, prior releases, signing enrollment and account type in Console.
- Keep current web build settings and existing application permissions intact.

Exit condition: an agreed feature-parity checklist and verified app identity.

### 2. Make the Android build reproducible

- Update compile/target SDK and choose a mutually compatible Android Gradle Plugin, Gradle wrapper and JDK.
- Pin Android Browser Helper to a tested version and review relevant migration notes.
- Commit the wrapper and build instructions; keep local SDK paths, signing passwords and keystores outside source control.
- Verify Envitefy app name, launcher/adaptive icons, splash appearance, status/navigation bars, Android back navigation and edge-to-edge layouts.
- Build and install a debug package on an emulator and a physical Android phone.

New apps and updates require Android 16 / API 36 or higher from August 31, 2026, subject to Google's stated exceptions. The implementation now targets API 36. [Android target SDK requirements](https://developer.android.com/google/play/requirements/target-sdk)

Exit condition: repeatable local build and successful device launch without application crashes.

### 3. Establish signing and website trust

- Inspect existing Play signing state before creating a new upload key. Preserve signing continuity for an existing app.
- Configure Play App Signing and the local upload signing process as applicable. Back up the upload keystore securely.
- Obtain the **Play app-signing certificate** SHA-256 fingerprint for the Play-distributed application. Do not substitute the upload certificate for it.
- Add an association for `com.envitefy.app` at `https://envitefy.com/.well-known/assetlinks.json` and deploy it through the normal web release process.
- Verify HTTPS delivery, JSON content, no sign-in requirement and the actual certificate/package pair. Verify any additional owned origin only if the app genuinely uses it.
- Configure and test incoming event/signup links separately from TWA fullscreen verification.
- Test a Play-installed build as well as the local debug build; their signing certificates can differ.

Play uses the upload key to identify uploaded releases and the app-signing key for distributed APKs. The website association must match the certificate on the installed app. [Android signing documentation](https://developer.android.com/studio/publish/app-signing)

Exit condition: the Play-installed app opens the verified Envitefy origin without an unexpected browser toolbar, and incoming links reach their intended page.

### 4. Verify every live feature on Android

| Feature group | Required checks |
| --- | --- |
| Authentication | Email/password, Google sign-in, sign-out, password recovery, session persistence, provider redirects and return to the intended page |
| Home and event collections | My Events, invited events, schedules, drafts, search/filtering and role-specific navigation |
| Snap / Upload | Camera capture, gallery selection, supported PDFs/images, OCR, permission denial, upload retry and results |
| Creation and galleries | Every enabled category, template galleries, Envitefy Create, custom themes, generated media and saved drafts |
| Editors | Inline wording, section composition, artwork replacement, touch sorting, preview, explicit save and publish |
| Signup and RSVP | Guest and signed-in flows as deployed, response editing/cancellation, host controls, restricted forms and capacity/waitlist behavior |
| Studio | All Studio functions available on the live site, media playback, generation progress, exports and downloads |
| Sharing and integrations | Share sheet, event/signup links, invitation acceptance, maps, calendar connections and calendar file downloads |
| Account and access | Existing account settings, user/admin role boundaries, and applicable account-deletion flow |
| Lifecycle and reliability | Android back, keyboard, rotation, app background/resume, interrupted uploads, network loss, reconnect and web updates |

All workflows retain the existing explicit-save behavior. Backgrounding the app, previewing or generating artwork must not create drafts automatically. A workflow that fails on Android is a release blocker to fix, not a reason to quietly remove that feature.

External services may show browser controls when navigating away from a verified origin; validate the return experience rather than attempting to hide third-party origins. [TWA origin behavior](https://developer.chrome.com/docs/android/trusted-web-activity/multi-origin)

Exit condition: each applicable feature passes on physical devices and failures have a documented resolution.

### 5. Produce the release artifact

- Set a version code greater than any version already uploaded to this Play app.
- Build the release `.aab` with the upload signing configuration, using Android Studio or the pinned wrapper's `bundleRelease` task.
- Verify application ID, target SDK, version, signing, packaged permissions and absence of debug-only settings.
- Inspect the generated bundle and retain its checksum and build/version record.
- Keep Google/API/database secrets on the server; none belong in the Android artifact.

Exit condition: a verified signed `.aab`, with its exact path and build metadata recorded.

### 6. Distribute through Play Internal Testing

- Upload the reviewed bundle to the existing app's Internal testing track.
- Configure the intended testers and release notes; distribute the opt-in link to the approved testers.
- Install from Google Play and repeat signing/trust, login, upload, deep-link, editor and download checks.
- Complete the applicable app setup, reviewer access, privacy/data-safety declarations, content rating and listing assets before moving toward public distribution.
- Fix findings and increment version code for each new uploaded build.

Internal testing is distinct from public production access. The app's actual
Console shows a requirement for at least 12 continuously opted-in closed-test
testers for 14 days before applying for production access. Internal Testing does
not fulfill that closed-test requirement. [Google testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en), [testing track setup](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en)

Exit condition: testers can install the Play-distributed app and use the complete live Envitefy feature set.

## If Capacitor is a firm requirement

Use a separate native project directory and a dedicated mobile frontend build. Preserve the existing `android/` project until migration is validated. The supplied app ID and app name remain correct; `webDir: 'out'` is only correct if that build actually creates a complete local `out/index.html` and its assets.

A full local Capacitor frontend would require inventorying and adapting every server-dependent screen, navigation path, authentication flow and relative API request. Keep database, OAuth secrets, AI calls, SSR and other server operations online; share portable components and domain logic with the website. Prove a complete authentication/API round trip before porting every feature. Full parity remains required before releasing.

Do not switch the existing Next.js site to static export as a shortcut: server-only features and arbitrary dynamic routes cannot simply run from packaged static files. [Next.js static export limits](https://nextjs.org/docs/app/guides/static-exports)

Capacitor's `server.url` is documented for development/live reload rather than production. Loading the live site through a verified TWA is a different architecture, not a workaround using that setting. [Capacitor configuration](https://capacitorjs.com/docs/config)

## Work performed

The approved implementation adds a pinned Gradle wrapper, API 36 support, upload
signing, verified App Links configuration and certificate merge/verification
tooling. Release and debug builds, Android lint, signature checks and bundletool
validation passed. Google Play accepted version 1.0.0 (code 1), the approved
tester list was selected, and **Save and publish** completed. The track is
**Active**, and the release is **Available to internal testers**. Vercel deployed
GitHub main commit `b923ee2e`; both Android certificates passed live website
association checks. Secure key backup and full physical-device parity testing
remain. A subsequent phone install exposed a launcher crash in 1.0.0. The
standard Android 16 emulator reproduced the missing manage-data component
exception; declaring the activity fixed cold launch, relaunch and incoming HTTPS
intent checks. Version 1.0.1 (code 2) is now published to the same Internal Testing
track. The latest build record is the current status; this plan does not assert
public production readiness.

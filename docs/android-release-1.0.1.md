# Envitefy Android 1.0.1 — launch crash fix

Date: September 18, 2026. Status: **version 1.0.1 is active and available to Internal Testing testers**.

## Change

Version 1.0.0 installed through Google Play but the user reported an immediate
launch crash. Android Browser Helper 2.7.3 calls
`ManageDataLauncherActivity.addSiteSettingsShortcut` during startup. On API 25+
that code enables or disables `ManageDataLauncherActivity` through Android's
package manager. The original manifest did not declare that component.

The new manifest registers this activity, limits external access with
`android:exported="false"`, and supplies the existing Envitefy launch URL for
website settings. The application also references it as its manage-space
activity, matching Google's integration contract. The live site and signing
keys are unchanged. Version is incremented to 1.0.1 / code 2.

[Google's ManageDataLauncherActivity implementation](https://github.com/GoogleChrome/android-browser-helper/blob/main/androidbrowserhelper/src/main/java/com/google/androidbrowserhelper/trusted/ManageDataLauncherActivity.java).

## Artifacts

- Package: `com.envitefy.app`; target API 36, minimum API 23.
- AAB: `android/releases/1.0.1-2/Envitefy-1.0.1-2.aab`.
- AAB SHA-256: `981d7700255d8101cd473f2b7f3c8bf28412e054704f768037092b4e5fe213e5`.
- APK: `android/releases/1.0.1-2/Envitefy-1.0.1-2.apk`.
- APK SHA-256: `f37f46ab8b69a1ba9d4a73eac1ddad83f25bc073a35d91e3d0dd280d0623ca80`.
- Existing upload key retained; both website certificate associations remain valid.

## Validation

- `assembleRelease`, `bundleRelease` and `lintRelease` passed.
- APK signature verification and AAB JAR signature verification passed.
- Bundletool validation passed; decoded manifest confirms code 2, version 1.0.1,
  and the private manage-data activity with its URL metadata.
- Six Android manifest/association guards passed; Biome lint passed.
- Added `android/scripts/launch-smoke.mjs` to install a release APK on an
  explicitly selected disposable emulator, test launch/relaunch/HTTPS intents,
  and check for crashes and the handoff to Chrome.
- On a standard Android 16 / API 36 Google APIs emulator, the archived 1.0.0
  release reproduced `IllegalArgumentException: Component class
  com.google.androidbrowserhelper.trusted.ManageDataLauncherActivity does not
  exist in com.envitefy.app`, thrown during launcher startup.
- Upgrading that emulator to the archived signed 1.0.1 APK passed all three
  scenarios: cold launch, relaunch and incoming HTTPS link, with no Envitefy
  crash and Chrome resumed. The same test fails on 1.0.0 and passes on 1.0.1.
- Runtime evidence is archived beside the bundle in `regression-1.0.0.txt` and
  `launch-smoke.txt`. This does not replace physical-device or full feature tests.
- The emulator handed off to Chrome's `FirstRunActivity`. These checks prove
  the launcher no longer crashes; Chrome onboarding and the live website were
  not exercised by this smoke test.

The installed API 36.1 image hit a separate SurfaceFlinger graphics crash with
both emulator 36.2.12 and 37.1.11. Runtime validation instead used the official
37.1.11 emulator and a standard API 36 Google APIs image. The user has not yet
tested version 1.0.1 on their phone.

## Distribution

Published **1.0.1 (2) — Fix launch crash** to the existing Internal Testing track
and approved tester list. Play Console shows **Active**, **Available to internal
testers**, and release time **September 18, 5:37 PM**. The prior code 1 is excluded
from the new release. No devices lost support. The only Console warning is the
expected missing mapping file for this non-minified build.

Testers should update the existing Play installation; uninstalling or clearing
their data is unnecessary. The app remains unreviewed and is not publicly
released. Play's publication dialog says updates usually appear within one
hour, but may take longer.

[Internal Testing link](https://play.google.com/apps/internaltest/4699523210540474676).

[Release details in Play Console](https://play.google.com/console/u/4/developers/9210338056613116669/app/4973399946558335612/tracks/4699523210540474676/releases/2/details).

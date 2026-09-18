# Envitefy Android 1.0.2 — official icon and foreground location

Date: September 18, 2026. Status: **active and available to Internal Testing testers**.

## Changes

- Uses the existing `public/icons/icon-{48,72,96,144,192,512}.png` assets for the
  installed launcher. Artwork is copied unchanged, with a 22% inset for the
  adaptive foreground. The old generic vector and redundant round resources
  are removed. `android/scripts/sync-icons.mjs` maintains the copies.
- Adds Google's `locationdelegation:1.1.2` through `EnvitefyDelegationService`,
  following the verified-browser delegation contract. Fine and coarse location
  are requested together when the browser asks for location, supporting the
  Android approximate/precise and while-using permission choices.
- Location, GPS and network-location hardware are explicitly optional. Devices
  can install Envitefy and use its other features without a location provider.
- The permission activity is private. No background-location permission,
  tracking service or startup permission request is added.
- Existing Snap capture and media inputs continue to use Chrome/system camera
  and picker access. This architecture does not require unused wrapper CAMERA
  or broad storage/media permissions; adding those would not grant them to Chrome.
- Retains the 1.0.1 launcher crash fix, live site URL and existing signing key.

The Play Store listing is separate from these installed launcher resources.

## Artifacts

- Package `com.envitefy.app`; version **1.0.2 / code 4**; min API 23, target API 36.
- AAB: `android/releases/1.0.2-4/Envitefy-1.0.2-4.aab`.
- AAB SHA-256: `6359486b6ccacc69a874a372b0ec09ec9fa28153e813f6ddc2c9cda22bf4a181`.
- APK: `android/releases/1.0.2-4/Envitefy-1.0.2-4.apk`.
- APK SHA-256: `51becba169ee06c7e39e7a267e716e468186071117b0b258e1be095ebdf52bb9`.
- Code 3 was uploaded only to the draft. Play identified an implied required
  location feature; code 4 explicitly makes it optional. Code 3 must not ship.

## Validation

- Release APK/AAB build and Android lint passed: zero errors, three warnings
  (newer Gradle, missing optional monochrome artwork, and the intentionally
  exported trusted-browser service). The supplied color artwork is preserved.
- Seven Android source/association regression checks and six existing
  dashboard-location behavior tests passed. The latter cover automatic loading
  without a permission prompt, explicit permission requests, account-scoped
  cached origins and fallback/error cases. Biome lint passed for changed JS.
- Bundletool validation and both APK/AAB signature verification passed with the
  existing upload certificate.
- The final decoded bundle has only INTERNET, COARSE_LOCATION, FINE_LOCATION
  and AndroidX's signature-protected internal receiver permission. All three
  location hardware declarations have `required=false`.
- Density-specific icon copies match the source PNGs byte-for-byte. The AAB's
  packaged 512px icon was decoded and compared with the original pixel-for-pixel.
  The white e/plane stays inside the 33dp adaptive safe circle (29.80dp maximum).
- The final signed code 4 APK passed cold launch, relaunch and incoming HTTPS
  intent checks on the API 36 emulator, with no Envitefy crash and Chrome resumed.
  Evidence is archived in `android/releases/1.0.2-4/launch-smoke.txt`.
  Location remained ungranted after launch; no launch-time permission prompt ran.

## Distribution

Play Console confirms **Active**, **Available to internal testers**, one version
code, and last updated **September 18, 5:57 PM** for **1.0.2 (4)**. Only code 4
ships; draft code 3 was removed and is retained only in the artifact library.
The previous code 2 is not included. Play reports zero devices losing support.
Its sole warning is the missing deobfuscation file for this non-minified build.

Update the existing Play installation; there is no need to clear app data or
uninstall. Play says availability usually propagates within an hour, sometimes
longer. The existing internal tester list is unchanged; this is not production.

[Release details](https://play.google.com/console/u/4/developers/9210338056613116669/app/4973399946558335612/tracks/4699523210540474676/releases/3/details).

## Device checks still required

Launcher smoke tests exercise cold launch, relaunch and an incoming HTTPS link
on a disposable API 36 emulator. Chrome onboarding, the live site's trusted
browser permission dialog, camera capture and real file selection need separate
device validation; a successful launcher test does not certify those flows.

On the Play-installed phone, verify location allow-while-using, approximate,
deny and ask-every-time choices; app background/resume; camera capture; and
image/PDF selection and cancellation. Google's library has a reported
[Samsung/Play permission-activity issue](https://github.com/GoogleChrome/android-browser-helper/issues/499),
so this integration must not be called fully verified from a sideload smoke alone.

[Internal Testing](https://play.google.com/apps/internaltest/4699523210540474676).

# Envitefy Android 1.0.0 — build record

Date: September 18, 2026. Status: **superseded by 1.0.1 after a reproduced launch crash**.

The initial Play installation succeeded, but launch failed because a browser
helper activity was missing from the manifest. See [the 1.0.1 build record](android-release-1.0.1.md)
for the reproduced exception, fix, runtime checks and published update. The
historical validation and release details below describe the original build.

## Artifact

- Package: `com.envitefy.app`
- Version: `1.0.0`, code `1` (user confirmed this is a new app with no earlier upload).
- Launch origin: `https://envitefy.com/`, using the existing complete live site.
- Minimum Android API: 23. Compile/target Android API: 36.
- AAB: `android/releases/1.0.0-1/Envitefy-1.0.0-1.aab` (3,605,761 bytes).
- Direct-install APK: `android/releases/1.0.0-1/Envitefy-1.0.0-1.apk`.
- AAB SHA-256: `44cd30a4044d11b1337b776fb0693d47a85d1daa7b8f0c2cdc5072406aa300b2`.
- APK SHA-256: `0f81f4c7f46ccb1bc1b5ca64d9dc8bd5a27ba6082b039e825bec08d06a75648e`.

The versioned copies are ignored build artifacts, not committed binaries. Their
folder includes the decoded bundle manifest and `SHA256SUMS.txt`. Rebuilding may
change the hash; do not overwrite these reviewed copies.

## Signing and website association

A new RSA 3072-bit upload key was created without printing its passwords. The
private key is at `android/.signing/envitefy-upload.p12`; configuration is in
`android/signing.properties`. Both are ignored and have restricted Windows ACLs.
Back up the complete signing directory and properties in a secure vault; this
backup has not been verified. Do not regenerate the key for future releases.

Public SHA-256 fingerprints:

| Purpose | Certificate |
| --- | --- |
| Upload / directly installed release APK | `39:FC:8B:DF:BA:E6:40:B4:AD:CA:A4:EC:34:5C:E5:18:A7:01:FD:50:E1:18:EB:3A:16:B8:24:DB:AD:A0:23:2D` |
| Play-distributed app, copied from Play Console's Digital Asset Links JSON | `C5:5A:21:48:E3:B5:6E:AD:9E:52:48:8F:4F:11:06:46:D2:2B:FB:65:65:C2:B6:99:A2:DB:8E:E4:65:08:3C:BC` |

Both associations are in `public/.well-known/assetlinks.json`; the legacy
`com.snapmydate.twa` entry remains intact. The exact verification URL now bypasses
authentication middleware. No debug certificate was added. Both certificates
passed the live HTTPS verification after the GitHub-to-Vercel deployment.

## Website deployment

- GitHub main commit: `b923ee2e9456fc5252d599532ed19b7f95867bd0`
  (`Prepare signed Android release and website verification`).
- Vercel reports **Ready**, **Production / Current**, serving `envitefy.com`.
- [Verified Vercel deployment](https://vercel.com/nexa-lyunxs-projects/envitefy/CL1xanheq7SSaK9X21itCEiPz7yd).
- Live `/.well-known/assetlinks.json` checks passed for the Play app-signing
  certificate and the direct-install/upload certificate.

## Verification performed

- Pinned Gradle 8.14.3, AGP 8.13.2 and Android Browser Helper 2.7.3; built with JDK 21.
- Gradle distribution checksum pinned; generated wrapper JAR matched Gradle's
  official SHA-256 `7d3a4ac4de1c32b59bc6a4eb8ecb8e612ccd0cf1ae1e99f66902da64df296172`.
- `assembleDebug`, `assembleRelease`, `bundleRelease` and `lintRelease` passed.
- Lint: 0 errors, 3 nonblocking warnings (newer Gradle patch available; existing
  adaptive and round launcher icons have no monochrome variant).
- API-specific navigation-bar styling moved to `values-v27` so older supported
  devices do not consume unsupported attributes.
- `apksigner verify` passed for the APK; `jarsigner -verify` passed for the AAB.
  The upload certificate is self-signed, as is normal for Android upload keys.
- Google's bundletool 1.18.3 validated the AAB. Tool download SHA-256 checked
  against the official GitHub release asset:
  `a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29`.
- Decoded AAB manifest verified package, version, SDK levels, launcher and HTTPS
  `android:autoVerify` link filter. No `android:debuggable=true` attribute.
- Bundle contains no private signing files, `.env` files or native `.so` libraries.
- Five Android/association tests and nine existing auth-routing tests passed;
  Biome lint passed for the middleware and new JavaScript tools.
- The local Next.js verification URL returned HTTP 200 JSON without a session
  cookie and included the exact Play app-signing certificate.
- A negative signing check rejected a deliberately nonexistent key path; the
  real key and versioned release files were untouched.
- VS Code diagnostics could not run because its linter bridge is unavailable.

## Play Console and remaining work

Google Play accepted `Envitefy-1.0.0-1.aab` after the user enabled Chrome extension
file URL access and reconnected the extension. The release name and English
notes are saved. The review page confirms code 1 / version 1.0.0, API 23+ and
target SDK 36, with an estimated new-install size of 3.44 MB.

The approved reusable **Envitefy internal testers** list contains one tester and
is selected for this app. The no-testers warning cleared. The remaining warning
concerns a deobfuscation mapping file; this wrapper does not enable
R8/minification, so there is no mapping file to upload.

**Save and publish completed.** Play Console shows the track as **Active**, the
release as **Available to internal testers**, and the release name as
**1.0.0 (1) — Initial Android test**. Console records release on September 18,
5:07 PM. The app remains unreviewed, with the temporary listing name
`com.envitefy.app (unreviewed)`. This is an internal release, not a public launch.

[Internal Testing installation link](https://play.google.com/apps/internaltest/4699523210540474676).
Open it using the approved tester's Google account, join the test, then install
through Google Play.

[Release details in Play Console](https://play.google.com/console/u/4/developers/9210338056613116669/app/4973399946558335612/tracks/4699523210540474676/releases/1/details).

Remaining work:

1. Confirm a secure backup of the signing directory and properties.
2. Install the Play build on Android and run the full feature matrix in
   [the release plan](android-full-site-release-plan.md), including login, camera,
   uploads, creation, explicit saves, signup/RSVP, sharing, calendars and resume.
   No device was connected and no AVD was configured during this work, so no
   device feature-parity or fullscreen trust claim is made.
3. Complete the Console's store setup and closed-test requirements before public
   release. The actual Console shows 12 opted-in testers for 14 continuous days
   are required before applying for production access.

The published internal release uses these release notes:

```text
<en-US>
Initial internal test of Envitefy for Android.
Access the live Envitefy website from the app.
Please test sign-in, event creation, uploads, signup forms, sharing, and calendars.
</en-US>
```

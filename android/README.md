# Envitefy Android Wrapper

This is the native Android Trusted Web Activity wrapper for Envitefy.

It opens the complete live site at `https://envitefy.com/`, including its existing
accounts, editors, APIs, signup forms and server-side features. Website changes
ship through the normal web deployment. This is an online app, not a static
Next.js export. Do not add Capacitor to this directory.

## Build

Pinned toolchain: Gradle 8.14.3 (distribution SHA-256 checked by the wrapper),
Android Gradle Plugin 8.13.2, Android Browser Helper 2.7.3, compile/target SDK 36,
minimum SDK 23. JDK 17 or newer is required; the initial build used JDK 21.
Install Android SDK Platform 36 and Build Tools 35.0.0 through Android Studio.
Use Android Studio to set `local.properties`, or set `ANDROID_HOME` to your SDK.
An example Windows property is `sdk.dir=C\:/Users/you/AppData/Local/Android/Sdk`.

From `android/` in PowerShell:

```powershell
.\gradlew.bat --project-cache-dir .gradle-local :app:assembleDebug
.\gradlew.bat --project-cache-dir .gradle-local :app:assembleRelease :app:bundleRelease :app:lintRelease
```

On macOS/Linux, use `sh ./gradlew` with the same arguments. The dedicated local
cache avoids changing legacy tracked `.gradle` cache files in this repository.
Artifacts are `app/build/outputs/apk/release/app-release.apk` (direct install)
and `app/build/outputs/bundle/release/app-release.aab` (Play upload).

Default version is `1.0.1` / code `2`. Increment the code for every subsequent upload:

```powershell
.\gradlew.bat --project-cache-dir .gradle-local :app:bundleRelease -PenvitefyVersionCode=3 -PenvitefyVersionName=1.0.2
```

## Upload signing

The release build requires a real signing configuration and never falls back to
the debug key. Copy `signing.properties.example` to ignored `signing.properties`
and supply your existing upload key locally. Escape Windows drive colons in
property values, or use a relative path. For CI, the corresponding variables are
`ENVITEFY_ANDROID_KEYSTORE`, `ENVITEFY_ANDROID_STORE_PASSWORD`,
`ENVITEFY_ANDROID_KEY_ALIAS` and `ENVITEFY_ANDROID_KEY_PASSWORD`.

For a genuinely new app with no upload key, Windows users can run
`./scripts/create-upload-key.ps1` once. It creates an RSA 3072-bit PKCS12 key,
exports its public certificate, restricts file access to the executing account,
and refuses to replace an existing signing directory or configuration.

**Back up `.signing/` and `signing.properties` together in your secure vault.**
They are ignored by Git and will not exist in a fresh checkout. Do not paste
passwords into chat, commit them, or include signing files in a release archive.

## Website verification

Google Play signs installed APKs with the **Play app-signing certificate**;
the local upload key only authenticates uploads. In Play Console, open
Protected with Play → Play Store protection → Manage Play app signing.
Use the SHA-256 fingerprint from its Digital Asset Links JSON section.

From the repository root, merge that fingerprint without removing older entries:

```powershell
node android/scripts/assetlinks.mjs --fingerprint 'YOUR_PLAY_SHA256_FINGERPRINT' --write
```

For direct APK testing, the upload certificate can be added separately:

```powershell
node android/scripts/assetlinks.mjs --certificate android/.signing/envitefy-upload.cer --write
```

Deploy `public/.well-known/assetlinks.json` through the normal website release,
then verify the live endpoint (public HTTP 200 JSON with no redirects):

```powershell
node android/scripts/assetlinks.mjs --fingerprint 'YOUR_PLAY_SHA256_FINGERPRINT' --check-live
```

The legacy `com.snapmydate.twa` association is intentionally preserved. Do not
publish debug certificates or placeholders. `android:autoVerify` enables Android
App Links; TWA origin verification is also required before browser controls can
disappear. External OAuth/Maps/calendar origins can legitimately show browser
controls; never claim ownership of those domains.

Build/signature checks do not prove feature parity. Use the device test matrix
in [the release plan](../docs/android-full-site-release-plan.md) before rollout.
Test a Play-installed copy as well as a directly installed APK because their
signing certificates differ.

Before uploading, run the launcher smoke against a booted disposable emulator
with Chrome installed. From the repository root:

```powershell
node android/scripts/launch-smoke.mjs --adb "$env:LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe" --serial emulator-5556 --apk android/app/build/outputs/apk/release/app-release.apk
```

This installs the APK, tests cold launch, relaunch and an incoming HTTPS intent,
checks the crash buffer, and requires Chrome to resume. It clears only the
emulator's crash log and stops only Envitefy between scenarios. It refuses
physical-device serials. A first-run Chrome screen is sufficient for this
launcher check; it does not prove website trust or complete feature parity.

Keep `ManageDataLauncherActivity` declared even if the app does not show its own
site-settings control: Android Browser Helper 2.7.3 enables or disables this
component at launch on API 25+, and Android throws if the component is missing.

## System bars

The wrapper exists because Android's system navigation bar is outside normal PWA
CSS. The web app can set `theme-color` for top browser/status chrome, but it
cannot reliably set the bottom multitasking/home/back bar. This wrapper sets the
two system bars independently:

- status bar: `#FFFFFF`
- navigation bar: `#8D7BE9`

The colors live in `app/src/main/res/values/colors.xml` and are wired into the
TWA launcher metadata in `app/src/main/AndroidManifest.xml`.

Without the matching certificate fingerprint, Chrome may fall back to custom tab
behavior instead of full trusted-app behavior.

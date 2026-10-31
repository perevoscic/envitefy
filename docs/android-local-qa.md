# Local Windows Android QA

The local runner installs an Envitefy APK on one dedicated headless emulator,
checks the Android wrapper, optionally runs a Maestro flow, collects diagnostics,
and requests normal shutdown. It retains the AVD's userdata for the next run.
It creates no schedule; each invocation is one bounded QA run.

The device is `Envitefy_Local_QA` on `emulator-5554`, with a stock Pixel 7 profile
and the Android 14 Google Play x86_64 system image. Its files live under
`.tools/android/local-qa/avd/`. This is separate from the existing QA01–QA13
account fleet and its Play-installed apps. The runner locks only `emulator-5554`
and refuses to attach to an existing device on that serial or reuse an unresolved
local QA lease. Other fleet devices and their leases do not block this dedicated
AVD. Its shutdown checks are scoped to its own emulator processes.

## Prerequisites

Run commands from the repository root in PowerShell. Use the project's Node.js
24 runtime and install these Android SDK components through Android Studio:

- Android Emulator and Platform Tools (`emulator.exe`, `adb.exe`).
- Android SDK Command-line Tools in `cmdline-tools/latest/`, including
  `avdmanager.bat` and its Java runtime prerequisite.
- `system-images;android-34;google_apis_playstore;x86_64`.
- Android SDK Build Tools with `aapt.exe`, used to inspect the APK before launch.

The runner resolves the SDK from `ANDROID_HOME`, then `ANDROID_SDK_ROOT`, then
`%USERPROFILE%/AppData/Local/Android/Sdk`. A working Windows emulator acceleration
setup is required. Build the APK using the [Android wrapper instructions](../android/README.md).
The runner accepts only the `com.envitefy.app` package.

Maestro is required only when supplying `--flow`. The existing
`scripts/maestro-install.ps1` installer and `MAESTRO_BIN` override remain
available. The optional flow preflight runs the configured Maestro executable's
`--version` before launching the device.

## Commands

```powershell
npm.cmd run android:qa -- doctor
npm.cmd run android:qa -- setup
npm.cmd run android:qa -- run --apk android/app/build/outputs/apk/release/app-release.apk
```

`doctor` checks SDK tool/image files and the dedicated AVD's registry, image,
hardware and ownership marker. Before the first `setup`, it reports the AVD as
not provisioned and exits with code 1. A successful doctor check does not prove
that ADB can connect or the emulator can boot. `setup` creates the isolated AVD;
repeating it validates and retains an already provisioned device.

Use `npm.cmd` in PowerShell so the npm PowerShell shim does not consume the
runner's flags. Direct invocation also works: `node scripts/android-local-qa.mjs`.

Every `run` requires an explicit APK. It copies that APK into the run directory
before inspection, then records the copy's SHA-256 and version,
installs with `adb install -r`, verifies the installed package/version, and
checks cold launch, relaunch and an incoming `https://envitefy.com/` intent.
Each launcher check requires Chrome to resume and checks the crash buffer for
Envitefy or Android system crashes. The previous crash-buffer contents are
recorded before the buffer is cleared for each scenario. App userdata is not
cleared.

Chrome's first-run screen satisfies the launcher check. This result verifies
the wrapper's handoff to Chrome; it does not verify website rendering,
authentication, Digital Asset Links, or a complete user workflow.

To run a reviewed Maestro flow after those launcher checks:

```powershell
npm.cmd run android:qa -- run --apk android/app/build/outputs/apk/release/app-release.apk --flow path/to/reviewed-flow.yaml
```

The flow runs from its original directory so relative flow/script references
continue to resolve. The report records and copies the entry YAML; it does not
claim to snapshot every referenced dependency. The entry digest is checked again
before and after execution; a changed entry makes the result incomplete. Maestro receives
`MAESTRO_ANDROID_APP_ID=com.envitefy.app` and
`MAESTRO_BASE_URL=https://envitefy.com`, with a separate runtime home for this
run. The runner does not load `.env.maestro.local` or perform account sign-in.
Only pass flows whose actions you intend to execute: this Trusted Web Activity
opens the live Envitefy site, and a flow can change real application data using
any session already retained on this dedicated device.

Optional location simulation uses **longitude,latitude**:

```powershell
npm.cmd run android:qa -- run --apk android/app/build/outputs/apk/release/app-release.apk --location=-87.6298,41.8781 --boot-timeout-ms 180000 --test-timeout-ms 300000
```

The defaults are 180 seconds for Android boot and 300 seconds for the optional
Maestro flow. Individual SDK commands also have bounded timeouts. Location is
an application QA input and is recorded as such.

## Results and retained state

Each run writes a fresh directory under
`output/maestro/local-qa/runs/<timestamp>-<id>/`. Depending on the completed
stages, it contains `report.json`, lifecycle state, emulator stdout/stderr,
`commands.jsonl`, logcat, package/activity inventories, display inventories and
`screen.png`. A Maestro run adds its log, JUnit result and flow artifacts.
These directories and the AVD files are ignored by Git. Screenshots and logs
can contain application data; review them before sharing.

The process exits with code 0 only when every required check, diagnostic and
normal shutdown completes successfully. Code 1 means the report needs review:

- `passed` records the checks that actually completed.
- `failed` records an explicit check assertion, such as a detected crash or a
  package/version mismatch. Read the named check before attributing it to the app.
- `incomplete` records a timeout, unavailable tool, missing evidence, diagnostic
  failure, or unverified shutdown. A timeout alone does not establish an app defect.

Earlier successful checks remain in the report when a later check fails.
Maestro needs both a successful command and complete successful JUnit evidence;
skipped tests are not accepted as passes. APK installs are always identified as
`adb_sideload`, regardless of any installer metadata retained by Android.
These reports do not establish a Play installation, human tester participation,
continuous enrollment, or production eligibility.

The emulator uses `-no-window -no-audio -no-snapshot -no-boot-anim`. Disabling
snapshots does not disable userdata persistence. This version cold-boots the
same data image and does not create, restore or clone named snapshots. Android
documents [headless startup and retained userdata](https://developer.android.com/studio/run/emulator-commandline)
and [emulator-console controls, including simulated location](https://developer.android.com/studio/run/emulator-console).

## Interrupted-run recovery

The launch lease is `output/maestro/local-qa/running-device.json`. A boot failure
still attempts normal shutdown of the device started by this run. If shutdown
cannot be verified, the runner retains the lease and its evidence.
Inspect the reported check and saved emulator logs, then request a normal stop:

```powershell
npm.cmd run android:qa -- stop
```

`stop` requires the dedicated ownership lease, checks the connected AVD identity,
requests emulator shutdown, and removes the lease only after verifying device
disconnection and emulator process exit. It does not force-kill other devices.
If recovery remains incomplete, retain the AVD and inspect the named process or
ADB failure. Do not delete userdata, recreate the AVD, or remove an unresolved
lock merely to make the next run start. A device UI lock left by an interrupted
process must be investigated before manual removal.

Run the runner's offline regression suite with `npm run test:android:qa`.

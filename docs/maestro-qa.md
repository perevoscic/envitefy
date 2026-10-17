# Maestro account testing

This suite has eleven active account flows: QA01–QA10 and QA12. QA11 is disabled by explicit user instruction: default runs exclude it, explicit selection fails, and its credentials are not loaded. The archived calendar flow is under `.maestro/disabled/`.

The requested target is the Google Play Android app `com.envitefy.app`. Eleven **Google tester** credential pairs have been supplied in ignored `.env.maestro.local`; these have not been verified as Envitefy password accounts. `MAESTRO_AUTH_PROVIDER=google` identifies them, and the runner refuses to submit these credentials to Envitefy's password endpoint. The eleven specialized business workflows remain Android drafts. The separate account-activity runner exercises Google signup, real file upload, publication, dashboard persistence and reopening on the inspected Play build; consult the activity index for each account's evidence. A desktop browser test does not verify the Play build.

The default command loads `.env.maestro.local`, or the same variables from the process environment in CI. It stops before app requests when required values are missing. Android preflight runs before any account login and rejects missing devices, missing packages, and packages not identified as Play installed.

An optional website fixture mode creates eleven synthetic non-admin accounts and a disposable PostgreSQL cluster. These are separate from the supplied accounts and do not verify the Play build.

## Real account activity and resumable logs

The requested outcome is actual Android account activity: use Snap/Upload, create and publish clearly named test events, then revisit them. The user authorized publication. UI actions run on the Play-installed app; records are not seeded or activity timestamps fabricated.

`scripts/maestro-activity.mjs` runs a selected `.maestro/android/activity/` stage. It loads the selected account's variables, rejects QA11, checks the Play installer/version and preserves every attempt under `output/maestro/activity-<account>-<timestamp>/`. `state.json` and `journal.jsonl` retain checkpoints. Each attempt saves its source flow and digest, console output as it arrives, JUnit, screenshots, Maestro commands/hierarchy and Android logs. `activity-summary.html` separates passed UI steps, failed/incomplete attempts and findings confirmed by evidence review. Resume only at the stage matching the current UI; inspect existing records before repeating an upload or publication.

The user explicitly authorized creating QA02–QA10 and QA12, accepting required signup consent, and running Snap/create/publish tests. `switch-google-signup` and `resume-signup` require `--provision-test-account`. Google phone/MFA challenges still require normal completion by the account owner. Google setup evidence is saved separately under `output/maestro/google-setup-<step>-<timestamp>/` with the selected alias in `status.json`.

For an existing verified account, `switch-google-login` uses Login and Sign in with Google, selecting its existing Google session. It does not accept signup consent. Reuse the original activity run, inspect any Google consent screen, then run Profile, dashboard persistence, reopening and the read-only verifier. A reopening audit reuses the saved event and does not require another Upload step.

When Google requests a six-digit SMS code, supply the owner's current code through the process-only `MAESTRO_VERIFICATION_CODE` variable and run `node scripts/maestro-google-setup.mjs chrome-code --account <alias>`. The helper checks Google's host and the selected email before entry, redacts the code from textual artifacts, and records submission separately from sign-in success. Clear the process variable afterward. Inspect the resulting screen before continuing consent or app tests.

The activity and Google setup helpers reserve an exclusive device lock under `output/maestro/android-ui-<serial>.lock`; a second helper stops before driving the UI. Wait for a helper's process to finish before starting another Maestro run or an external `uiautomator dump`. If a killed process leaves a lock, inspect the owning process and its logs before removing that exact lock file. Do not clear Chrome data or remove Google accounts as a recovery shortcut. Signup recovery returns through the existing UI; relaunching the Android task can restore an old OAuth tab or Settings screen.

Camera capture is unavailable for this testing by the owner's explicit instruction. Use Upload file and the prepared account PNGs; do not capture camera images or count camera behavior as verified. `output/maestro/camera-testing-unavailable.json` and the activity index record this limitation. Decline an Android camera permission prompt before choosing Files. QA06's interrupted upload retained its unexpected camera screenshot and Android's Chrome exit record (`PERMISSION CHANGE`, one-time permission revoked); that incomplete attempt does not establish an Envitefy camera defect. The file selection now uses a single tap.

Before `enter-snap` or `scan-upload`, a read-only Chrome companion check verifies the active Envitefy email against the selected alias and checks for an existing matching test event. A mismatch, unavailable check, degraded history or existing test event stops the upload. This companion check does not create records. Every completed activity attempt also saves a bounded `android-errors.log` snapshot and its capture status; those Android errors may include earlier attempts. `node scripts/maestro-activity-status.mjs` writes `output/maestro/activity-index.html` and `.json` for all eleven allowed accounts, distinguishing verified created/public events from unfinished setup. `confirmed-issues.html` and `.json` group repeated observed mismatches across accounts while retaining each occurrence and its cause uncertainty. After the My Events reopen stage, run `node scripts/maestro-activity-verify.mjs <activity-run-id>` for read-only owner/date/current-route/anonymous guest checks, then `node scripts/maestro-activity-finalize.mjs <activity-run-id>` to save the verified checkpoint and linked setup evidence.

Each `addMedia` stage imports the unchanged source flyer under a unique `snap-input-<account>-<attempt timestamp>.png` filename. The run saves `snapMediaFilename`, and subsequent picker/scan stages select that exact escaped filename. This avoids Android's duplicate-name suffixes when resuming an import. The original `snap-input.png` remains the comparison source. `restore-app` relaunches the installed Play launcher without uploading; inspect saved history before resubmitting anything after a browser interruption.

The first live pilot is `activity-QA01-1792191469442`. Real OCR and attachment upload returned HTTP 200, event creation returned HTTP 201, and the saved event appeared on QA01's dashboard. The [test workshop guest page](https://envitefy.com/event/envitefy-qa01-test-workshop) returned HTTP 200 without authentication. Its saved owner matches QA01. QA02 subsequently completed normal Google signup, matching Profile/session checks, a distinct real Snap upload, anonymous public guest access, dashboard persistence and My Events reopening in `activity-QA02-1792193135800`. Its workshop is `https://envitefy.com/event/envitefy-qa02-test-workshop`. See `output/maestro/activity-index.html` for current progress across all eleven allowed accounts.

The pilot found a confirmed time mismatch: the source flyer specifies October 30, 2026, **1–2 PM America/Chicago**, while the saved `startISO`/`endISO` represent **6–7 PM**. `confirmed-findings.json`, `saved-fields.json` and the original test flyer preserve the evidence. `time-shift-analysis.json` reproduces the exact five-hour shift in local code when OCR serializes a UTC instant without its offset and the client interprets that value as Chicago local time. The live OCR intermediate fields were not captured for this first event, so that production cause remains a candidate rather than a verified server trace. The published test event has been retained unchanged for reproduction. QA02 reproduced the same mismatch with live intermediates captured: OCR returned `2026-10-30T18:00:00` / `19:00:00` and an empty timezone, while the history request submitted `23:00Z` / `00:00Z` with `America/Chicago`; the saved row matches that request. This supports the offset-loss/Chicago-parse explanation. The production provider/internal Date value remains unobserved.

The pilot also retained a Chrome ANR (Android waited 5001 ms for a focus event), a Maestro launch connection timeout, and navigation-selector/prompt issues as separate environment or test failures. They are not included in the confirmed app-finding count.

For TWA diagnostics, `adb -s emulator-5556 forward tcp:9223 localabstract:chrome_devtools_remote` exposes the dedicated test browser locally. `node scripts/maestro-browser-observe.mjs <activity-run-id>` observes that browser for ten minutes without driving it. It saves console errors, HTTP status/failure messages and allowlisted OCR/history date fields to `web-events.jsonl`. It excludes cookies, headers, raw request bodies, credentials and URL query strings. Native Maestro assertions and read-only browser/API companion checks remain distinct evidence.

The next confirmed extraction mismatch occurred on QA05: the source says `Envitefy QA05 Test Workshop`, while the saved/public title is `Invitefy QA05 Test Workshop`. The initial 180-second title wait expired after the event had already been created (HTTP 201). The saved event was reviewed and reopened without another upload. Native navigation now locates the account-specific workshop independently of the brand spelling; the companion verifier compares the exact source title and records a separate confirmed finding. Duplicate guards also recognize a workshop whose brand word was misread.

The `scripts/maestro-activity-batch.ps1` runner takes an explicit allowed `-Accounts` subset and `-ProvisionTestAccounts`, and runs those new accounts sequentially. Use it only within account-owner authorization and select unfinished accounts from the activity index. The batch stops on a failed check, unexpected Google/MFA screen or unavailable diagnostics; its `output/maestro/batch-<timestamp>/state.json` identifies the account, run and stage. It never retries a saved upload automatically. Inspect and resume that existing account run before starting the remaining accounts; preserve confirmed content mismatches.

## Android Studio and Maestro

Android Studio supplies the emulator; Maestro controls its UI. The repository's Android app is a Trusted Web Activity that opens `https://envitefy.com` using Chrome. Android flows use `appId`, native accessibility selectors and an explicitly selected device. Shared login signs out only from Envitefy before switching accounts; it never clears Chrome's stored accounts or browser data. Android selectors remain unverified until exercised on the installed release.

```powershell
# Uses the already installed Android Studio Google Play image; keep terminal running
npm run maestro:android:emulator

# After enrolling a Google tester account and installing through Play on the device
npm run maestro:android:doctor
node scripts/maestro-google-setup.mjs smoke
node scripts/maestro-run.mjs --check --flow QA01
# Account workflow remains guarded until Envitefy OAuth and records are calibrated:
node scripts/maestro-run.mjs --flow QA01
```

The dedicated AVD is `Envitefy_Maestro_Play` at `.tools/android/avd/`, using `emulator-5556` and the installed Android 36.1 Google Play image. Hardware acceleration is required. Its local AVD metadata corrects the old SDK tool's `target=android-0` output to the actual Android 36.1 image. It uses automatic graphics selection. No existing Android Studio AVD is overwritten. Android Studio's Running Devices panel can control the running emulator. To start it with its own interactive window after stopping the running instance, use `powershell -NoProfile -File scripts/maestro-android-emulator.ps1 -Wait -Visible`.

During setup this dedicated device needed a 540×1200 display override at 210 dpi and disabled Android transition animations after System UI/Pixel Launcher stalls. This preserves its approximate logical viewport while reducing software rendering load. It is not full-resolution visual verification. Google setup skips the optional Sign in with ease phone-number discovery and uses the explicit email form.

In this PowerShell environment, call `node scripts/maestro-run.mjs --flow QA01` directly when passing flags. The `npm.ps1` shim consumed the `--` separator during verification. `npm.cmd run test:maestro -- --flow QA01` also preserves arguments on Windows.

The supplied [tester opt-in page](https://play.google.com/apps/testing/com.envitefy.app) enrolls the Google account in the Android test. Install using the [Google Play listing](https://play.google.com/store/apps/details?id=com.envitefy.app). Google Play account enrollment/sign-in is separate from Envitefy login. The Google setup command is `node scripts/maestro-google-setup.mjs email`; it defaults to QA01 and stops after submitting the email at the password screen. A separately inspected password step can be run with `password`. `--account QA02` selects another allowed tester explicitly; QA11 is always rejected before credentials are loaded. MFA, recovery or verification requirements must be completed normally.

On October 16, QA01 completed Google's SMS verification and signed into Google Play. Play displayed **Envitefy (Early Access)** with installation available, then **You've got early access to this app**. The installed package is `com.envitefy.app` version **1.0.3**, version code **5**, installer `com.android.vending`, Android API **36**, with `envitefy.com` app links verified. Chrome setup completed with optional history/tab sync and device backup declined. The app's landing page and Google account chooser opened on the emulator.

QA01's first Envitefy Google login returned **Access Denied — You do not have permission to sign in**. The repository's sign-in callback rejects a new Google user without signup-source and legal-acceptance cookies, and it also rejects callback exceptions. The live response alone did not identify which case occurred. After the user explicitly requested account creation, normal Google signup completed and the Play app displayed **Welcome, Envitefy**, the **Envitefy App** account, and QA01's matching email in Profile. No product defect is established by the earlier login denial. That checkpoint covered QA01 signup only; it did not verify the specialized business workflows. Current account activity is tracked in the activity index. See the ignored `qa-artifacts/maestro/android-device/status.json` for separate setup and check results.

`node scripts/maestro-google-setup.mjs smoke` passed the Play app launch, landing menu and sign-in form in **20 seconds**, without logging in or creating an account. `node scripts/maestro-google-setup.mjs session --account QA01` passed the signed-in dashboard and matching Profile email check in **1 minute 3 seconds**, without modifying that profile or initiating another login. These are two passing setup/session checks, not eleven passing account workflows.

The prepared `signup` step accepts the age/Terms/Privacy checkbox and may create an Envitefy account. It requires explicit account-owner authorization and the additional `--provision-test-account` flag. QA01's first automated attempt timed out after **60 seconds** waiting for the Google account chooser. The retry selected the checkbox but failed its checked-state assertion. Normal UI continuation then completed signup. That original signup helper is not a passing automated provisioning check. The activity runner's separate switch-google-signup and resume-signup flows retain their own exercised evidence. QA11 is rejected for every setup step.

The Android doctor records installed version, installer, device API and verified app links without launching the app or logging in. Google Play enrollment and installation are only complete when their actual UI and package evidence confirm them.

## Windows setup

Prerequisites: Node 24 and Java 17+ with `JAVA_HOME`. Bun and portable PostgreSQL are needed only for optional local fixture mode. On this workstation Java 21 and Bun are already installed. If Bun is installed elsewhere, set `MAESTRO_BUN_BIN` to its executable.

```powershell
npm run maestro:install
npm run maestro:doctor
node scripts/maestro-run.mjs --list
npm run maestro:check
# Only after accounts and test records have been provided:
npm run test:maestro
```

The installer pins Maestro CLI 2.11.0 and portable Windows PostgreSQL 18.4.0-beta.17 under ignored `.tools/`. No Windows service or global PATH change is needed. `MAESTRO_BIN` and `MAESTRO_PG_BIN` override these paths. Maestro's Java user home is under `qa-artifacts/maestro/home`. Anonymous Maestro analytics and optional AI analysis are disabled. Initial Chromium/driver setup can require internet access; run the doctor before an offline test session.

The committed template is `.maestro/accounts.env.example`. `MAESTRO_PLATFORM=android`, `MAESTRO_BASE_URL=https://envitefy.com`, `MAESTRO_ANDROID_APP_ID=com.envitefy.app` and `MAESTRO_ANDROID_SERIAL=emulator-5556` select the requested device and app. Provide email/password variables for QA01–QA10 and QA12 only. Quote passwords containing spaces or `#` using dotenv syntax. Process environment values override the file. Use `--env-file <path>` for a separate file. `MAESTRO_PLATFORM=web` explicitly selects the older browser suite.

Provide the existing event IDs and expected labels in the same file. The template documents each prerequisite: draft/published Live Cards, an owned scan, separate signup forms, pending co-host invitations and a full waitlist slot. QA02 owns the QA09 card; QA06 owns the QA07, QA08 and QA10 forms. QA12 is unrelated to those owners and points at QA05's private event. Each co-host account must have exactly one pending invitation. Use dedicated records: these flows publish a draft, edit wording/titles, reserve/cancel slots, promote a waitlisted participant and revoke the QA09 co-host. Subsequent reruns require restoring those preconditions. The configuration check validates variables and formats without logging in; it does not prove credentials or records exist.

Optional local fixture mode uses loopback ports 3217 (proxy), 3218 (Next), 55447 (PostgreSQL), 4327 (local storage) and 4328 (disabled AI boundary). Occupied ports fail setup. It uses Next's existing per-port development-server wrapper and warms initial compilation through authenticated HTTP requests.

## Accounts and flows

| Account | Flow | Checks |
| --- | --- | --- |
| QA01 | `01-auth-onboarding.yaml` | Android draft: Google OAuth account and dashboard; website profile: incorrect/correct password |
| QA02 | `02-livecard-create.yaml` | Existing artwork draft, wording edit, explicit save, reload, review and publication |
| QA03 | `03-livecard-edit.yaml` | Published wording edit, Save changes, persisted original event |
| QA04 | `04-event-page.yaml` | General Event template and custom section editing |
| QA05 | `05-snap-upload.yaml` | Seeded private scan details and positive owner original access |
| QA06 | `06-signup-host.yaml` | Host dashboard, person/item views, availability |
| QA07 | `07-signup-participant.yaml` | Reserve, edit, cancel and retained cancellation audit record |
| QA08 | `08-signup-waitlist.yaml` | Join full-slot waitlist; API companion cancels the seeded reservation and verifies promotion |
| QA09 | `09-event-cohost.yaml` | Explicit acceptance, wording edit, limited controls, server permissions and revocation |
| QA10 | `10-signup-cohost.yaml` | Form acceptance, title edit, host dashboard and server permission boundaries |
| QA11 | Disabled | Never selected or authenticated |
| QA12 | `12-account-isolation.yaml` | Unrelated private history access, participant projection, original denial with positive owner control |

The filenames `auth-onboarding` and `snap-upload` identify coverage families. QA01 uses an existing account; it does not certify new-account registration/onboarding. QA05 uses an existing scan; it does not certify the file picker or provider OCR. These limits are also recorded in run reports. Each flow requires its documented records before it runs.

Shared login opens the application's dedicated `/mobile/sign-in` surface. The Android draft selects Sign in with Google and the matching Google account; it does not type the Google password into an Envitefy form. Chooser, OAuth consent and any first-account onboarding must be verified on the actual release before enabling the Android account runner. The older website profile uses Envitefy email/password credentials. Neither profile clicks Continue in Envitefy on the native handoff page. Marketing login discovery remains separate coverage.

```powershell
# Run one supplied account after its variables and prerequisites are ready
node scripts/maestro-run.mjs --flow QA08

# Run a subset using supplied accounts
node scripts/maestro-run.mjs --flow QA02,QA03,QA05

# Explicit opt-in for disposable synthetic local accounts
node scripts/maestro-run.mjs --local-fixtures --flow QA01

# Inspect the browser while running
node scripts/maestro-run.mjs --flow 03 --headed

# Extend the per-flow bound (maximum 900000 ms)
node scripts/maestro-run.mjs --timeout-ms 360000

# Validate collector/process behavior without starting Envitefy
npm run test:maestro:runner
```

For local harness development, `node scripts/maestro-serve.mjs` leaves a synthetic environment running until Ctrl+C. Its printed directory can be passed by name with `--attach development-...`. Attach accepts only a marked suite environment beneath `qa-artifacts/maestro/`, validates a loopback origin and never shuts down the server owned by the serve process. Attached runs reuse modified fixtures; `--local-fixtures` creates a fresh disposable environment.

## Reports and bug collection

Each run writes `qa-artifacts/maestro/<run-id>/report.html`, `bugs.json` and `bugs.md`, plus one directory per account. Android runs include `android-device.json` after preflight passes. The account directory includes Maestro's JUnit XML, console log, nested step metadata, screenshots and independent `api-checks.json` results. It snapshots the selected platform's flow and shared helpers immediately before execution, recording their SHA-256 digest so later script edits do not change the reproduction evidence. The JSON records app commit, environment, platform, account alias, role, duration, failed step and evidence path. Duplicate failures are grouped within the run, retaining each affected account occurrence.

Findings start as `suspected_defect`, `incomplete_check`, or `environment_or_test_failure`, with `untriaged` severity. No automated failure is promoted to a confirmed app defect. Browser transport/flow timeouts remain incomplete checks; an HTTP/setup problem is distinct from an assertion. Completed results remain in the report when another account fails. The process exits nonzero for any failed or skipped selected flow.

`qa-artifacts/maestro/findings.json` accumulates unique findings across runs with first/last occurrence, affected accounts and commit references. Explicit review can classify a finding without creating an external issue:

```powershell
npm run maestro:triage -- F-<id> confirmed_defect high "Reproduced manually; expected and observed behavior verified."
```

Other review classifications include `test_script_problem`, `environment_failure`, and `incomplete_check`. Triaged classification, severity and notes survive subsequent occurrences.

Passwords are passed through the CLI's `MAESTRO_` environment mechanism, never command arguments or committed YAML. Maestro records evaluated variables and input commands, so the collector scrubs text artifacts before publishing reports. Runtime secrets remain private while an environment is running; completed default runs redact them. The entire artifact tree and downloaded tools are ignored by Git. Review screenshots before sharing outside the team.

## Provider and coverage boundaries

- The specialized business suite requires existing artwork and scan data. In local fixture mode the OpenAI-compatible boundary rejects generation. The separate live account-activity suite uses actual provider OCR and compares its saved facts against the source flyer; observed time/title mismatches are reported. Paid artwork generation and lettering quality are not certified.
- In local fixture mode, transactional mail is captured by the existing local campaign adapter. Supplied-environment runs use that environment's normal mail configuration and can produce signup/co-host notifications.
- Android coverage applies only to the inspected Play-installed build and selected device. Website mode is Chromium beta. Keep existing Playwright viewport, download-content and accessibility checks.
- Calendar controls do not prove a calendar provider accepted an event; external OAuth is not connected.
- Permission companions call the real server routes and include positive controls. They are separate from UI assertions.
- Local fixtures are synthetic. Supplied-environment runs use only the accounts and records named in the environment file. The collector does not create external issue tracker tickets.

Official references: [installation](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli), [web support](https://docs.maestro.dev/get-started/supported-platform/web-browser), [test artifacts](https://docs.maestro.dev/maestro-flows/workspace-management/test-reports-and-artifacts).

Latest live checkpoint: all eleven allowed accounts (QA01–QA10 and QA12) have distinct matching-owner Snap events and anonymous guest HTTP 200 checks. QA02–QA10 and QA12 also have observed reopening routes. QA01's explicit route audit remains incomplete: Google reports its maximum-account limit, and automatic approval review rejected signing out all Google web sessions without specific authorization. Its normal existing-account sign-in and event checks can resume from activity-QA01-1792191469442 after that decision; no further upload is needed. The google-sign-out-limit stage requires explicit owner authorization and --allow-google-web-signout. QA02/QA03 route checks use archived observations with explicit provenance. Every saved workshop repeats the five-hour time mismatch; QA05 also has the confirmed title mismatch. Original failed/incomplete attempts and explanations remain in the reports. QA11 is excluded. Camera capture is unavailable and unverified; only prepared file uploads are used. The specialized business feature flows remain separate drafts.

# Maestro account testing

This suite has twelve prepared account flows: QA01–QA12. The owner restored QA11 and then deferred its live run until later. Default selections use QA01–QA10 and QA12. QA11's profile remains available for explicit selection after the owner adds it; its live account activity has not started.

The requested target is the Google Play Android app `com.envitefy.app`. Twelve **Google tester** credential pairs have been supplied in ignored `.env.maestro.local`; these have not been verified as Envitefy password accounts. `MAESTRO_AUTH_PROVIDER=google` identifies them, and the runner refuses to submit these credentials to Envitefy's password endpoint. The twelve specialized business workflows remain Android drafts. The separate account-activity runner exercises Google signup, real file upload, publication, dashboard persistence and reopening on the inspected Play build; consult the activity index for each account's evidence. A desktop browser test does not verify the Play build.

The default command loads `.env.maestro.local`, or the same variables from the process environment in CI. It stops before app requests when required values are missing. Android preflight runs before any account login and rejects missing devices, missing packages, and packages not identified as Play installed.

An optional website fixture mode creates twelve synthetic non-admin accounts and a disposable PostgreSQL cluster. These are separate from the supplied accounts and do not verify the Play build.

## Revised closed-test plan — October 17, 2026

### Current activity priority — October 22

The owner clarified that the project’s primary goal is actual app use by all eleven eligible accounts at separate times during the day. The saved [activity plan](../output/maestro/closed-test/manual-20261022-1792673679293/activity-plan.json) and [activity ledger](../output/maestro/closed-test/manual-20261022-1792673679293/activity-ledger.json) preserve the October 22 morning, noon and 6 PM windows in America/Chicago. This authorization ended at local midnight; later days need their own dated plan.

October 23 schedule closure: the morning window retains 10/11 verified accounts and 23 actions; midday retains 11/11 and 42 actions. The evening window is marked missed, with zero ledger entries and no evening attempt in the 60 saved account sessions. Its account actions remain unverified; the reason no attempt was recorded is unknown. The expired `envitefy-11-account-activity-today` automation was deleted through the app. No October 23 app actions ran under this schedule. The [closure manifest](../output/maestro/closed-test/manual-20261022-1792673679293/schedule-closure.json) preserves original state, hashes, per-window outcomes and retirement evidence. No earlier activity was backfilled or backdated.

Each accessible profile signs in through the Play app, reads its existing workshop, resumes its private draft and inspects Preview where available, and reads another authorized QA account’s existing workshop. Count activity only after exact identity and successful Maestro UI evidence. Keep actual per-account timestamps, completed actions, event/owner IDs, source flow snapshots, stdout/JUnit, screenshots and diagnostics. Existing morning draft-reopen evidence is recorded with its original timestamps and provenance; anonymous HTTP checks are excluded from account activity counts.

October 22 activity milestone: all eleven eligible accounts completed the automated midday activity plan, with 42 verified actions and no missing action types. The [completion manifest](../output/maestro/closed-test/manual-20261022-1792673679293/midday-completion.json) records the final action at 18:29:02.941 UTC (1:29 PM America/Chicago). QA01 completed two workshop visits because it has no mapped draft; the other ten profiles completed four actions each. The morning window remains 10/11; QA01 first completed activity at 17:16 UTC, without backfilling its morning result. Its exact Envitefy owner `88f1bc38-4324-4908-87d2-7b5d89c12017`, owned workshop and QA12 workshop visit passed in `day5-QA01-1792689338708`. No replacement draft was created. The day's integrity audit verified 65 attributed actions and 92 successful flow snapshots/JUnit results; these totals preserve the actual separate windows and earlier failed attempts.

QA04's initial switch exited with `AndroidInstrumentationSetupFailure`; a fresh sequential session subsequently passed all four midday actions in `day5-QA04-1792691093573`. QA06's fresh SMS verification completed normally and its exact owner was verified. Its workshop-title wait expired after 60000ms behind the optional calendar-setup dialog; draft navigation then also failed. The flow now dismisses Not now before checking the title. QA06's guest-workshop visit passed in `day5-QA06-1792690892344`, and `--resume-incomplete` later verified only its three missing actions in `day5-QA06-1792693603240`, without another code or a repeated guest action. Original failures and calibration evidence remain preserved.

At 18:02 UTC the prior runner PID was absent, its command session was unavailable, and no QA emulator was connected. QA10's workshop flow had no completed result; its earlier launch, ordinary account switch and exact identity were preserved. `QA-RUNNER-LOSS-20261022-001` records this tool/access interruption without inferring its termination cause or time. The stale lock was archived only after confirming its PID was gone. The same saved primary AVD recovered with software graphics and retained data; Play package/installer/version/domain checks passed. QA10 then passed its owned workshop, exact draft reopening and Preview/return in `day5-QA10-1792692397263`. Its first guest attempt saved a blank loading surface and failed the later exact-identity check; that attempt remains unverified and uncounted (`ACTIVITY-GUEST-IDENTITY-QA10-20261022-001`). A later session, `day5-QA10-1792693501288`, verified the native guest view, expected route and exact QA10 identity before and after the visit. Both attempts remain preserved; the underlying cause of the earlier interruption is unconfirmed. No event records were created, saved or published during this recovery.

Latest midday checkpoint: complete for QA01–QA10 and QA12; QA11 remains deferred. QA07 and QA09 completed normal fresh SMS verification and all four midday actions in `day5-QA07-1792692943819` and `day5-QA09-1792693386870`. QA06 and QA10 subsequently completed their missing actions, preserving prior passes without double-counting them. No owner verification is pending. All codes have been consumed and must not be reused. The October 22 evening return was missed and the schedule is retired; do not repeat midday work or backfill evening activity. Separate Day 3 and Day 5 edit/save/publication verification remains unresolved.

QA01 uses the separate saved `Envitefy_QA01_Play` AVD (`emulator-5558`), official Android 14 Google Play image, and verified Play installation of Envitefy 1.0.3 (5). The primary device’s ten-account Google limit remains observed; all ten sessions were retained. Normal recovery-email verification completed. Chrome and Google Play services were updated through Play. Earlier graphics failures, two native emulator exits with Windows code `0xC0000005`, a 60000ms Google-return assertion timeout and three 15000ms CDP initialization timeouts remain preserved. After restarting the saved AVD and Chrome without clearing data, exact identity and actual app activity passed; the underlying causes of those interruptions remain unconfirmed. See `qa01-google-provider-error.json`, `qa01-emulator-recovery.json`, `qa01-oauth-continuation.json`, `qa01-cdp-recovery-observation.json` and `qa01-isolated-device.json`. `qa01-device-route.json` selects only this verified secondary installation. All other accounts use `emulator-5556`; both devices share the master UI lock and must never run UI flows concurrently.

The preserved runner is `node output/maestro/closed-test/manual-20261022-1792673679293/activity-run.mjs morning` (or `midday` / `evening`); its October 22 execution windows are now closed. Do not invoke it for a later date. An explicit alias list limits a resume. `--resume-incomplete` executes only missing action types for that account/window, retaining successful earlier actions and their original evidence. `--pause-on-mfa` leaves a verified owner challenge open for live code assistance. Unattended activity saves the exact account’s challenge and closes only that OAuth tab when safe so other accessible profiles continue. Do not request SMS codes repeatedly. A failed field edit or preview preserves earlier browsing activity and does not stop other independent cases.

Intentional editing, explicit saving and publication keep their existing source/identity/same-record checks and evidence. Reuse existing IDs. The activity runner browses existing records; the separate Day 5 Description/save/publication case remains unresolved. Preserve all original workshops, drafts and confirmed defects. Automated sessions do not establish human feedback, continuous Play participation or an observed Play Console engagement metric. Keep the computer and desktop app running for local scheduled work ([official scheduling documentation](https://learn.chatgpt.com/docs/automations)).

The plan has two workstreams: human closed testing with enrollment evidence, and Maestro engineering checks. Continue useful engineering QA with the eleven existing app accounts while QA11 is deferred. A tester's human participation, Play enrollment, installation and app activity each need their own evidence.

For personal developer accounts created after November 13, 2023, Google's production-access rule is at least twelve testers continuously opted in to a closed test for the preceding fourteen days. Our suggested session tasks and durations are our test design. [Official requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).

### Current evidence and open checks

- Two emulators have verified Google Play installations of `com.envitefy.app`: the primary shared test device and QA01’s separate Android 14 device. This does not establish eleven individual device installations. Eleven separate Envitefy accounts created public test workshops with matching owners and anonymous guest checks. Ten explicit reopening routes are verified; QA01's additional route audit is incomplete.
- On October 17, all eleven eligible Google accounts showed “You are a tester” at the supplied Play opt-in page. Dated account screenshots and the enrollment summary are under `output/maestro/play-enrollment-20261017/`. Continuous opt-in duration, human participation and current production eligibility remain unverified. Confirm the release track and aggregate progress in Play Console.
- Twelve credential pairs are configured. The number of participating humans is unverified; credentials and emulator sessions do not establish that number.
- The September 19 closed-track draft report is historical. Verify today's release availability, countries, tester access and track before using it as the baseline.
- The last recorded defects are a five-hour saved-time shift on eleven workshops and the altered QA05 title. Reproduce them on the current app, verify fixes, and preserve the original evidence. Native selector timeouts and Google's account limit remain separate tool/access observations.
- Camera capture stays out of this round. Use Upload file. The specialized business flows remain Android drafts until calibrated on the Play-installed release.

### Preparation and enrollment

1. Confirm the developer account type and the applicable Play Console requirements. Complete any outstanding developer/device verification and verify the intended closed track is available. Use the current Console state rather than the dated draft report.
2. Confirm actual human participants. Each participant uses their own Google account to join the closed test and install the offered build through Google Play. Record their separate Envitefy identity for reproducing issues; share no Google passwords. Device variety is our coverage recommendation.
3. Maintain a private enrollment register with a participant reference, closed-track confirmation, dated opt-in evidence, Google Play installation evidence, device/Android/app version, and any opt-out/rejoin reports. Obtain participant confirmations and check the Console's aggregate test progress; do not assume it exposes an individual enrollment timestamp.
4. Keep QA11 deferred until the owner adds it. With eleven verified participants, continue useful testing while adding the twelfth or another eligible participant. A small buffer above twelve is recommended for dropouts.
5. Establish the qualifying cohort from actual enrollment evidence. For a selected twelve, the latest continuous opt-in start plus fourteen days is a planning estimate; verify eligibility in Play Console before applying. Earlier participants stay opted in through the application. Update the estimate after an opt-out or replacement. The current start and end dates are unknown.

The private register and templates are under `output/maestro/closed-test/`. Unassigned slots and unknown dates are placeholders, not claims of enrollment. Its initial start dates remain null. The existing opt-in link is `https://play.google.com/apps/testing/com.envitefy.app`; confirm closed-track availability before recruitment.

### Human testing journey

Use one clearly named test event as the main thread. Pair hosts and guests, with some pairs using Live Cards, some Event Pages, and some Sign-up Forms. Rotate roles during the second week. Participants can keep their usual account signed in and return for an event-related purpose. The following are suggested focus days, not a required daily-open quota. Record actual sessions and allow ordinary gaps between them.

| Day | Participant focus | Evidence or feedback |
| --- | --- | --- |
| 1 | Confirm opt-in and Play installation; sign in and explore. | Enrollment evidence; device/build; onboarding confusion. |
| 2 | Upload a flyer and compare extracted facts with the original. | Exact title/date/time/location comparison; prioritize the recorded time/title defects. |
| 3 | Edit details, explicitly save, close and reopen. | Same event ID; persisted changes; any lost work. |
| 4 | Finish a draft and review its guest preview. | Clear wording, readable layout and required-field guidance. |
| 5 | Publish the test event and share with a participating guest. | Public link; anonymous guest access; sharing clarity. |
| 6 | Open a partner's event and RSVP. Try an enabled location or calendar action. | Guest experience; correct calendar date/time; external-app result when actually observed. |
| 7 | As host, review responses and save a logistics update. | Response accuracy; updated information on the same public link. |
| 8 | Return to the saved event after a break and find it again. | Discoverability, persistence and any unexpected sign-in requirement. |
| 9 | Selected pairs use a Sign-up Form as host and participant. | Slot reservation, capacity, confirmation and host participant list. |
| 10 | Change an RSVP or cancel a test reservation. Selected co-host pairs check access. | Updated counts, cancellation audit and relevant permissions. |
| 11 | Background/reopen the app and try a brief network interruption. | Recovery behavior, clear failures and retained edits. |
| 12 | Install an available test update and retest actual fixes. | Version or deployment reference, original bug ID and before/after result. |
| 13 | Repeat the participant's main journey without detailed instructions. | Remaining confusion; reproduction of unresolved issues. |
| 14 | Complete a final walkthrough and feedback summary. | What worked, what blocked completion and whether planning an event needed help. |

A short focused visit can take about three to ten minutes; task complexity determines the time. An optional feature need not be exercised by every participant. Cover each important feature across the cohort and record which paths were actually tried.

### Maestro and engineering work

- Preserve the eleven existing workshops as reproductions. Resume by run ID and event ID. Check identity/history before any new upload; create another event only for a deliberate new case. Repeated daily creation is unnecessary for this plan.
- Calibrate one representative host-to-guest journey first: Upload, fact review, explicit edits/save, reopen, public link and RSVP. After a fix, run the affected regression and broaden to the relevant account roles when evidence supports it.
- Reproduce and address the last recorded time/title mismatches before treating those facts as reliable. Retest source text, saved fields, the guest page and actual calendar output where available. A local patch or passing UI command alone does not verify a deployed fix.
- Use the prepared specialist flows for staged coverage of Live Card editing, Event Pages, Sign-up Forms, co-host permissions and account isolation. Mark each as prepared, calibrated, executed or verified according to its evidence.
- Keep automated screenshots, console/JUnit output, Android errors and observed browser/API results linked to the exact run and event. Label sessions as automated. Human feedback is recorded from participant reports.
- The current emulator's Google account-limit prompt affects its account switching. Broad Google web-session sign-out still needs the pending explicit authorization. Human testing on participants' own sessions can proceed independently; no Chrome reset, account removal or MFA bypass is part of this plan.

### Review, logs and completion

Review enrollment/Console progress and incoming feedback regularly throughout the window. For each actual session, record the participant or QA alias, human/automated source, timestamp, device/Android/app version, scenario, event ID, expected and observed result, and evidence references. Empty templates are not completed sessions.

Triage feedback as a confirmed defect, usability feedback, incomplete verification, tool/access failure or missing authorization. Give defects a stable ID, severity, reproduction steps, cause status, fix/build reference and retest evidence. A screenshot alone does not establish a root cause. Preserve successful checks when another check fails.

Use private Play feedback or the established Envitefy contact channel after confirming it reaches the team; retain feedback in the private tracker. Contact participants only through an owner-authorized channel. Do not commit private Google emails, credentials or participant details.

Complete the technical review when core host/guest journeys have supporting evidence and release-blocking failures have been resolved and retested. Disclose remaining feature gaps. Separately, verify the qualifying closed-test milestone in Play Console. Prepare the production-access answers from actual engagement, feedback and shipped changes. Submission and approval remain separate steps. No eligibility date or approval is claimed by this plan.

## Running Days 1–4

Prepare the eleven existing accounts with `npm run maestro:days`. This reads their saved upload evidence and writes private task manifests to `output/maestro/closed-test/days-1-3/`; it performs no app actions. QA11 is rejected while deferred. Human enrollment, opt-in dates and feedback remain separate from automated sessions.

Run a pilot with `npm run maestro:days -- --execute --accounts QA12 --days 1,2,3`. Day 1 uses normal existing-account Google login if needed, verifies Profile identity and explores the dashboard. Day 2 reuses the existing uploaded event, compares its source facts with a fresh owner read and checks original-document access; it does not generate duplicate events. Day 3 preserves a baseline, opens the actual editor, appends a clearly named test description marker only when Description/Save controls are present, saves explicitly, closes and reopens the same event, then verifies persisted text, identity, public link and preserved title/dates. If the deployed editor lacks those controls, save verification remains incomplete and its observed controls are saved for inspection.

Each execution has a private HTML report, `session.json`, timestamped journal, source flow, Maestro console/JUnit/screenshots and bounded Android errors. Browser diagnostics only observe requests and read session/event fields. They never create or edit app records. Resume with the command stored in `session.json`, optionally selecting only the unfinished day. Passing Save evidence is required before a resumed run can claim persistence; an unexplained existing marker stops another write.

Account switching is deliberately explicit: a session belonging to another Envitefy account stops that account's run. Sign in normally to the intended existing account, then resume. This runner never provisions users, accepts signup consent, signs out all Google sessions, captures camera media or invents human feedback. Do not mark three calendar days elapsed merely because these three engineering stages run in one session.

Day 4 is selected explicitly with `node scripts/maestro-days.mjs --execute --accounts QA12 --days 4 --resume <saved-run-id>`. It checks healthy owner history before opening the coffee-conversation Event Page template, reuses a matching private Day 4 draft, enters approved test wording through Maestro, chooses Save draft, reopens the same draft and inspects Preview. Read-only diagnostics verify the saved owner/status/wording and anonymous access denial. It does not publish or send invitations. Required-field publication validation remains unverified when it cannot be exercised without publication; record visible guidance separately. A Day 3 blocker does not prevent this independent Day 4 run.

For an authorized cohort run, `--switch-account` permits ordinary Envitefy logout followed by Login and selection of an existing Google session. The runner verifies the resulting Envitefy email before event actions. It does not add a Google account, sign out Google's other sessions, accept signup consent or bypass verification. An unavailable account or verification challenge stops that account's actions and retains its evidence. Run one UI helper at a time. The sign-in helper is copied with the main flow and digested in each switch attempt.

October 17 implementation checkpoint: all eleven non-deferred accounts have task manifests and human checklists. QA12 passed Day 1 sign-in/Profile/dashboard checks and its first Day 2 upload review; the saved event still shifts both times by five hours. A subsequent read-only comparison verified its title, timezone, online location and URL. A later UI retry showed Android's “Chrome isn't responding” dialog and remains an environment interruption, with the earlier passing evidence retained. Day 3 could not find an Edit entry on the owned scanned-event page after dismissing calendar setup; no event edit occurred and save/reopen verification remains incomplete. The other ten accounts' new Day 1–3 executions remain unperformed. Native hierarchy omission and the DevTools hierarchy workaround are recorded with the pilot attempts; the new flows use Maestro's [documented WebView mode](https://docs.maestro.dev/extra-materials/troubleshooting/known-issues).

October 20 manual Day 3–4 checkpoint: the owner authorized actual October 20 runs after the earlier schedule expired. The saved `Envitefy_Maestro_Play` AVD recovered using software graphics with Vulkan disabled, retaining its data and the Play installation of `com.envitefy.app` 1.0.3 (5). Day 4 save/reopen/wording/private-preview checks passed for QA02, QA03, QA04, QA05, QA06, QA07, QA08, QA09, QA10, QA12. Day 4 remains incomplete for QA01; the exact access blockers and resume commands are in `resume.json`. Day 3 remains unverified: QA02, QA03, QA04, QA05, QA06, QA07, QA08, QA09, QA10, QA12 exposed no Edit entry on the inspected owned scanned events, so no Day 3 save/reopen pass is claimed. Chrome not-responding prompts and QA07’s workspace JSON/HTTP 500 error were retained; restarting Chrome preserved QA07’s session and allowed its existing draft to pass. The anonymous draft route withheld private wording but falsely described saved drafts as deleted (`DRAFT-GUEST-DELETED-NOTICE-001`). Required-field publication validation remains unverified. Private timestamped account results, source flow snapshots, stdout/JUnit, screenshots, diagnostics, expected/actual values, findings and resume instructions are under `output/maestro/closed-test/manual-1792504641939/`; authentication-step copies are indexed by `auth-index.json` and the account index is `output/maestro/closed-test/days-1-3/index.html`. QA11 remains deferred. The expired automation is paused. Original workshops, flyers, confirmed time/title mismatches and earlier passes remain preserved.

## Scheduled Day 4 follow-up and Day 5 — October 20–21, 2026

The owner authorized both scheduled runs in this chat: **Tuesday October 20 at 6:00 PM America/Chicago** (23:00 UTC) for the Day 4 follow-up, then **Wednesday October 21 at 10:00 AM America/Chicago** (15:00 UTC) for Day 5. These are two dated sessions. Check the actual time before app actions, keep early wakeups pending, and never backdate a delayed session. A session may run only on its assigned date after its start time. Retire each schedule after its due session or date cutoff; do not catch up a missed Day 4 session by calling it an October 20 run on October 21.

Scheduling observation: the October 20 wakeup at 18:00 UTC was 1:00 PM America/Chicago, so no app actions ran. The scheduler used UTC hours. Both bounded, single-occurrence schedules were corrected to the requested 23:00 UTC October 20 and 15:00 UTC October 21 starts. The observation and verified saved correction are in `output/maestro/closed-test/scheduled-20261020-21/early-wakeup-20261020T180006Z.json` and `schedule-correction-20261020.json`; the local times above remain unchanged.

Use `output/maestro/closed-test/manual-1792504641939/summary.json` and `resume.json` as the starting evidence. Ten accounts (QA02–QA10 and QA12) already passed the recorded Day 4 draft save/reopen/wording/preview/privacy checks. Tonight is a follow-up, not another elapsed test day. QA01 remains blocked by Google's browser account limit; include it only after the owner supplies access that preserves the other Google sessions. QA11 remains deferred. Day 3's missing Edit entry remains an independent incomplete verification.

### Day 4 follow-up — Tuesday, 6:00 PM

1. Verify the dedicated `Envitefy_Maestro_Play` AVD, `emulator-5556`, Play installer, package/version and exact Envitefy identity. Start the saved AVD if necessary without wiping data; use the documented software graphics option if needed. Reserve one UI runner. Inspect and record any Chrome ANR or driver-startup failure before recovery.
2. Begin with QA12. Reuse its existing private Day 4 draft by event ID, owner and title, then broaden to QA02–QA10 after calibration. Read healthy owner history before any write. Preserve the earlier successful evidence and every original workshop/flyer; do not create replacement drafts when an existing ID is missing or ambiguous.
3. Finish publication readiness through the actual editor. Keep the existing clearly named QA title and approved private-draft note. Use the account's original flyer as the factual source: October 30, 2026, 1–2 PM America/Chicago, Online, and that flyer's account-specific test URL. Record existing versus intended values first. Enter only facts supported by that source and supported editor controls; an unsupported online/location/timezone entry becomes a specific blocker rather than an invented address or time. Save explicitly and reopen the same draft to compare the saved facts, title and note.
4. Review the title, approved note, logistics and layout in the available Preview, including scrolling and return to editing. Record whether owner editing controls remain; this authenticated builder preview alone does not establish a clean public guest view. Check visible required-field guidance without activating Publish. Validation exposed only by publication stays deferred to Day 5.
5. Verify the draft is still private and that anonymous responses expose none of its private wording. Recheck the known false deletion notice on the pilot, retaining `DRAFT-GUEST-DELETED-NOTICE-001` and its earlier occurrences; a repeated message is another occurrence, not a new defect ID. Do not publish, send invitations, create new users or capture camera media tonight.
6. Save `output/maestro/closed-test/scheduled-20261020-21/day-4-readiness.json` with each existing draft ID, owner ID, title, expected source facts, observed saved facts, actual save/reopen evidence and unresolved blockers. Readiness for Day 5 requires the same owned draft, explicit save/reopen, matching approved facts and available publication controls. An unresolved Day 3 editor blocker does not automatically prevent this independent draft case.

### Day 5 — Wednesday, 10:00 AM

1. Read tonight's `day-4-readiness.json`. If Day 4 was missed, record that fact and perform prerequisite checks at the actual Day 5 timestamp before publication; never fabricate the earlier session. Reverify device, installer, identity, current draft status and source facts.
2. The current `scripts/maestro-days.mjs` accepts Days 1–4 only. Implement and calibrate the minimal Day 5 Maestro flow and resumable collector before using it; do not invoke an unsupported `--days 5` or reuse a Snap flow that creates another event. Limit implementation edits to QA flows, runners, relevant checks and documentation. Do not deploy product changes.
3. Pilot QA12 first. Reuse its Day 4 draft, keep its QA title and replace the private-only note with `Envitefy QA12 test event for closed testing. Test participants only.` Use the corresponding alias for each later account. Save explicitly, confirm the approved logistics, then inspect publication validation. Correct only source-supported facts through the UI. Unresolved required fields or source mismatches stop that account's publication.
4. Publish each eligible existing draft exactly once through the Play app. Before clicking, persist its pending publication checkpoint in `day-5-publication.json` with event/owner IDs and current status. If publication was already verified, resume link/guest checks without publishing again. If the click result times out or is uncertain, inspect that same record and public link before any retry; unknown status must not trigger another event creation or blind publication. Preserve published test events as evidence. Publication making a page available does not establish that the earlier private-draft deletion-message defect was fixed.
5. Check the same public link with a separate unauthenticated read, comparing title, date, event-local times, location and website to the approved source. Check the owner can find the same event again through the current My Events sidebar. Exercise Copy guest link and the Android share sheet when available, then dismiss sharing without sending. Verify the actual copied value only if observable; a button acknowledgement alone leaves clipboard contents unverified.
6. Inspect the public page through Maestro as another authorized QA account: pilot QA12 host → QA02 guest, followed by QA02 → QA03 → QA04 → QA05 → QA06 → QA07 → QA08 → QA09 → QA10 → QA12. Verify the guest is not the owner and cannot see owner editing controls. These are automated host/guest role checks, not human feedback. Do not submit RSVPs, send email/SMS/social messages or choose a real recipient; those interactions remain for an explicitly authorized later case.
7. Broaden only after the pilot's publication and guest checks are calibrated. A failed account must retain any successful save or publication checks and its exact resume point; independent eligible accounts may continue. Preserve the original eleven workshop time/title defect reproductions unchanged.

### Evidence and operation for both sessions

Save actual timestamps, account aliases, device/build/installer evidence, source flow snapshots/digests, stdout/JUnit, screenshots, Android/browser diagnostics, expected versus observed values, stable finding IDs, cause certainty and resume instructions under `output/maestro/closed-test/scheduled-20261020-21/`. Add new dated attempts to the testing index while preserving the morning report. Separate confirmed app defects, incomplete verification, tool/access failures and missing authorization. A scheduled wakeup, account login or repeated task does not establish human participation, feedback or fourteen-day Play continuity.

Keep the computer on and the desktop app running for local scheduled work ([official scheduling documentation](https://learn.chatgpt.com/docs/automations)). An unavailable emulator/tool or MFA challenge requires an exact account-specific failure/owner action, not a claimed app pass. Do not sign out all Google sessions, remove accounts, bypass MFA, clear app/Chrome data, accept new signup consent or edit app records through APIs/databases. Existing-account login and ordinary switching remain authorized. Notify this chat on completion, a material failure or required owner action; duplicate/no-op wakeups stay quiet. Stop both dated schedules after their assigned sessions; no later testing is authorized by them.

## Real account activity and resumable logs

The requested outcome is actual Android account activity: use Snap/Upload, create and publish clearly named test events, then revisit them. The user authorized publication. UI actions run on the Play-installed app; records are not seeded or activity timestamps fabricated.

`scripts/maestro-activity.mjs` runs a selected `.maestro/android/activity/` stage. It loads the selected account's variables, rejects unknown or disabled accounts, checks the Play installer/version and preserves every attempt under `output/maestro/activity-<account>-<timestamp>/`. `state.json` and `journal.jsonl` retain checkpoints. Each attempt saves its source flow and digest, console output as it arrives, JUnit, screenshots, Maestro commands/hierarchy and Android logs. `activity-summary.html` separates passed UI steps, failed/incomplete attempts and findings confirmed by evidence review. Resume only at the stage matching the current UI; inspect existing records before repeating an upload or publication.

The user explicitly authorized creating QA02–QA10 and QA12, accepting required signup consent, and running Snap/create/publish tests. `switch-google-signup` and `resume-signup` require `--provision-test-account`. Google phone/MFA challenges still require normal completion by the account owner. Google setup evidence is saved separately under `output/maestro/google-setup-<step>-<timestamp>/` with the selected alias in `status.json`.

For an existing verified account, `switch-google-login` uses Login and Sign in with Google, selecting its existing Google session. It does not accept signup consent. Reuse the original activity run, inspect any Google consent screen, then run Profile, dashboard persistence, reopening and the read-only verifier. A reopening audit reuses the saved event and does not require another Upload step.

When Google requests a six-digit SMS code, supply the owner's current code through the process-only `MAESTRO_VERIFICATION_CODE` variable and run `node scripts/maestro-google-setup.mjs chrome-code --account <alias>`. The helper checks Google's host and the selected email before entry, redacts the code from textual artifacts, and records submission separately from sign-in success. Clear the process variable afterward. Inspect the resulting screen before continuing consent or app tests.

The activity and Google setup helpers reserve an exclusive device lock under `output/maestro/android-ui-<serial>.lock`; a second helper stops before driving the UI. Wait for a helper's process to finish before starting another Maestro run or an external `uiautomator dump`. If a killed process leaves a lock, inspect the owning process and its logs before removing that exact lock file. Do not clear Chrome data or remove Google accounts as a recovery shortcut. Signup recovery returns through the existing UI; relaunching the Android task can restore an old OAuth tab or Settings screen.

Camera capture is unavailable for this testing by the owner's explicit instruction. Use Upload file and the prepared account PNGs; do not capture camera images or count camera behavior as verified. `output/maestro/camera-testing-unavailable.json` and the activity index record this limitation. Decline an Android camera permission prompt before choosing Files. QA06's interrupted upload retained its unexpected camera screenshot and Android's Chrome exit record (`PERMISSION CHANGE`, one-time permission revoked); that incomplete attempt does not establish an Envitefy camera defect. The file selection now uses a single tap.

Before `enter-snap` or `scan-upload`, a read-only Chrome companion check verifies the active Envitefy email against the selected alias and checks for an existing matching test event. A mismatch, unavailable check, degraded history or existing test event stops the upload. This companion check does not create records. Every completed activity attempt also saves a bounded `android-errors.log` snapshot and its capture status; those Android errors may include earlier attempts. `node scripts/maestro-activity-status.mjs` writes `output/maestro/activity-index.html` and `.json` for all twelve configured accounts, distinguishing verified created/public events from unfinished setup. `confirmed-issues.html` and `.json` group repeated observed mismatches across accounts while retaining each occurrence and its cause uncertainty. After the My Events reopen stage, run `node scripts/maestro-activity-verify.mjs <activity-run-id>` for read-only owner/date/current-route/anonymous guest checks, then `node scripts/maestro-activity-finalize.mjs <activity-run-id>` to save the verified checkpoint and linked setup evidence.

Each `addMedia` stage imports the unchanged source flyer under a unique `snap-input-<account>-<attempt timestamp>.png` filename. The run saves `snapMediaFilename`, and subsequent picker/scan stages select that exact escaped filename. This avoids Android's duplicate-name suffixes when resuming an import. The original `snap-input.png` remains the comparison source. `restore-app` relaunches the installed Play launcher without uploading; inspect saved history before resubmitting anything after a browser interruption.

The first live pilot is `activity-QA01-1792191469442`. Real OCR and attachment upload returned HTTP 200, event creation returned HTTP 201, and the saved event appeared on QA01's dashboard. The [test workshop guest page](https://envitefy.com/event/envitefy-qa01-test-workshop) returned HTTP 200 without authentication. Its saved owner matches QA01. QA02 subsequently completed normal Google signup, matching Profile/session checks, a distinct real Snap upload, anonymous public guest access, dashboard persistence and My Events reopening in `activity-QA02-1792193135800`. Its workshop is `https://envitefy.com/event/envitefy-qa02-test-workshop`. See `output/maestro/activity-index.html` for current progress across all twelve configured accounts.

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

If automatic graphics leaves this saved AVD offline, gracefully stop that instance before restarting with the optional `-SoftwareGraphics` switch. It uses `-gpu software -feature -Vulkan` and retains the AVD's data. This is an [Android-documented graphics troubleshooting option](https://developer.android.com/studio/run/emulator-troubleshooting). On October 20 the automatic retry did not finish booting within 180 seconds; the software/Vulkan-disabled retry completed boot in approximately 105 seconds and retained the Play app and QA02 session. This successful recovery does not establish the cause of the earlier device disappearance. Foreground and background launches now share one argument array. PowerShell syntax validation passed; the updated foreground wrapper has not been rerun while this AVD is active. Leave the launcher terminal running during testing when using `-Wait`.

During setup this dedicated device needed a 540×1200 display override at 210 dpi and disabled Android transition animations after System UI/Pixel Launcher stalls. This preserves its approximate logical viewport while reducing software rendering load. It is not full-resolution visual verification. Google setup skips the optional Sign in with ease phone-number discovery and uses the explicit email form.

In this PowerShell environment, call `node scripts/maestro-run.mjs --flow QA01` directly when passing flags. The `npm.ps1` shim consumed the `--` separator during verification. `npm.cmd run test:maestro -- --flow QA01` also preserves arguments on Windows.

The supplied [tester opt-in page](https://play.google.com/apps/testing/com.envitefy.app) enrolls the Google account in the Android test. Install using the [Google Play listing](https://play.google.com/store/apps/details?id=com.envitefy.app). Google Play account enrollment/sign-in is separate from Envitefy login. The Google setup command is `node scripts/maestro-google-setup.mjs email`; it defaults to QA01 and stops after submitting the email at the password screen. A separately inspected password step can be run with `password`. `--account QA02` selects another allowed tester explicitly; QA11 is enabled again; setup still validates the selected alias before loading credentials. MFA, recovery or verification requirements must be completed normally.

On October 16, QA01 completed Google's SMS verification and signed into Google Play. Play displayed **Envitefy (Early Access)** with installation available, then **You've got early access to this app**. The installed package is `com.envitefy.app` version **1.0.3**, version code **5**, installer `com.android.vending`, Android API **36**, with `envitefy.com` app links verified. Chrome setup completed with optional history/tab sync and device backup declined. The app's landing page and Google account chooser opened on the emulator.

QA01's first Envitefy Google login returned **Access Denied — You do not have permission to sign in**. The repository's sign-in callback rejects a new Google user without signup-source and legal-acceptance cookies, and it also rejects callback exceptions. The live response alone did not identify which case occurred. After the user explicitly requested account creation, normal Google signup completed and the Play app displayed **Welcome, Envitefy**, the **Envitefy App** account, and QA01's matching email in Profile. No product defect is established by the earlier login denial. That checkpoint covered QA01 signup only; it did not verify the specialized business workflows. Current account activity is tracked in the activity index. See the ignored `qa-artifacts/maestro/android-device/status.json` for separate setup and check results.

`node scripts/maestro-google-setup.mjs smoke` passed the Play app launch, landing menu and sign-in form in **20 seconds**, without logging in or creating an account. `node scripts/maestro-google-setup.mjs session --account QA01` passed the signed-in dashboard and matching Profile email check in **1 minute 3 seconds**, without modifying that profile or initiating another login. These are two passing setup/session checks, not eleven passing account workflows.

The prepared `signup` step accepts the age/Terms/Privacy checkbox and may create an Envitefy account. It requires explicit account-owner authorization and the additional `--provision-test-account` flag. QA01's first automated attempt timed out after **60 seconds** waiting for the Google account chooser. The retry selected the checkbox but failed its checked-state assertion. Normal UI continuation then completed signup. That original signup helper is not a passing automated provisioning check. The activity runner's separate switch-google-signup and resume-signup flows retain their own exercised evidence. QA11 is now restored; the original exclusion applied only to that earlier checkpoint.

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

The committed template is `.maestro/accounts.env.example`. `MAESTRO_PLATFORM=android`, `MAESTRO_BASE_URL=https://envitefy.com`, `MAESTRO_ANDROID_APP_ID=com.envitefy.app` and `MAESTRO_ANDROID_SERIAL=emulator-5556` select the requested device and app. Provide email/password variables for QA01–QA12. Quote passwords containing spaces or `#` using dotenv syntax. Process environment values override the file. Use `--env-file <path>` for a separate file. `MAESTRO_PLATFORM=web` explicitly selects the older browser suite.

Provide the existing event IDs and expected labels in the same file. The template documents each prerequisite: draft/published Live Cards, an owned scan, separate signup forms, pending co-host invitations and a full waitlist slot. QA02 owns the QA09 card; QA06 owns the QA07, QA08 and QA10 forms. QA12 is unrelated to those owners and points at QA05's private event. Each co-host account must have exactly one pending invitation. Use dedicated records: these flows publish a draft, edit wording/titles, reserve/cancel slots, promote a waitlisted participant and revoke the QA09 co-host. Subsequent reruns require restoring those preconditions. The configuration check validates variables and formats without logging in; it does not prove credentials or records exist.

Optional local fixture mode uses loopback ports 3217 (proxy), 3218 (Next), 55447 (PostgreSQL), 4327 (local storage) and 4328 (disabled AI boundary). Occupied ports fail setup. It uses Next's existing per-port development-server wrapper and warms initial compilation through authenticated HTTP requests.

Installation coverage: the saved device evidence confirms one Google Play installation of `com.envitefy.app` 1.0.3 (5) on `emulator-5556`, used by eleven Envitefy app accounts. On October 17, the owner requested opening the tester opt-in link as each of those eleven accounts (QA01–QA10 and QA12). Each account's Google Play identity and **You are a tester.** confirmation were verified. QA03, QA04 and QA06–QA10 were newly enrolled; QA01, QA02, QA05 and QA12 were already enrolled. Account-specific screenshots, page snapshots, action logs and `summary.json` are saved under ignored `output/maestro/play-enrollment-20261017/`. QA01 used a separate incognito Google session after Android rejected creation of a browser context through DevTools; the ten regular Google sessions were retained. QA11 was outside this eleven-account enrollment request. These confirmations establish individual tester enrollment; individual installation attribution and continuous opt-in duration remain unverified.

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
| QA11 | `11-dashboard-calendar.yaml` | Prepared and deferred by owner; requires an owned published Live Card; Android calibration pending |
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

October 20 morning checkpoint: QA01–QA10 and QA12 retain their eleven owner-matched public test workshops and October 17 tester opt-in confirmations. The October 20 morning Day 4 draft save/reopen/wording/preview/privacy result is 10/11 verified; Day 3 edit/save/reopen remains unverified. See the dated checkpoint above and the private report for account-specific blockers. QA11 remains deferred. The earlier five-hour time mismatches and QA05 title mismatch remain preserved. Camera capture, human participation, feedback and fourteen-day Play continuity remain unverified.

<!-- envitefy-day4-20261020:start -->

## October 20 evening follow-up evidence

Actual automated follow-up began 2026-10-20T23:02:30.532Z and ended 2026-10-20T23:56:34.844Z. 7 existing private drafts (QA02, QA03, QA04, QA05, QA08, QA10, QA12) saved and reopened the source-backed October 30 date, 1–2 PM America/Chicago, Online venue and account-specific URL. The URL uses the supported Page sections custom information section headed Online event; its section ID, raw value, comparison value and observed Preview are in the readiness manifest. No Custom URL rename or publication occurred. The available Preview retains owner controls; it does not establish a clean public guest view. Publication-only required-field validation remains unverified.

QA06, QA07 and QA09 encountered Google Verify it’s you challenges offering SMS to the recovery phone ending in 39. No code was requested during this unattended run; their earlier morning checks remain preserved and the evening draft actions are unverified. QA01 remains blocked by Google’s browser account limit, and QA11 is deferred. The known false private-draft deletion notice remains DRAFT-GUEST-DELETED-NOTICE-001. Day 3 save/reopen remains unverified; original scanned workshops, time/title findings and flyers are preserved.

The private [testing index](../output/maestro/closed-test/scheduled-20261020-21/index.html), [readiness manifest](../output/maestro/closed-test/scheduled-20261020-21/day-4-readiness.json) and [resume instructions](../output/maestro/closed-test/scheduled-20261020-21/resume.json) contain exact account/event/owner IDs, before/after values, source digests, flow snapshots, stdout/JUnit, screenshots, diagnostics and blockers. Day 5 must reverify the same records, replace the private-only note with its approved test-participants wording, explicitly save, exercise publication validation and guard one publication per source-verified existing ID. Source URLs are displayed as information text; clickability and the anonymous published guest experience remain unverified. Human participation, feedback and continuous Play enrollment are not established by this automation.

The completed Day 4 schedule was deleted after this due session. Day 5 remains active for October 21 at 10:00 AM America/Chicago.

## October 21 Day 5 startup checkpoint

The due Day 5 session checked the clock after 10 AM America/Chicago and verified `emulator-5556`, the saved `Envitefy_Maestro_Play` AVD and Google Play-installed `com.envitefy.app` 1.0.3 (5). QA12 could not establish its current Envitefy identity because Chrome diagnostics failed and Maestro could not reach the app navigation. The final startup runner exceeded 150 seconds after its navigation assertion failed. No Day 5 event save, publication click, invitation or RSVP ran. Current server publication status, source comparisons, copy/share and guest-role checks remain unverified.

The preserved pre-reboot Chrome crash contains a `getRoleHoldersAsUser` SecurityException involving Google Play services. Google Play also displayed a no-internet message while Android reported a validated connection and DNS resolution worked. Chrome restart, Android reboot, Play listing retry and a cold start of the same saved AVD with software graphics did not restore verified access. The final crash buffer additionally contains a Play Store SIGABRT; its relationship to the blank Chrome screen is unknown. These are tool/access failures, not confirmed Envitefy defects. No account/app data was cleared or Google session removed, and no browser update was installed.

Minimal Day 5 note/save/reopen, publication checkpoint and guest-role collectors were prepared under the dated evidence folder. Date, wrong-owner, replacement-ID, shifted-time and duplicate-publication guard checks passed; app selectors and owner sidebar/copy/share behavior still require calibration. All ten original flyer digests match. Day 4 passes and original time/title/private-draft findings are preserved. QA06/QA07/QA09's previous MFA challenges were not rechecked; no new code was requested. QA01 retains its prior account-limit blocker, and QA11 remains deferred.

The [Day 5 report](../output/maestro/closed-test/scheduled-20261020-21/day-5-report.html), [summary](../output/maestro/closed-test/scheduled-20261020-21/day-5-summary.json) and [resume checkpoint](../output/maestro/closed-test/scheduled-20261020-21/day-5-resume.json) retain exact existing event/owner IDs, logs, JUnit, screenshots, flow digests and remaining checks. Restore Envitefy loading and Chrome diagnostics on the existing AVD while preserving its data, then reverify QA12 before saving or publishing. The one-time Day 5 automation was deleted after this interrupted session; a later date requires a newly authorized dated session. Automated activity does not establish human participation or Play continuity.
<!-- envitefy-day4-20261020:end -->

<!-- envitefy-manual-20261022:start -->

## October 22 manual continuation

The owner authorized testing QA01–QA10 and QA12 on October 22; QA11 remains deferred. This manual run retains actual October 22 timestamps, separate from the retired October 20–21 schedules. The current [testing index](../output/maestro/closed-test/manual-20261022-1792673679293/index.html), [activity state](../output/maestro/closed-test/manual-20261022-1792673679293/activity-summary.json), [observations](../output/maestro/closed-test/manual-20261022-1792673679293/observations.json) and [owner checkpoint](../output/maestro/closed-test/manual-20261022-1792673679293/owner-actions.json) preserve source snapshots/digests, stdout/JUnit, screenshots, expected/observed values, Android/browser diagnostics and earlier passes. The dated activity schedule is closed with a missed evening window; the separate engineering checks remain open.

The saved AVD and Play installation of `com.envitefy.app` 1.0.3 (5) were preserved. Play connectivity recovered after a network refresh, and Chrome updated through Google Play from 134.0.6998.135 to 156.0.8078.47. Subsequent native Chrome and Android system not-responding dialogs remain tool/access evidence; their relationship to Envitefy is unconfirmed. No app/browser data or Google account was removed.

At this checkpoint, exact Envitefy identities, healthy owner history, matching saved draft source facts and native Drafts-sidebar resume passed for QA02–QA05 and QA12. Original workshop ownership was also rechecked through authenticated reads for QA02–QA05. Anonymous original-workshop HTTP rechecks returned 200 for all eleven profiles and still showed the known five-hour time mismatch; QA05 retained its title mismatch. These HTTP checks do not establish signed-in Android coverage for the remaining accounts. The false private-draft deletion notice remains `DRAFT-GUEST-DELETED-NOTICE-001`.

QA12's Day 5 Description edit remains unverified: the clipped label produced a false visibility assertion, and tested gestures did not bring the actual textarea into view. No explicit event Save or Publish ran. A Tab-key calibration inserted eight spaces into an empty Arrival field; they were erased and the empty value verified before leaving, without saving. Other accounts' independent checks proceeded without treating that failed selector as a confirmed app defect. QA06, QA07 and QA09 subsequently completed owner verification and actual app activity; their original challenges and failed attempts remain preserved. QA01 subsequently verified its exact owner and two app actions on the separate Play-installed device in `day5-QA01-1792689338708`, bringing October 22's unique account coverage to 11/11. Its earlier primary-device Google limit remains a separate preserved access observation. Midday completed all 42 planned actions; the evening window was missed and its automation deleted on October 23. Camera remains unavailable. Human feedback and continuous Play participation are not established by these automated checks.

<!-- envitefy-manual-20261022:end -->

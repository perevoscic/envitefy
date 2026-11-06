# Start Envitefy testing

The phrases **"start Envitefy testing"**, **"resume Envitefy testing"**, and
**"run Envitefy QA"** request a manual pass through the existing per-user Android
QA fleet. Begin the work without asking the user to repeat the plan. A request
to save, discuss, or edit these instructions does not launch tests.

Use `D:\Develop_local\envitefy` on this Windows host. Each assigned account
QA01-QA13 retains its own `Envitefy_Fleet_QAxx` AVD and userdata. Resolve actual
paths and serials from the fleet manifest. Do not substitute the standalone
`Envitefy_Local_QA` / `emulator-5554` APK runner for a user's device.

## Find the current checkpoint

Read [the fleet operating notes](maestro-device-fleet.md), then inspect:

- `output/maestro/device-fleet/manifest.json` for account/device assignments.
- `output/maestro/device-fleet/campaign.json` and `owner-actions.json`.
- `output/maestro/device-fleet/accounts/QAxx/checkpoint.json` and its latest
  referenced run/session evidence for each selected account.
- `output/maestro/device-fleet/running-device.json`, the Android UI locks under
  `output/maestro/`, and the corresponding live runner/emulator processes.

Use current evidence, not historical account counts or old verification prompts
in documentation. Never print credentials from `.env.maestro.local`.

The original coordination chat is
[Clarify 13th account next steps](codex://threads/01a18ef6-2356-7ac0-94ed-47184130ef92).
When starting from another chat, inspect its status using the available thread
tools, preferably a compact `wait_threads` snapshot. Verify actual runtime
ownership as well: an active chat can be awaiting the owner, and an idle emulator
alone is not an active UI run. If a live runner owns the fleet, report that the
run is already underway and its current account/checkpoint; do not start a
duplicate, interrupt it, or delete its locks. Sending a new instruction to that
chat is a separate action, not required by this shortcut.

An existing chat may own an unresolved account-verification continuation even
when its Maestro process has exited and released the lock. Preserve that current
challenge and report the outstanding owner action; a free process lock alone is
not a reason to take over its screen or request another challenge.

The current fleet tools use the shared `emulator-5556` master UI lock and one
running-device lease. Respect their sequential execution. A separate persistent
AVD per account does not require all thirteen to run simultaneously. The
standalone runner's concurrent-device support has not been added to the fleet.

## Run or resume

Honor an explicitly selected subset of accounts; otherwise target the assigned
QA01-QA13 accounts. Resume an interrupted manual pass from its missing steps,
retaining the original evidence. A fresh explicit start may create a new dated
manual pass; earlier scheduled results remain separate.

Use the existing tools from the repository root:

```powershell
node scripts/maestro-device-fleet.mjs status
node scripts/maestro-fleet-device.mjs start QA01
node scripts/maestro-fleet-device.mjs inspect QA01
node scripts/maestro-fleet-session.mjs --account QA01 --step app-browse
node scripts/maestro-fleet-device.mjs stop QA01
```

Replace `QA01` with the verified selected account. This is the normal completed-
setup path, not a batch to run blindly. Resume an idle device only after matching
its lease, AVD and serial; use the current checkpoint to choose the next phase.

For incomplete setup, finish the existing account's authorized Google/Play and
Envitefy sign-in phases described in the fleet notes. Confirm the actual screen
before each phase. Retain successful setup and reauthenticate only after an
observed signed-out/expired session. Preserve the Play-installed package check
(`com.android.vending`) and exact Envitefy profile identity; do not sideload an
APK into the account fleet. `app-browse` verifies the assigned profile before
and after its existing read-only catalog checks.

At an MFA, CAPTCHA, recovery or owner-consent checkpoint, record the exact account
and current screen and request the necessary owner action. Do not reuse old
codes, repeat verification requests, or bypass a challenge. Keep credentials
out of chat, command arguments and reports. Browser account association/sync and
device backup changes remain outside this default flow.

After completing the device's work or making a deliberate saved handoff, request
normal shutdown through the fleet tool and verify exit before advancing under
the current launcher. Keep an observed verification screen available while the
owner responds; do not shut it down merely because a credential phase ended at
MFA. Preserve userdata,
app state and cookies. A failed boot/shutdown requires inspection of that device's
saved logs and process; do not wipe, clone or recreate it to obtain a pass. A
retry needs a concrete recovery or corrected test condition, not repeated blind
attempts. If progress requires owner action or an unresolved tool failure, save
the checkpoint and report the precise next step.

## Scope and evidence

The default pass is account setup/session retention plus approved read-only QA.
It does not authorize new accounts, event creation/saves/publication, invitations,
messages, RSVP submissions, paid generation, browser sync, or device identity
changes. Expand that scope only when the user requests the additional test.

Create a fresh manual run record under `output/maestro/device-fleet/runs/` and
reference the actual per-phase `sessions/`, `manual/`, and `devices/` evidence.
Use actual timestamps and America/Chicago for user-facing dates. Set
`scheduledAttempt: false` and `countsTowardScheduledDailyRun: false`; this manual
shortcut neither changes the existing schedule nor consumes its daily attempt.
Do not overwrite a scheduled report or backfill a missed run.

Fleet CLIs write phase evidence, but do not automatically maintain all aggregate
campaign/account checkpoints. Update the relevant checkpoint and aggregate state
from observed results, using their existing schemas and preserving newer writes,
earlier successful checks, incomplete attempts and evidence paths. Never infer
completed sign-in or app actions merely from credentials submitted, a process
exit, provisioning, or a returned dashboard.

Report results per account: checks passed, explicit assertion findings, incomplete
checks with their exact timeout/tool cause, and required owner action. Automated
QA records do not establish human participation, continuous Play enrollment, or
production-access eligibility.

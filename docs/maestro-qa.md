# Maestro account testing

This suite contains twelve distinct YAML flows for twelve supplied test accounts. The default command loads `.env.maestro.local` at the repository root, or the same variables from the process environment in CI. It stops before starting a browser or making app requests when required values are missing. Real accounts have not been supplied, so testing against the user's environment is pending.

An optional local fixture mode creates twelve synthetic non-admin accounts and a disposable PostgreSQL cluster. Those accounts were used to develop the harness; they are separate from the user's accounts and do not verify the user's deployed environment.

## Windows setup

Prerequisites: Node 24 and Java 17+ with `JAVA_HOME`. Bun and portable PostgreSQL are needed only for optional local fixture mode. On this workstation Java 21 and Bun are already installed. If Bun is installed elsewhere, set `MAESTRO_BUN_BIN` to its executable.

```powershell
npm run maestro:install
npm run maestro:doctor
npm run test:maestro -- --list
npm run maestro:check
# Only after accounts and test records have been provided:
npm run test:maestro
```

The installer pins Maestro CLI 2.11.0 and portable Windows PostgreSQL 18.4.0-beta.17 under ignored `.tools/`. No Windows service or global PATH change is needed. `MAESTRO_BIN` and `MAESTRO_PG_BIN` override these paths. Maestro's Java user home is under `qa-artifacts/maestro/home`. Anonymous Maestro analytics and optional AI analysis are disabled. Initial Chromium/driver setup can require internet access; run the doctor before an offline test session.

`.env.maestro.local` has been created with empty variables. The committed template is `.maestro/accounts.env.example`. Provide `MAESTRO_BASE_URL` and `MAESTRO_QA01_EMAIL` / `MAESTRO_QA01_PASSWORD` through `MAESTRO_QA12_EMAIL` / `MAESTRO_QA12_PASSWORD`. Remote origins require HTTPS. Quote passwords containing spaces or `#` using dotenv syntax. Process environment values override the file. Use `--env-file <path>` for a separate file.

Provide the existing event IDs and expected labels in the same file. The template documents each prerequisite: draft/published Live Cards, an owned scan, separate signup forms, pending co-host invitations and a full waitlist slot. QA02 owns the QA09 card; QA06 owns the QA07, QA08 and QA10 forms. QA12 is unrelated to those owners and points at QA05's private event. Each co-host account must have exactly one pending invitation. Use dedicated records: these flows publish a draft, edit wording/titles, reserve/cancel slots, promote a waitlisted participant and revoke the QA09 co-host. Subsequent reruns require restoring those preconditions. The configuration check validates variables and formats without logging in; it does not prove credentials or records exist.

Optional local fixture mode uses loopback ports 3217 (proxy), 3218 (Next), 55447 (PostgreSQL), 4327 (local storage) and 4328 (disabled AI boundary). Occupied ports fail setup. It uses Next's existing per-port development-server wrapper and warms initial compilation through authenticated HTTP requests.

## Accounts and flows

| Account | Flow | Checks |
| --- | --- | --- |
| QA01 | `01-auth-onboarding.yaml` | Incorrect password, successful real UI login, account identity and dashboard |
| QA02 | `02-livecard-create.yaml` | Existing artwork draft, wording edit, explicit save, reload, review and publication |
| QA03 | `03-livecard-edit.yaml` | Published wording edit, Save changes, persisted original event |
| QA04 | `04-event-page.yaml` | General Event template and custom section editing |
| QA05 | `05-snap-upload.yaml` | Seeded private scan details and positive owner original access |
| QA06 | `06-signup-host.yaml` | Host dashboard, person/item views, availability |
| QA07 | `07-signup-participant.yaml` | Reserve, edit, cancel and retained cancellation audit record |
| QA08 | `08-signup-waitlist.yaml` | Join full-slot waitlist; API companion cancels the seeded reservation and verifies promotion |
| QA09 | `09-event-cohost.yaml` | Explicit acceptance, wording edit, limited controls, server permissions and revocation |
| QA10 | `10-signup-cohost.yaml` | Form acceptance, title edit, host dashboard and server permission boundaries |
| QA11 | `11-dashboard-calendar.yaml` | Dashboard filters and calendar action surface |
| QA12 | `12-account-isolation.yaml` | Unrelated private history access, participant projection, original denial with positive owner control |

The filenames `auth-onboarding` and `snap-upload` identify coverage families. QA01 uses an existing account; it does not certify new-account registration/onboarding. QA05 uses an existing scan; it does not certify the file picker or provider OCR. These limits are also recorded in run reports. Each flow requires its documented records before it runs.

Shared login uses the application's dedicated `/mobile/sign-in` browser handoff surface and the real email/password form. It verifies the resulting authenticated account before visiting the website workflow. It never authorizes a native handoff or clicks Continue in Envitefy. Marketing navigation/login discovery is separate from these authenticated workflow tests.

```powershell
# Run one supplied account after its variables and prerequisites are ready
npm run test:maestro -- --flow QA08

# Run a subset using supplied accounts
npm run test:maestro -- --flow QA02,QA03,QA05

# Explicit opt-in for disposable synthetic local accounts
npm run test:maestro:local -- --flow QA01

# Inspect the browser while running
npm run test:maestro -- --flow 03 --headed

# Extend the per-flow bound (maximum 900000 ms)
npm run test:maestro -- --timeout-ms 360000

# Validate collector/process behavior without starting Envitefy
npm run test:maestro:runner
```

For local harness development, `node scripts/maestro-serve.mjs` leaves a synthetic environment running until Ctrl+C. Its printed directory can be passed by name with `--attach development-...`. Attach accepts only a marked suite environment beneath `qa-artifacts/maestro/`, validates a loopback origin and never shuts down the server owned by the serve process. Attached runs reuse modified fixtures; `--local-fixtures` creates a fresh disposable environment.

## Reports and bug collection

Each run writes `qa-artifacts/maestro/<run-id>/report.html`, `bugs.json` and `bugs.md`, plus one directory per account. The directory includes Maestro's JUnit XML, console log, nested step metadata, screenshots and independent `api-checks.json` results. It snapshots that flow and its shared helpers immediately before execution, recording their SHA-256 digest so later script edits do not change the reproduction evidence. The JSON records app commit, environment, account alias, role, duration, failed step and evidence path. Duplicate failures are grouped within the run, retaining each affected account occurrence.

Findings start as `suspected_defect`, `incomplete_check`, or `environment_or_test_failure`, with `untriaged` severity. No automated failure is promoted to a confirmed app defect. Browser transport/flow timeouts remain incomplete checks; an HTTP/setup problem is distinct from an assertion. Completed results remain in the report when another account fails. The process exits nonzero for any failed or skipped selected flow.

`qa-artifacts/maestro/findings.json` accumulates unique findings across runs with first/last occurrence, affected accounts and commit references. Explicit review can classify a finding without creating an external issue:

```powershell
npm run maestro:triage -- F-<id> confirmed_defect high "Reproduced manually; expected and observed behavior verified."
```

Other review classifications include `test_script_problem`, `environment_failure`, and `incomplete_check`. Triaged classification, severity and notes survive subsequent occurrences.

Passwords are passed through the CLI's `MAESTRO_` environment mechanism, never command arguments or committed YAML. Maestro records evaluated variables and input commands, so the collector scrubs text artifacts before publishing reports. Runtime secrets remain private while an environment is running; completed default runs redact them. The entire artifact tree and downloaded tools are ignored by Git. Review screenshots before sharing outside the team.

## Provider and coverage boundaries

- Tests require existing artwork and scan data. In local fixture mode the OpenAI-compatible boundary rejects generation. Paid live generation, lettering quality and provider OCR are not certified.
- In local fixture mode, transactional mail is captured by the existing local campaign adapter. Supplied-environment runs use that environment's normal mail configuration and can produce signup/co-host notifications.
- Maestro web coverage is Chromium beta. Keep existing Playwright viewport, download-content and accessibility checks.
- Calendar controls do not prove a calendar provider accepted an event; external OAuth is not connected.
- Permission companions call the real server routes and include positive controls. They are separate from UI assertions.
- Local fixtures are synthetic. Supplied-environment runs use only the accounts and records named in the environment file. The collector does not create external issue tracker tickets.

Official references: [installation](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli), [web support](https://docs.maestro.dev/get-started/supported-platform/web-browser), [test artifacts](https://docs.maestro.dev/maestro-flows/workspace-management/test-reports-and-artifacts).

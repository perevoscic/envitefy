# Google / Outlook calendar sync — restored

The user explicitly reversed the temporary verification pause on September 5, 2026: calendar syncing must stay on. `CONNECTED_CALENDAR_SYNC_ENABLED` is now `true` in `src/config/calendar-sync.ts`, restoring Google/Outlook connection controls and sync paths. Do not disable syncing for verification or maintenance unless the user explicitly requests another pause. Individual calendar connections and user preferences still apply.

This change requires deployment to affect the hosted site. Accounts shown as Not connected still need to connect their provider. Enabling sync does not automatically backfill events saved during the pause.

The remaining sections preserve the original pause and restoration record; the earlier pause request is superseded by the instruction above.

## Historical restoration procedure

1. Change `CONNECTED_CALENDAR_SYNC_ENABLED` from `false` to `true` in `src/config/calendar-sync.ts`.
2. Run the checks listed below, rebuild, and redeploy the application. Restart a local dev server if it does not pick up the shared switch. Both the client bundle and server need the same version.
3. Confirm Settings can connect Google and Outlook again, and test one scan and one manually created event with a connected calendar. Reconnect if the provider's existing grant has expired or was revoked.

This restores the retained OAuth routes, scan sync, creation checkboxes and writes, first-scan prompt, Settings controls, FAQ wording, and marketing claim together. No environment variable, database migration, token deletion, or data backfill is required. Events saved during the pause remain in Envitefy; enabling the switch does not bulk-sync them retroactively. Existing calendar events are not changed by the pause.

## Scope

| Area | Paused behavior |
| --- | --- |
| Snap/upload | Saves the event and navigates normally; skips the automatic calendar request. |
| Manual / template creation | Hides Google/Outlook selections and skips provider writes in the generic form, modal, WYSIWYG builder, appointments, baby showers, birthdays, gender reveal, and sports builders. |
| Server writes | `/api/events/calendar/auto`, `/api/events/{google,outlook}`, their `/bulk` routes, and `/api/{google,outlook}/insert` return HTTP 503 with `CALENDAR_SYNC_PAUSED`, before token access, provider calls, or sync metadata changes. |
| Calendar OAuth | `/api/{google,outlook}/{auth,callback}` redirect to `/settings#calendars` before requesting scopes or exchanging codes. OAuth already in flight is also stopped. |
| First scan prompt | No connection dialog, reconnect notice, or follow-up sync from old setup URLs. The user's prompt decision is preserved. |
| Settings | Shows a temporary pause message; disables Connect/Reconnect and hides the sync default controls. Real connection status and Disconnect remain available. |
| Customer information | FAQ and privacy page explain the pause. The marketing prompt omits the disabled background-sync claim and describes manual calendar saves instead. Original wording returns with the switch. |

Google sign-in through NextAuth, event creation/storage, public pages, RSVP, manual Google/Outlook calendar links, Apple/ICS downloads, existing tokens, and existing defaults remain available/preserved. No Google Cloud Console or Microsoft app-registration settings are changed.

The custom Google OAuth endpoint is also used to authorize the admin Google Analytics connection and currently bundles calendar permission into that flow. Starting or finishing that authorization is temporarily paused too; existing Analytics reporting code and stored tokens are untouched. This avoids issuing calendar permissions through the shared authorization endpoint during the hold.

Deployment is required for this pause to affect the hosted site. These code changes alone do not change the verification submission or guarantee a verification outcome.

## Exact change trace and optional full removal

`artifacts/calendar-sync-pause-2026-09-05/` contains:

- `initial-head.txt` and `initial-git-status.txt`: repository state before these edits.
- `files.json`: the 25 existing source files changed, with before/after SHA-256 hashes.
- `before/`: snapshots of those files from the working tree, including pre-existing user edits.
- `pause-only.patch`: isolated changes to those files plus the three new configuration/helper/test files.
- Lint, test, and TypeScript comparison results.

To completely remove this implementation instead of re-enabling it, first check the isolated patch, then reverse it:

```powershell
git apply --reverse --check artifacts/calendar-sync-pause-2026-09-05/pause-only.patch
git apply --reverse artifacts/calendar-sync-pause-2026-09-05/pause-only.patch
```

If the check fails because a file has since changed, reconcile the affected hunks manually using the snapshots; do not replace whole files or reset the repository. The patch is relative to the working tree at the start of this task, so unrelated changes are preserved. Keep this document and the trace as an audit record. The one-time `apply-pause.cjs` script refuses to overwrite the original snapshots and should not be rerun to restore the feature.

## Validation

```powershell
node --test src/lib/calendar-sync-pause.test.mjs src/app/api/events/calendar/auto/route.test.mjs src/app/api/google/auth/route.test.mjs src/app/api/outlook/calendar-connection.test.mjs src/app/settings/settings-workspace.source.test.mjs src/app/faq/page.test.mjs src/lib/legal-privacy-controls.source.test.mjs
node artifacts/calendar-sync-pause-2026-09-05/verify-and-record.cjs lint
npm run lint:vscode -- src/config/calendar-sync.ts src/lib/calendar-sync-pause.ts src/components/Dashboard.tsx src/components/FirstScanCalendarPrompt.tsx src/app/settings/page.tsx
```

The new behavioral tests exercise both switch states without changing the shipped configuration. They execute every blocked route with provider, authentication, database, and network dependencies that fail if called; test stale OAuth returns; render the suppressed first-scan prompt; and verify the marketing claim is restored when enabled.

Final result: 39 targeted tests passed; Biome reported zero errors or warnings across all 28 touched source/test files. The required VS Code diagnostics command was attempted for every touched TS/TSX file but could not find the Chat to CLI linter bridge. A full TypeScript comparison against the saved originals found 172 existing diagnostics before and after, zero added diagnostics, and zero diagnostics in the touched TS/TSX files. Results are recorded in `types-comparison.json`.

Local smoke checks against the running development server confirmed both OAuth start routes redirect to Calendar settings and the automatic sync endpoint returns the expected 503 paused response. The isolated rollback patch passed `git apply --reverse --check`. No production deployment or real provider calendar write was performed.

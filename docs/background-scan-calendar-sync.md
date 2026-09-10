# Background calendar sync for saved scans

September 10, 2026

The scan frontend opens the saved event immediately after `/api/history` returns.
It no longer calls or awaits `/api/events/calendar/auto` before navigation.
Google and Outlook calendar syncing remain enabled.

History saves `calendarSync.status = pending` in the same event insert, then runs
`runSavedCalendarSync` through Next.js `after()`. Provider SDK loading, grant
validation, event insertion and sync-result writes happen after the save response.
Artwork generation remains a separate concurrent background task.

The worker claims the event with an atomic database update. Its five-minute lease
prevents competing status requests from duplicating provider work, and its claim
token fences result writes from an expired worker. Google deterministic event IDs
and Outlook transaction IDs remain unchanged. Explicit calendar setup/retry still
supports adding the event to a newly connected provider.

Owners read a minimal status response through authenticated
`GET /api/events/calendar/auto?eventId=...`. The event page polls without blocking
its content, confirms success, and preserves connection/reconnect/error notices.
Existing pending work and expired claims resume after the status response, including
when an owner reopens an event. If a process terminates before work finishes, a
subsequent owner status read is the recovery trigger; this is not a scheduled queue
worker. Status responses are private and omit provider IDs, tokens and raw errors.

Success feedback is a one-time notice for each sync completion, scoped to the
owner, event, provider and completion timestamp. The browser remembers a shown
completion immediately, so reloading, revisiting a creation link or dismissing
the notice cannot replay it. The scan page consumes only the `created` URL flag,
preserving other query parameters and the hash. Background status reads remain
quiet until pending work is actually observed; reopening an already-synced event
does not flash an “Adding” notice or create another provider event. Pending work
still resumes normally, and a newly completed sync can show its confirmation.

Verification uses delayed provider mocks to prove the history response finishes
before the provider starts, concurrent-claim tests, owner isolation, stale-work
recovery, and Google/Outlook success and failure cases. No live calendar events are
created by these tests.

Validation: the targeted background worker/provider tests, calendar ownership and
pause guards, scan navigation guards, calendar date/payload tests, and event-page
calendar notice guard pass. Biome reports no errors in the changed files. The
VS Code diagnostics bridge was unavailable; TypeScript diagnostics found no
errors in the new sync code and the same 22 pre-existing event-page errors with
and without this change. The broader event-page suite also has an unrelated
birthday-renderer source guard failure.

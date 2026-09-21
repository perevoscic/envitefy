# Owner Messages

Messages is an owner-only email composer. The host writes a subject and message, previews it, then explicitly sends to current Yes/Maybe guests. Event edits and artwork changes never invoke this flow. Guest RSVP notes remain visible with their responses in RSVPs.

## Sending and storage

- Existing Zoho SMTP sends one email per guest, with the shared signature and public event link. Replies use the saved RSVP host email when valid.
- No guests receive no RSVP confirmation email and no announcement. The RSVP route uses Next's `after` lifecycle for eligible confirmation emails.
- Separately, a newly saved or changed guest RSVP emails the host for Yes, Maybe and No. It uses the saved RSVP host email, with the owner account email as fallback, and includes guest details and a View RSVPs link. Identical resubmissions and the host's own RSVPs do not generate host alerts. Host and guest email failures are isolated from each other and never undo the saved response.
- `event_messages` stores explicitly saved drafts and immutable sent content. `event_message_deliveries` stores the recipient snapshot and result. The latest response per normalized email determines eligibility; it is checked again immediately before delivery, including on retries.
- `prisma/manual_sql/20260921_event_messages.sql` is the migration. The authenticated Messages service also bootstraps those tables/indexes idempotently, consistent with existing data-layer setup. Both paths enable RLS and revoke public/client access in the same transaction as creation. These are server-only tables with no client policies; owner authorization happens in the Messages API. The backend connection must own the tables and have schema-creation privileges (the configured Supabase connection uses `postgres`).
- Send uses the draft's stable UUID for idempotency. Concurrent requests lock the message before creating its recipient snapshot. Processing atomically claims three pending recipients at a time.
- Processing starts only from Send, Continue sending, or Retry failed emails. GET, preview, draft saving, and event mutations never send announcements.
- The initiating UI processes batches. If it closes or a request fails, pending deliveries remain in history for an explicit Continue sending action. Refreshing never resumes sending automatically.
- Sent means accepted by Zoho, not delivered/read. A process interrupted after attempting SMTP may leave a recipient awaiting status. That recipient is not automatically resent; the host should check with the guest before composing another announcement. Retry failed emails resets only known failures, never accepted or uncertain sends.

## Verification

### Supabase setup

Open the project's SQL Editor as `postgres`, paste the complete `prisma/manual_sql/20260921_event_messages.sql`, then Run. If Supabase offers the RLS warning, choose **Run and enable RLS**. The updated file explicitly enables it already; rerunning preserves existing messages and recipients. Do not add public or authenticated allow-all policies. Running the migration never sends email.

To verify, run:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('event_messages', 'event_message_deliveries');
```

Both tables should show `rowsecurity = true`. If a deployed backend uses a different database role, configure that trusted role's ownership/access before switching; an ordinary client role intentionally cannot access these tables.

### Automated checks

`node --test src/lib/event-messages.test.cjs` tests authorization, email escaping and signatures, No exclusion, repeated Send, current eligibility on retries and send isolation from edit routes. These tests mock database and mail boundaries; they do not prove production delivery.

`node --test scripts/event-messages-browser.test.cjs` renders the real composer with its unsaved-progress provider, mocked HTTP persistence, and no external mail. It checks explicit saves, preview without sending, draft resumption, interrupted-send recovery, history, refresh without resend, and mobile overflow. Screenshots go to `.qa/event-messages/`. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an already-installed Chromium.

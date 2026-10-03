# Event co-hosts

The owner opens **Manage access** from a saved Live Card or the event management workspace and invites an email address. The recipient may create an account after receiving the invitation. They must sign in with the invited email and explicitly accept before gaining access. Acceptance opens the original event workspace, and its dashboard card carries a **Co-host** badge.

Co-hosts can edit event details and artwork, save drafts, publish, and manage RSVP responses and guest messages. Only the owner can delete the event, manage collaborators, change its public URL or unpublish it. Ownership remains `event_history.user_id`; collaboration grants no access to another event or to the owner's account integrations. Private scans and signup forms keep their separate access rules and are excluded from this feature.

Unsaved new progress must be explicitly saved before inviting someone. Published Live Card saves update the public card immediately. Custom Event Pages retain their existing private draft/publication behavior. Guest Share remains separate from Manage access.

## Storage and acceptance

The tables are server-only: row-level security and revoked client grants commit together with creation. Anonymous and authenticated client database roles cannot read invitations, memberships or edit activity directly.

`prisma/manual_sql/20261002_event_collaboration.sql` creates event memberships, email invitations and edit activity. The same idempotent schema setup runs through the server data layer. Invitation tokens contain 32 random bytes; only their SHA-256 hashes are stored. They expire after seven days. Resending cancels the prior pending invitation. Acceptance, resend, removal and collaborative saves lock the event row before modifying access, preventing duplicate acceptance and revocation/save races.

On a cold server process, a read-only catalog query checks the installed tables, indexes, row-level security and revoked client grants. An already migrated, secured database skips the setup transaction and its exclusive table locks. Missing or unsecured tables still run the original transactional setup. The owner lookup for Manage access reads only ownership and eligibility fields; it does not load artwork or initialize public links.

The email uses the existing Zoho SMTP transport and Envitefy signature. SMTP acceptance is recorded as sent; it is not a delivery receipt. Failures leave an invitation visible with a Resend action. Raw tokens travel in an email URL fragment and POST body, with no-referrer/noindex on the acceptance page; they are not used as ongoing editing credentials. Auth redirects preserve the invitation while requiring an explicit Accept after authentication.

## Recipient notifications (October 3, 2026)

Signed-in recipients receive an in-app notice for pending co-host invitations, with a link to the dashboard. The notice dismisses after five seconds; the dashboard's **Co-host invitations** section remains above the spotlight until acceptance, cancellation or expiry. Pending invitations count in **Needs attention**, whose review link closes the dialog and focuses the dashboard's acceptance action.

The app checks invitations on entry, every 30 seconds while visible, and on window focus. **Refresh dashboard** refreshes invitations too. A temporary read failure keeps previously loaded invitations and offers retry. Lists and notices clear on account changes and sign-out. No browser notification permission is needed. Existing Zoho invitation emails remain in place.

`GET /api/cohost-invitations` is authenticated, private and uncached. It matches the recipient's current account email in the database, including accounts created after an invitation was sent. It returns only the invitation ID, event ID/title, owner display name and expiry; tokens, artwork, guest information and private event fields are excluded. Revoked, accepted, expired, deleted, unsupported and already joined events are excluded.

Dashboard **Accept invitation** explicitly posts the invitation ID. The server binds it to the signed-in email and shares the email-link acceptance transaction, rechecking availability, ownership and event eligibility under the event-first locks. An invitation ID alone grants no access. Success invalidates the recipient's history/dashboard caches and opens the original event workspace. A failed acceptance preserves the row and displays its error.

Run `npm run test:cohosts` for recipient isolation, signup after invitation, lifecycle changes, explicit acceptance, notification refresh/timeout, account switching, dashboard counts and mobile/landscape checks. Generated fixtures and screenshots are written under `output/cohost-notifications/`.

Recipient implementation verification: all 34 co-host/dashboard tests passed, including both browser flows; the full application typecheck and lint for the changed files passed. Desktop and 375px dashboard screenshots were inspected, and browser checks covered landscape, larger text and reduced motion. The separate dashboard source-guard suite retains its existing share-link assertion failure, reproduced with HEAD tests and HEAD components: it expects an inline `/event/…` URL while the component uses `dashboardEventHref(item)`. No live invitation emails were sent.

## Editing

Editable history GET returns current permissions and a content revision. Each mounted editor holds its own baseline; PATCH sends that revision in `If-Match`. The server locks the event, rechecks membership, compares the current title/data revision and commits the title/data together. A stale save returns 409 without overwriting either person's saved changes. A collaborative event requires a revision, including for the owner. Local edits remain available, and the Live Card editor offers a separate tab for the latest saved card.

All legacy history writers change the content hash automatically; no writer-specific revision counter is required. Artwork jobs associated with saved events use event permission checks for reading and cancellation. Their provider dispatch identity remains with the owner to preserve reuse and avoid sharing unrelated jobs.

## Verification

Local verification covers the real invitation/access UI and actual signup/login forms with mocked authentication, SMTP and database boundaries. No production migration or live invitation email was sent during implementation. The separate legacy `/api/event-pages` blueprint engine retains its existing owner rules; this feature uses the current event/template and Live Card editors.

Run `node --test scripts/event-collaboration.test.cjs` for invitation/account binding, expiry/reuse, resend, event isolation, revocation, edit roles and simultaneous-save protection. Browser coverage is in `scripts/event-collaboration-browser.test.cjs`. Existing Create/Live Card checks remain required.

Implementation verification: type checking passed; all 1,387 Create remediation tests passed, including 11 co-host behavior tests. All six browser checks passed in an unrestricted run. A later sandbox run passed five and could not write an owner-preview screenshot; that owner check passed again outside the sandbox. Mobile access and acceptance screenshots were inspected. Biome checks passed. VS Code diagnostics could not run because the Chat to CLI bridge was unavailable.

The separate `EventOwnerView.test.mjs` suite passes eight of eleven tests. Its same three failures reproduce with the original HEAD component sources: outdated owner-action and card fixtures, and a dialog mock missing a component. These failures were not changed by this feature.

## Loading performance (October 3, 2026)

The local `.next-dev/trace` recorded a collaboration route compilation of 12.3 seconds within a 15-second request, another cold request of 16.7 seconds, and a warm request of 607 milliseconds. These are development-server measurements; the reported 25-second wait was not captured directly. A read-only check against the configured database found the migration already installed and no active lock waits. The exact optimized schema, owner and roster queries took 89, 43 and 69 milliseconds respectively in the final check. No schema or event data was changed by profiling.

List loading now has its own status and leaves the invite form usable. Reopening shows the previous roster while refreshing. Closing cancels an unfinished read, and starting an invitation or removal cancels older reads so they cannot overwrite its updated roster. Email submission still awaits Zoho acceptance before claiming the invitation was sent. Each collaboration response includes private, uncached `Server-Timing` measurements for session, user lookup, owner check, schema readiness, roster and applicable mutation/SMTP work. Slow requests log those stage durations without emails, event IDs or invitation tokens.

The 13 co-host behavior tests, all 1,389 Create remediation tests, the mobile browser check (including deferred reads, invitation races and reopening), type checking and Biome checks passed after this optimization.

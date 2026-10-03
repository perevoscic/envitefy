# Event co-hosts

The owner opens **Manage access** from a saved Live Card or the event management workspace and invites an email address. The recipient may create an account after receiving the invitation. They must sign in with the invited email and explicitly accept before gaining access. Acceptance opens the original event workspace, and its dashboard card carries a **Co-host** badge.

Co-hosts can edit event details and artwork, save drafts, publish, and manage RSVP responses and guest messages. Only the owner can delete the event, manage collaborators, change its public URL or unpublish it. Ownership remains `event_history.user_id`; collaboration grants no access to another event or to the owner's account integrations. Private scans and signup forms keep their separate access rules and are excluded from this feature.

Unsaved new progress must be explicitly saved before inviting someone. Published Live Card saves update the public card immediately. Custom Event Pages retain their existing private draft/publication behavior. Guest Share remains separate from Manage access.

## Storage and acceptance

The tables are server-only: row-level security and revoked client grants commit together with creation. Anonymous and authenticated client database roles cannot read invitations, memberships or edit activity directly.

`prisma/manual_sql/20261002_event_collaboration.sql` creates event memberships, email invitations and edit activity. The same idempotent schema setup runs through the server data layer. Invitation tokens contain 32 random bytes; only their SHA-256 hashes are stored. They expire after seven days. Resending cancels the prior pending invitation. Acceptance, resend, removal and collaborative saves lock the event row before modifying access, preventing duplicate acceptance and revocation/save races.

The email uses the existing Zoho SMTP transport and Envitefy signature. SMTP acceptance is recorded as sent; it is not a delivery receipt. Failures leave an invitation visible with a Resend action. Raw tokens travel in an email URL fragment and POST body, with no-referrer/noindex on the acceptance page; they are not used as ongoing editing credentials. Auth redirects preserve the invitation while requiring an explicit Accept after authentication.

## Editing

Editable history GET returns current permissions and a content revision. Each mounted editor holds its own baseline; PATCH sends that revision in `If-Match`. The server locks the event, rechecks membership, compares the current title/data revision and commits the title/data together. A stale save returns 409 without overwriting either person's saved changes. A collaborative event requires a revision, including for the owner. Local edits remain available, and the Live Card editor offers a separate tab for the latest saved card.

All legacy history writers change the content hash automatically; no writer-specific revision counter is required. Artwork jobs associated with saved events use event permission checks for reading and cancellation. Their provider dispatch identity remains with the owner to preserve reuse and avoid sharing unrelated jobs.

## Verification

Local verification covers the real invitation/access UI and actual signup/login forms with mocked authentication, SMTP and database boundaries. No production migration or live invitation email was sent during implementation. The separate legacy `/api/event-pages` blueprint engine retains its existing owner rules; this feature uses the current event/template and Live Card editors.

Run `node --test scripts/event-collaboration.test.cjs` for invitation/account binding, expiry/reuse, resend, event isolation, revocation, edit roles and simultaneous-save protection. Browser coverage is in `scripts/event-collaboration-browser.test.cjs`. Existing Create/Live Card checks remain required.

Implementation verification: type checking passed; all 1,387 Create remediation tests passed, including 11 co-host behavior tests. All six browser checks passed in an unrestricted run. A later sandbox run passed five and could not write an owner-preview screenshot; that owner check passed again outside the sandbox. Mobile access and acceptance screenshots were inspected. Biome checks passed. VS Code diagnostics could not run because the Chat to CLI bridge was unavailable.

The separate `EventOwnerView.test.mjs` suite passes eight of eleven tests. Its same three failures reproduce with the original HEAD component sources: outdated owner-action and card fixtures, and a dialog mock missing a component. These failures were not changed by this feature.

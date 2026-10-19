# Unified event creation

The signed-in Event Page entry is `/create`. Upload, Paste URL and Start from scratch share one intake and existing editors. Imported sources open the editor automatically with the first compatible template; Start from scratch keeps explicit template selection. Snap a Flyer and Live Card remain distinct sidebar entries. My Events opens the existing sidebar list: upcoming events run from nearest to latest across categories, undated events follow, and Show past events expands history with the most recent first. Schedules, Sign-up Forms and Drafts retain their own sidebar entries. `/events` also remains available with All events, Drafts, Schedules and Sign-up Forms views. The Home dashboard and its calendar actions remain in place.

The landing opens directly to Upload in one compact workspace. Selecting or dropping valid files immediately starts parsing and opens the editor with the first compatible template, without a separate design-selection step. Category-gallery uploads hand off to the same workspace and start parsing once their files are restored. Changing the uploaded batch starts a fresh read; cancellation and failures retain the files for an explicit retry. Editor-opening failures retain extracted facts and offer Continue to editor without rereading the source. A three-way method control switches the task in place, retaining each method's source separately. Start from scratch presents one image-led event-type picker; Upload and URL offer image-led Your event templates below the workspace. The desktop workspace pairs the active task with an explicitly labeled example page; phones hide that decorative preview and stack suggested templates vertically. The draft banner resumes the latest unfinished event and expands all retained drafts with their existing discard actions. Manual creation and optional design browsing use the shared mosaic gallery: four desktop columns, two phone columns, native artwork covers and automatic loading. Users can change the design in the existing editor without losing imported details. The layout responds to the available workspace width, including the desktop sidebar, and phone inputs retain accessible touch targets.

## Creation and recovery

1. An upload or public URL is read and classified. PDF text and scanned pages are retained in page order. A blocked URL can be replaced by pasted event text or an uploaded screenshot.
2. Supported recognized imports automatically use the first compatible catalog design and open their existing editor. The host can correct ambiguous event types; an ambiguous sport must be selected before specialty discovery starts. Restricted categories retain the source and access guidance.
3. Manual creation still opens an editor after template selection. Imported sports automatically continue through the structured discovery pipeline with the first compatible template; signup imports create reviewable information sections with no participants. Live Card conversion enters its existing Design → Event details → Review builder.
4. Editors retain explicit Save draft / Publish or Save changes behavior. Recognition and template selection do not generate artwork or publish. Original uploaded artwork and explicit custom AI design are separate choices.

`src/lib/create/creation-intake.ts` owns version 1 intake records. They are scoped to the signed-in account, stored in IndexedDB for seven days, and contain actual source blobs, notes, classification, extracted source text/facts, template selection, editor state and linked discovery/event IDs. Recovery is limited to the same browser/device. Discard, expiry and sign-out remove intake records. Failed reads or designs retain successful earlier stages. Source changes invalidate results and allocate a new processing identity after an earlier source was recognized.

Native editor recovery also uses the existing owner-tagged template-draft store. Local recovery never substitutes for an explicit account save. Source intake cleanup is serialized with writes so delayed work cannot recreate a discarded or signed-out record.

Sports discovery uses an account-and-intake key, advisory transaction locking and deterministic event identity. Retries resume the same shell and completed stages. Cancellation is persisted in `event_discovery_controls`; process-local aborts are an optimization. Leaving the page or losing a request does not cancel work. Processing and review-ready shells remain private drafts, including historical shells without a draft marker. Explicitly published records keep their publication state.

Medical and personal appointments continue through Snap's private document/calendar workflow. They are not automatically converted into public host pages.

## Access and preferences

`creation_account_access` is the authorization source. Missing policy rows resolve to Standard, which includes released products and categories. Administrators can explicitly apply Restricted policy and grants. Signup origin, old product scopes and hidden interests do not establish restrictions.

Settings distinguishes allowed categories selected for the workspace from unavailable capabilities. Restricted accounts can submit persisted requests; one pending request per account/capability is enforced in the database. Admin approval grants access and selects the capability atomically; decline does not grant access. Signup tool visibility is independent of Event Page visibility. Preference failures expose retry and prevent writing fallback defaults.

Suggested templates and example-page artwork use the account's enabled event types intersected with server category grants, and require Event Page product access. Empty or pending preferences never fall back to unrelated categories: the preview stays neutral and Manage event types remains available. Browse available event types explicitly opens the full permitted picker. Suggestions disappear when their grants are removed; draft recovery remains account-scoped and available independently of new-creation grants. Example names and copy are presentation only and never enter event data.

Server checks cover import, generation, durable jobs and new account saves. Saved owner and accepted co-host editing use existing event permissions. Discovery shells receive an authorization stamp in the server discovery record; a client-supplied event ID or history metadata cannot establish an editing exemption. Unsaved stamped shells recheck creation access before paid work and their first explicit save. Only a successful authorized save records the server's saved transition. Request and grant tables are server-only with RLS enabled.

## Release and rollback

1. Apply these idempotent migrations to the target database using the normal deployment process:
   - `prisma/manual_sql/20261019_creation_access.sql`
   - `prisma/manual_sql/20261019_discovery_intake_recovery.sql`
2. Deploy the coordinated application. `NEXT_PUBLIC_UNIFIED_CREATION_ENABLED=1` enables the new creation landing, names and saved-work navigation. This is the default when unset. Set it to `0` during a staged deployment if activation must wait; the value is compiled into the client bundle, so changes require rebuilding.
3. Verify imports and access with provider fixtures before activation. Do not seed account restrictions from marketing attribution or interests.

For UI rollback, rebuild with `NEXT_PUBLIC_UNIFIED_CREATION_ENABLED=0`. Keep the additive tables and permission checks. Existing category galleries, saved `edit=` links, public guest URLs, Snap, signup and Live Card builders remain supported. `/event/new` without a saved edit redirects to `/create`; historical editing and authentication handoffs retain their context.

Migrations in this change are prepared locally; running tests does not apply them to production.

## Verification

`npm run test:unified-create` runs deterministic access, intake, source-reader, extraction, editor adapter, navigation and real Chromium browser fixtures. Its TypeScript fixture batch uses Bun from PATH; browser batches use the installed Playwright Chromium. No provider generation or production database is required.

Also run `npm run test:event-editor`, `npm run test:signup-hosts`, `npm run test:cohosts`, `npm run test:calendar`, and `npm run typecheck`. The unified browser fixture checks all three entry modes, source retention and refresh, category restrictions, source replacement, same-family template changes, native field recovery, filtered saved work, co-host editing, keyboard use and narrow phone layouts.

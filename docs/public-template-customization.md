# Public templates and guest customization

Implemented September 7, 2026.

Visitors can browse category landing pages and galleries, customize a template in their browser, and use **Save and continue** to sign up or log in. Saving creates an owned, private draft. Publishing is a separate action. Signed-in visitors can also browse the galleries.

## Routes and categories

`src/lib/template-categories.ts` connects the nine category routes, editor adapters, history categories, and signup attribution. `src/lib/public-template-catalog.ts` supplies the real catalog entries and artwork. Sports and football gallery aliases resolve to Sports.

- `/<category>`: existing marketing page followed immediately by six featured templates, or all three bridal presets.
- `/<category>/templates`: public, indexable gallery with search, applicable catalog filters, and Load more.
- `/<category>/templates/<templateId>/customize`: validated, non-indexable editor.
- Existing authenticated editor URLs remain supported. Their Save draft action uses the shared handoff, and saved template events reopen in the matching editor. The legacy wedding `/customize/<id>` URL checks ownership and opens the current editor.

Categories: weddings, birthdays, anniversaries, baby showers, bridal showers, gender reveals, gymnastics, sports, and signup forms. Bridal presets use bridal names, wording, imagery, hosts, registries, and public rendering. Gymnastics supports manual meet editing; importing meet information requires authentication.

Galleries use the shared square thumbnail frame. Layout previews are inert and hidden from assistive technology; surrounding links supply accessible names. Signup cards use the existing template artwork. Published signup forms reuse their header artwork and selected header layout.

## Draft storage and account handoff

`TemplateEditorContext` passes the category, template, initial state, and persistence capabilities explicitly to the reused editors. Manual state, editor sections, pending fields, and local photo blobs are stored in the versioned `envitefy-template-drafts` IndexedDB database. Drafts expire seven days after their last edit. Writes are serialized; photos receive fresh object URLs after restoration. Template changes retain entered content. Start over explicitly discards the active browser draft.

Storage failures leave the editor usable and explain that the tab must stay open. Save and continue flushes the complete state before authentication opens. Redirect authentication is offered only after retention succeeds. Email authentication can complete in place when storage is unavailable. Callback URLs contain a same-origin editor path and draft reference, without event content. Cancellation clears the pending-save marker without deleting edits.

`template-draft-handoff.ts` requires authentication, uploads retained photos through `/api/templates/media`, and saves the complete editor snapshot alongside canonical event fields. The client draft UUID becomes the history primary key. Creation retries return an existing event only for its owner and do not overwrite it; newer edits use an ownership-checked PATCH. Failed uploads and saves retain the browser copy for retry. Saved drafts invalidate history and dashboard caches.

The raw editor snapshot stays private. Dashboard/sidebar projections retain only category and template identity for reopening. Explicit draft status is owner-only across public event/history reads, metadata, previews, share links, registry routes, RSVP, signup, volunteer, and carpool actions. Legacy events without explicit draft status retain their existing behavior. Calendar exports that operate on caller-supplied data do not retrieve private event records.

Consent-aware analytics record gallery views, template selection, first edits, save attempts, successful authentication handoff, draft saves, and publishing using category/template identifiers only. The product marketing catalog includes the public customization flow. No pricing, calendar-sync, anonymous AI, or cross-device guest-storage changes are included.

## Verification

- All 51 featured cards opened their matching editors anonymously in the local browser.
- All nine galleries and editors checked at desktop and mobile breakpoints: square inert thumbnails, working editor entry, and no horizontal overflow.
- Sports search and style filtering returned the matching preset; Load more expanded 12 cards to 24.
- Wedding names and a local photo survived reload, authentication cancellation, and template changes; restoration created a fresh browser object URL.
- Signup text survived refresh. Signup/login mode switching and cancellation preserved the editor. Bridal Start over removed the prior temporary content and restored bridal defaults.
- The focused regression suite passed **36 tests**, including 12 behavioral draft/catalog/access tests. These cover storage expiry/failure, local photos, authenticated saving, upload failures, lost responses, idempotent creation, publishing by the owner, and rejecting other users' mutations.
- Biome passed for **54 files** in the edited implementation area.

Remaining verification limits:

- Live Google OAuth and email account creation/login completion were not exercised with a real test account. Handoff behavior was verified with injected authenticated sessions and API responses.
- VS Code diagnostics could not run because the local Chat to CLI linter bridge was unavailable. The wrapper reported that the editor must be reloaded with diagnostics enabled.
- The full TypeScript check still reports existing project errors, including public event nullability and unrelated creation-route types. It reports no errors in the new draft/gallery modules.
- The broader 42-test run passed 40 tests. Two existing source guards still fail: a category-hero rotation assertion against the static hero component, and an appointments-preview layout assertion outside this feature's enabled categories.

Local validation logs are under `tmp/public-template-qa/` (ignored). This change does not deploy or create a real account or public test event.

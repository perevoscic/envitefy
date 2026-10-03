# Shared Event Page sections and layouts

Every authored Event Page category uses `EventEditorWorkspace` with scoped `sectionEditors`. The workspace offers **Page sections** and **Layout**. The shared `EventSectionBuilder` provides adding, editing, moving, removing, restoring and Undo. Section controls also appear on the editable page itself. Phones retain the mounted preview while displaying the editing panel.

Native categories can add information sections containing a heading and body. Their existing sections keep the category's editor fields and native content. Layout thumbnails apply to body sections while preserving the template's hero and artwork; **Template layout** removes the body layout override. Custom generated/uploaded pages use the same builder and their existing full-page layout thumbnails.

## Saved representation

Native event data stores optional `eventPageComposition`:

```ts
{
  version: 1,
  layout?: "split" | "banner" | "poster" | "editorial" | "spotlight" | "minimal" | "cards",
  sections: [{ id: "info:<unique-id>", title: "Travel & parking", body: "Use the east lot." }],
  sectionLayout?: { version: 1, order: [], hidden: [], added: [], widths?: {}, pairs?: [] }
}
```

`normalizeEventPageComposition` bounds information sections to 20, headings to 240 characters and bodies to 12,000 characters. Rendering treats text as text. Reordering or hiding does not change category fields, RSVP responses, or source documents. Undoing an addition hides its retained text so the host can restore it.

`useEventPageEditor` includes composition in its in-memory progress baseline, draft snapshot and explicit publication payload. Template drafts also carry `snapshot.pageComposition`; manual drafts use their corresponding snapshot. Published records use the canonical `eventPageComposition`. Saving waits for the existing record and its composition to load.

Custom pages continue storing their sections and layout under `customEventPage.details` and their page design under `customEventPage.design`; they do not acquire a second composition record.

## Rendering and future categories

The public event route wraps native pages in a read-only `EventPageCompositionProvider`. `EventPageSections`, `TemplateBodyLayout`, the birthday body adapter and wedding body adapters use the same `EventSectionCanvas` as editing. Without saved composition, existing guest pages retain their template markup. Football and gymnastics keep their existing section metadata and canvas; new information sections are supplied by composition.

For a future category, supply scoped `sectionEditors` to `EventEditorWorkspace`, wrap the native body with `EventPageSections` (or the existing `TemplateBodyLayout`), and use stable section IDs in both editor and guest renderer. Keep the hero and footer outside the body. Use the shared save lifecycle rather than saving when a control changes.

## Verification

- `src/lib/event-page-composition.test.cjs`: normalization, safe text, saved order, hidden sections, guest controls, all seven layouts and legacy markup.
- `src/lib/event-section-layout.test.cjs`: existing football/gymnastics arrangements and guest pages.
- `scripts/event-editor-browser.test.cjs`: desktop and phone editing, adding, Undo/restoring, moving, native field editing, explicit saves, reopen and publication.
- `src/app/event/customize-layout.source.test.mjs`: all 14 category modules supply scoped editors and use the shared workspace.

Live Cards, private scans and Sign-up Forms retain their separate product workflows.

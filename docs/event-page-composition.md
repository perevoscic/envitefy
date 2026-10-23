# Shared Event Page sections and layouts

Every authored Event Page category uses `EventEditorWorkspace` with scoped `sectionEditors`. The workspace offers **Page sections** and **Layout**. The shared `EventSectionBuilder` provides adding, editing, moving, removing, restoring and Undo. Section controls also appear on the editable page itself. Phones retain the mounted preview while displaying the editing panel.

Native categories can add information, Photo gallery and Links sections with editable heading/body fields. Their existing sections keep the category's editor fields and native content. Layout thumbnails apply to body sections while preserving the template's hero and artwork; **Template layout** removes the body layout override. Custom generated/uploaded pages use the same builder and their existing full-page layout thumbnails.

## Choosing sections

**Page sections** lists every available section directly in the panel, alongside **On your page** management. Hosts choose an existing category section, an information preset, **Photo gallery**, **Links**, or **Other** without opening a separate Add section chooser. Choosing a section opens its scoped editor; the editing dialog remains available for entering its content. **Other** stays last in the choices.

The information presets are **Schedule**, **Venue & directions**, **Parking & arrival**, **Dress code**, **What to bring**, **Food & drinks**, **Accessibility**, **Travel & hotels**, **Things to do**, **FAQs**, and **Contact host**. Each supplies an editable heading with an empty body. **Photo gallery** lets hosts upload multiple photos with optional captions, and **Links** collects useful websites and resources with editable labels and addresses. Both start empty and retain heading/body fields. **Other** starts with the editable heading **Information** and an empty body. Presets never insert sample event facts, answers, contact information, reservations or guest actions.

When a category already supplies an equivalent native section, the list uses that section and its existing editor instead of adding a second information preset. Hidden sections can be restored with their contents retained. **On your page** keeps editing, reordering and Remove together, with Undo available after changes. Pairing remains available on the editable page. All changes remain in memory until an explicit save.

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

`normalizeEventPageComposition` bounds information sections to 20, headings to 240 characters and bodies to 12,000 characters. Rendering treats text as text. Reordering or hiding does not change category fields, RSVP responses, or source documents. Undoing an addition hides its retained content so the host can restore it.

Photo gallery and Links sections also retain optional `kind: "photos" | "links"`, `photos: [{ url, caption }]` and `links: [{ label, url }]` fields. The kind keeps a section's photo or link editing controls available before any items are added. These fields travel with the section through draft saves, publication, reordering, removal/restoration and Undo. The editor preview and published page use the same photo and link content renderer; uploads and field edits do not save the Event Page automatically.

`useEventPageEditor` includes composition in its in-memory progress baseline, draft snapshot and explicit publication payload. Template drafts also carry `snapshot.pageComposition`; manual drafts use their corresponding snapshot. Published records use the canonical `eventPageComposition`. Saving waits for the existing record and its composition to load.

Custom pages continue storing their sections and layout under `customEventPage.details` and their page design under `customEventPage.design`; they do not acquire a second composition record.

## Rendering and future categories

The public event route wraps native pages in a read-only `EventPageCompositionProvider`. `EventPageSections`, `TemplateBodyLayout`, the birthday body adapter and wedding body adapters use the same `EventSectionCanvas` as editing. Without saved composition, existing guest pages retain their template markup. Football and gymnastics keep their existing section metadata and canvas; new information sections are supplied by composition.

For a future category, supply scoped `sectionEditors` to `EventEditorWorkspace`, wrap the native body with `EventPageSections` (or the existing `TemplateBodyLayout`), and use stable section IDs in both editor and guest renderer. Keep the hero and footer outside the body. Use the shared save lifecycle rather than saving when a control changes.

`TemplateBodyLayout` reserves equal responsive page gutters of at least 16px around every body arrangement, including a single visible section and narrow desktop previews. Single-section normalization fills the space inside those gutters; retain the template's panel padding and full-width hero artwork.

## Verification

- `src/lib/event-page-composition.test.cjs`: normalization, safe text, saved order, hidden sections, guest controls, all seven layouts and legacy markup.
- `src/lib/event-information-section-presets.test.cjs`: informational presets, native identity and heading matching, retained hidden sections and independent functional sections.
- `src/lib/event-section-extras.test.cjs`: safe photo/link normalization, empty typed sections, and native/custom save round trips.
- `src/lib/event-section-layout.test.cjs`: existing football/gymnastics arrangements and guest pages.
- `scripts/event-editor-browser.test.cjs`: desktop and phone editing, adding, Undo/restoring, moving, native field editing, explicit saves, reopen and publication.
- `scripts/event-section-layout-browser.test.cjs`: rendered section widths, centered Minimal/Poster layouts, toolbar containment and responsive columns in editing and guest views. The shared canvas needs an explicit width because inline-size containment and auto margins otherwise collapse centered grid items; responsive rules target its descendants so narrow previews also work on desktop.
- `src/app/event/customize-layout.source.test.mjs`: all 14 category modules supply scoped editors and use the shared workspace.

Live Cards, private scans and Sign-up Forms retain their separate product workflows.

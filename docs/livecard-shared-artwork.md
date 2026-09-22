# Shared Live Card and Invite artwork

New guided designs use a text-free 2:3 background and editable text. The introductory headline and title appear in both formats; event details appear on the downloadable invitation. Live Card guest buttons stay over the bottom of the artwork and never enter the image export.

## Implementation

- `/api/livecard-builder/design` authenticates and throttles requests, selects a coordinated font/palette with OpenAI, generates one background, checks it against the existing text-free artwork contract, and converts/validates the raster through FFmpeg WebP. A failed visual check does not silently request another image.
- `sharedDesign` version 1 stores the background URL, bundled font choice and palette. `liveCardBuilder` version 3 retains the editable form. The background key excludes title, headline introduction, format, dates, locations and other event facts.
- `shared-card-design.ts` derives current event-local wording and measured text layout. `shared-card-canvas.ts` uses the same bundled fonts, line breaks and positioning for preview and download. Overflow is reported instead of truncating facts.
- Explicit saves store the background and a composed WebP snapshot for existing dashboard/share image consumers. Drafts can still save incomplete invitation wording. Generation and format switching do not create a draft.
- Public and owner card views render from the stored background and current invitation metadata. Download invitation composes the current text with that background. The builder checks Overview wording before downloading; published content has already passed the save review.
- Version 1/2 guided records keep their existing images and old invalidation rules. Create editable design explicitly creates a fresh background; it does not pretend to extract text layers from old baked artwork. Layered cards route owner design editing to the guided builder and are protected from the legacy raster edit API.

## Verification

The guided browser test exercises concurrent edits during generation, explicit saves, reload, corrections, one-image format switching, proofread failures, latest-time download text, and mobile/landscape artwork ratios and button placement. Unit tests cover layout overflow, long titles, safe design parsing, background invalidation, current facts, and saved metadata restoration. Existing creation fact, RSVP, calendar, owner-preview and authentication suites remain separate regression gates.

Verified locally on September 22, 2026: application typecheck, targeted Biome lint, 575 creation fact regressions, guided unit/access tests, the guided browser flow at desktop/390px/320px/landscape, and all four existing creation browser suites. One real OpenAI background passed the visual check and FFmpeg conversion; its browser preview/export also passed. The VS Code diagnostics bridge was unavailable. No deployment was performed.

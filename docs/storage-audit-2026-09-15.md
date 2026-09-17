# Envitefy storage audit — September 15, 2026

## Completed cleanup

After storage access was restored, the authorized **113 generated/edited PNG originals with display WebPs** were downloaded, backed up, fully decoded and compared with their replacements. Visual review confirmed matching artwork. All 113 PNGs were then deleted with ETag conditions after a fresh reference scan found no old PNG pointers to update.

This operation freed **309,818,549 bytes (309.82 MB)**. The immediately preceding live inventory contained **1,228 objects / 889,755,509 bytes**; the final inventory contained **1,115 objects / 579,936,960 bytes (579.94 MB)**. Other changes between the initial audit below and this pre-deletion snapshot are outside this operation.

All **113 display WebPs and 113 thumbnails** remain unchanged. The **75 originals with only thumbnails / 209.90 MB** remain. Original PNG backups are retained locally outside the repository. See [the completed cleanup record](../artifacts/storage-cleanup-2026-09-15/README.md), its exact replacement mappings, backup verification and deletion receipt.

## Initial findings — before cleanup

Initial read-only inventory of the Vercel Blob store configured in this checkout's `.env` (historical, superseded by the completed cleanup above):

- **1,258 files; 927,883,348 bytes (927.88 MB / 884.90 MiB).**
- PNG files, including uppercase `.PNG`: **291 files; 719,798,829 bytes (77.57%).**
- WebP files: **919 files; 160,322,872 bytes.**
- Remaining formats: **48 files; 47,761,647 bytes.**

All MB figures use decimal units.

| Stored content | Files | MB |
| --- | ---: | ---: |
| Generated invitation PNG originals (`studio-generated-image.png`) | 162 | 448.27 |
| Edited invitation PNG originals (`event-card-edit.png`) | 26 | 71.45 |
| Marketing email images (`event-media/admin-email-*`) | 78 | 123.29 |
| Other event media | 954 | 243.72 |
| Retired admin marketing studio assets | 10 | 26.58 |
| Discovery source files | 20 | 11.55 |
| Private scan originals | 7 | 3.01 |
| Profile media | 1 | 0.02 |

April and May uploads account for **610.40 MB**, approximately 66% of this inventory.

The separately configured Supabase Postgres database measures **132.39 MB**. Its largest tables are `event_history` (63.82 MB) and `event_discoveries` (34.27 MB), including associated storage and indexes.

## Why it accumulates

1. `src/lib/media-upload.ts`, `processImageUpload`, stores three image variants: WebP display, WebP thumbnail, and the complete original. Retained source files occupy **586.10 MB**. All 249 source files have at least one WebP sibling, but a thumbnail is not a full-quality replacement.
2. `src/lib/studio/generation-response.ts` uploads generated invitation PNGs through that same pipeline. Some flyer modes intentionally return the original's URL.
3. `src/lib/admin/email-generator.ts`, `uploadStillImageAsset`, uploads generated email images directly as PNG.
4. Event deletion in `src/lib/event-cleanup.ts` deletes references discovered in selected event fields; it does not inventory and reconcile every upload variant in the store. Unreferenced source/thumbnail siblings can therefore survive deletion of their display file. Blob deletion errors are logged rather than retried durably by this path.
5. `docs/admin-content-studio.md` explicitly retained historical generated media when the old studio was retired.

## Cleanup candidates — not a deletion manifest

The audit extracted file references from all public database tables, then checked literal Blob path references in `src`, `public`, `templates`, `scripts`, and `docs`.

- **945 files / 742.46 MB** had no direct reference in those sources.
- All **188 generated/edited invitation PNG originals / 519.72 MB** were among these candidates.
- Of those 188 originals, 113 have a `display.webp` sibling; 75 have only a `thumb.webp` sibling. Do not treat thumbnails as verified original replacements.
- Database-only scanning would miss hardcoded site/showcase/email artwork. The repository check was included to retain those references.

Absence of a reference is not proof that deletion is safe. Previous deployments, distributed email HTML, external links and unsaved browser state were not exhaustively checked. The initial audit made no remote changes; the subsequent authorized cleanup is recorded above.

Recommended next work: validate abandoned generated assets, preserve any required originals at full dimensions in verified WebP format, update references where needed, and reconcile upload variants so this does not recur. Preserve user-supplied originals required by editing workflows.

## Initial quota limitation — resolved for this cleanup

The supplied project URL, https://vercel.com/nexa-lyunxs-projects/envitefy, redirects to sign-in in the available browser. The team's actual plan, complete store inventory, production environment mapping and warning meter could not be verified there. These measurements describe the store and database configured locally.

Vercel's current documentation lists a 1 GB-month Blob storage allowance for Hobby and measures storage as a monthly average. Instantaneous stored bytes do not establish which monthly usage meter triggered a warning: https://vercel.com/docs/vercel-blob/usage-and-pricing.

Detailed inventory and candidate paths are in `/private/tmp/envitefy-blob-inventory-2026-09-15.json` and `/private/tmp/envitefy-blob-cleanup-candidates-2026-09-15.json`. These contain file metadata only, without credentials.

## Initial follow-up: preview access — subsequently restored

The first original-image review received **HTTP 403, `Your store is blocked`**, including reads through the official SDK. Metadata listing worked but content reads were blocked. The user subsequently lifted the limit; the completed verification, backup and cleanup are recorded above. See `generated-invitation-originals-2026-09-15.md` for the initial 188-original inventory and replacement groups.

# Authorized PNG cleanup — pending Vercel access

The user authorized backing up and verifying the **113 generated invitation PNG originals with existing display WebPs**, updating their image references to the correct replacement paths, and then removing only those PNGs.

## Completed checks

- Refreshed the live Blob inventory: all 113 originals and all 113 display WebPs remain listed.
- Original bytes to remove after verification: **309,818,549 (309.82 MB)**.
- Prepared exact original path, replacement path, proxy URL, Blob URL, current sizes and ETags in `replacement-plan.json`.
- Fresh read-only checks across **67 public database tables** found **zero rows containing the generated-original filenames**.
- A source/assets/templates/scripts check found **zero references to these specific original paths**, including URL-encoded and slash-escaped forms. No application placeholder currently found needs rewriting.

## Blocker

Vercel returns HTTP 403 for the PNG and its replacement WebP. The signed-in dashboard confirms:

> You have reached your usage limits for this store using the Hobby plan. Access resumes on 9/16/26.

Store: https://vercel.com/nexa-lyunxs-projects/envitefy/stores/blob/store_jGkRBPQY79wXQGAh/manage-blobs

**No image bytes were backed up, no references were changed, and no PNGs were deleted.** Listed metadata is not a verified image backup or a verified replacement.

## Resume within the existing authorization

1. Check that Blob reads have resumed, then refresh the exact 113-entry scope. Do not expand the deletion set to the 75 originals with only thumbnails or to any other assets.
2. Download all 113 original PNGs into the local backup directory recorded in the plan, outside the deployed application and Git source. Verify PNG signatures, complete decoding, dimensions, byte counts and SHA-256 hashes; save the hashes in a backup manifest.
3. Download and decode each mapped display WebP. Verify the intended artwork, dimensions and readable text against its original. Preserve the local PNG backups as explicitly requested. If a display is insufficient, preserve original-size artwork in a verified WebP replacement using FFmpeg before removing the PNG.
4. Recheck current database and application references immediately before mutation. Apply only exact old-to-new mappings, preserving the surrounding URL/path form and unrelated event data. Update matching media MIME/size/dimension metadata as needed. Reconcile history/dashboard caches if any records change. Earlier checks found no matching references, so do not manufacture changes to unrelated placeholders.
5. Only after backups, replacement checks and reference updates succeed, delete the exact verified PNG paths via the authorized storage API. Re-read the inventory to confirm those originals are gone and the display/thumbnail paths remain. Record actual reclaimed bytes and any skipped files.

Backing up and deleting the specified PNGs is already authorized. Restoring storage access is the outstanding prerequisite; no upgrade or billing change was authorized. No scheduled automation was created.

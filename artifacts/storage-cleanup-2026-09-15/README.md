# Authorized PNG cleanup — completed

The user authorized backing up and verifying the **113 generated invitation PNG originals with existing display WebPs**, updating any references, and removing those exact PNGs. Storage access resumed after the user lifted the limit.

## Result

- **113 PNG originals deleted: 309,818,549 bytes (309.82 MB).**
- Live store immediately before deletion: **1,228 objects / 889,755,509 bytes**.
- Live store after deletion: **1,115 objects / 579,936,960 bytes**.
- All **113 display WebPs and 113 thumbnails** remain with unchanged sizes and ETags.
- Three display WebPs were additionally read directly from origin after deletion, decoded successfully and matched their backup SHA-256 hashes.
- The other **75 generated originals / 209,903,534 bytes** remain; they only have thumbnails and were outside this cleanup's scope.

## Verification and references

All 113 PNG originals and their 113 display WebPs were backed up outside the repository. File signatures, full decoding, dimensions, transparency, byte counts and SHA-256 hashes were checked. Every pair preserved dimensions and passed pixel comparison. All originals were visually reviewed in six contact sheets, with the six lowest-scoring pairs compared side by side. All 226 backup hashes were checked again immediately before deletion.

Fresh read-only checks across **67 public database tables** and relevant application/assets/templates/scripts files found **zero references to the original PNG paths**. No placeholder or database record needed rewriting. Exact old-to-new mappings, including proxy paths and Blob URLs, are retained in `replacement-plan.json`.

Deletion used one exact original pathname at a time, conditioned on its recorded ETag. The final inventory confirmed that all 113 originals were absent and all 226 display/thumbnail objects remained unchanged. No other assets were deleted by this operation.

## Files

- `replacement-plan.json`: exact 113 mappings and final status.
- `backup-verification.json`: backup paths, hashes, dimensions and comparison results.
- `deletion-receipt.json`: exact deletions, timestamps and before/after measurements.
- `inventory-immediately-before-deletion.json` / `inventory-after.json`: live storage snapshots around deletion.
- `database-reference-check.json` / `repository-reference-check.json`: final reference checks.
- `verify-and-back-up.cjs` / `check-references.mjs` / `finalize-cleanup.cjs`: operation scripts; **cleanup is already complete, do not rerun deletion**.

Local backup and inspection gallery:

`/Users/rj/.codex/visualizations/2026/09/15/01a0a755-dae4-7381-8ff0-67fe7969d121/storage-backup-2026-09-15/inspection-gallery.md`

Original PNGs, retained WebP copies and manifests remain in that backup directory as explicitly requested. These image bytes are outside the deployed app and Git source. No automatic repository-to-Blob mirror was configured.

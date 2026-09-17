# WebP storage policy — September 15, 2026

## Implemented for new app image uploads

The shared media upload pipeline converts PNG, JPG and JPEG inputs to WebP **before any original is uploaded**. The app retains no PNG/JPEG copy from this pipeline. This covers header/attachment uploads, birthday artwork, generated invitations, edited cards, template media and generated email stills, including callers of the public/private binary upload helpers.

Conversion uses FFmpeg's `libwebp` encoder at quality 85 and compression level 6. EXIF orientation is normalized. Verification checks decoding, dimensions and transparency before storage. An encoder/validation failure stops the upload; it cannot fall back to uploading the PNG/JPEG. Temporary image buffers stay in memory and no local original files are created.

- Display images keep the existing maximum width of 2400 pixels, without enlargement.
- A full-resolution WebP source is stored only when the display is smaller than the input. Otherwise `stored.source` points to the same WebP as `stored.display`.
- Thumbnails remain WebP and are fully decoded before upload.
- Download/attachment filenames, MIME types, byte counts and dimensions describe the retained WebP. The original name/type/size fields are provenance only.
- Existing WebP inputs are reused when resizing/orientation changes are unnecessary, avoiding repeated lossy compression.
- Animated inputs requiring transcoding are rejected instead of silently losing animation.
- The relevant API function bundles explicitly include FFmpeg.

## Scope and rollout

These are repository changes; production behavior changes when this code is deployed. This task has not deployed the checkout.

Encrypted, owner-only original documents and PDFs retain their existing document-storage policy. The encrypted `.bin` storage path does not pass readable source images to Blob. Retired marketing-run archives and local build/generated assets are separate from the shared upload pipeline.

Existing stored images require a separate migration: verify replacements, update current references and preserve delivery for already-sent emails before deleting originals. The most recent post-cleanup inventory contains **194 PNG/JPEG objects / 413,764,366 bytes**, all under `event-media/`: 130 source originals, 44 email images and 20 other images. These were not deleted by the future-upload change. The previously completed 113-PNG cleanup and its local backups remain recorded in `artifacts/storage-cleanup-2026-09-15/`.

## Validation

- Upload behavior tests exercise real FFmpeg conversion with mocked Blob writes: PNG/JPEG, transparency, EXIF orientation, large full-resolution sources, WebP reuse, binary/email upload enforcement and failure handling.
- `npm run test:dependencies` includes these storage tests alongside existing upload/PDF/media checks.
- Scan-artwork tests verify full-size encoded WebPs and transparency.
- Biome lint passes on the changed files.
- The VS Code diagnostics bridge was unavailable. A direct TypeScript check reported existing errors elsewhere in the checkout, with no errors in the changed files.

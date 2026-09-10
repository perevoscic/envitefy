# Review, repair and delivery

Use for each requested export. Review actual media, not only source code or a successful process exit.

## Engine review

`node engine/cli.mjs review <campaign> --format <format>` checks dimensions, frame rate, duration and full FFmpeg decode. It extracts first frames, both sides of cuts, scene midpoints and the final frame as WebP review images in out/<campaign>/review-<format>-v<N>/. technical.json records measurable results. review.json starts pending; automation does not fill creative judgments.

Inspect these images, play the full export, and listen to its audio. Use available media review tools where helpful, but distinguish an automated assessment from direct observation. Transcription alone cannot prove brand pronunciation. If a review capability is unavailable, leave that check pending and state the exact remaining check.

Record evidence for these review categories in review.json:

| Check | Evidence to record |
| --- | --- |
| story-and-motion | Opening clarity, pacing, connected identities/wardrobe/props, hands and contact, first frames and cut continuity; include times for observed defects/fixes. |
| audio-and-pronunciation | Listen to dialogue/music transitions and every Envitefy occurrence against the approved recording. Note truncation, masking or clipping. If no brand speech or no audio, explain the applicable scope. |
| brand-and-copy | Exact supplied logo and visible Envitefy spelling; CTA, readable text, no accidental generator lettering. |
| captions-and-timing | Actual words and timing, safe placement, readable line lengths; action copy matches the visible product state. |
| product-proof | Demonstrated route and action support the claim. Samples/illustrations are represented accurately; no real RSVP submitted during capture. |
| format-and-framing | Inspect this actual aspect ratio for text fit, cropped faces/hands, product controls, caption/logo overlap and safe margins. |

Use status `pass` or `not-applicable` with specific notes, plus the reviewer identity. Preserve the export SHA-256. Then run `record-review <campaign> --format <format>`. It requires passing technical checks and completed evidence, records editor-reviewed status, and adds the format under `engine` in deliverables.json while preserving legacy records. This never means user-approved.

If a check fails, correct the affected shot/edit, render a new version and review that new file. Keep prior exports and their evidence. Do not fill checks based on intentions or mark an entire campaign finished while a requested format is still pending.

## Handoff

Deliver the playable MP4 and direct absolute file link for each requested format. Include captions, thumbnails or post copy when requested. Update the campaign index, production notes and feedback with actual completion and remaining work. Track user approval only when explicitly given. Reusable preference changes go into STUDIO-GUIDE.md; scene-specific corrections stay with their campaign.

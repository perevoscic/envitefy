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

## Release readiness for new videos

The engine's record-review command records producer review only and leaves readyToPublish false. New videos, including custom renders, follow [quality.md](quality.md). Use prepare-release for the exact MP4, complete producer and independent AI inspection in the background, and present the polished file as ready for the user's review. Record their explicit approval in userApproval before release. Recheck release-status immediately before a ready-to-publish handoff. Missing inspection, absent user approval, changed media or serious defects prevent release. Previews remain available with truthful pending checks. Legacy campaign records retain their original requirements.

## Handoff

Present the playable MP4 and direct absolute link for each requested format, with version/duration, one sentence of creative intent and any precise remaining limitation. Ask for approval or changes in ordinary language; Codex maintains the detailed review records. Use [reviewer-brief.md](reviewer-brief.md) for this handoff. Include requested captions, thumbnails or copy. Update campaign notes, feedback and index truthfully; record user approval only when explicitly given for the presented file(s). Reusable preferences go into STUDIO-GUIDE.md; scene-specific corrections stay with the campaign.

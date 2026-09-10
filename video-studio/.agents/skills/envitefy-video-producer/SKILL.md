---
name: envitefy-video-producer
description: Create, revise, review, and export Envitefy marketing videos using the local campaign engine, brand preferences, real product demonstrations, and saved campaign history. Also prepare captions and social copy for those videos.
---

# Envitefy Video Producer

Turn the user's brief into a finished, reviewed video using this studio. For a copy-only request, produce the requested copy without rendering or generating media.

## Load the right context

The studio root is three directories above this skill folder. Read its [AGENTS.md](../../../AGENTS.md), [STUDIO-GUIDE.md](../../../STUDIO-GUIDE.md), and [campaign index](../../../projects/README.md). Paths in the production reference are relative to that studio root unless stated otherwise. Resolve from the skill's actual location, not a remembered drive letter.

For existing work, load only that campaign's brief, notes, feedback, and deliverables. Identify whether the user wants a new concept, a revision, an aspect-ratio adaptation, or accompanying copy. Preserve prior feedback when revising. A new campaign should not inherit the previous cast, duration, or narrated structure by accident.

## Choose the production path

The required model for new raster artwork and image edits is **`gpt-image-2.5-flare`** (user preference, September 10, 2026). Select the exact model explicitly, including for cast/reference frames used by the video provider. Follow the [explicit image-model workflow](references/engine.md#explicit-image-model) and record actual request provenance. Do not claim model enforcement from prompt text alone or silently substitute another model. Motion footage, narration and music retain their respective providers.

- For a new film, read [creative direction](references/creative-direction.md), then [the campaign engine](references/engine.md). Develop the story before selecting generation tools. The agent directs and reviews; the engine runs repeatable operations and records their state.
- For an engine campaign, start with `node engine/cli.mjs status <campaign>`. Read its `production.json` and current feedback before changing a shot. Resume known jobs; retain unchanged assets and approved speech.
- For an older campaign without `production.json`, use [the existing production reference](references/production.md) and its campaign-specific scripts. Adopt it only when useful, with `init --existing`; that creates a separate production plan and preserves existing briefs and compositions. Do not feed a legacy brief directly into the new engine.
- For exports, read [review and delivery](references/review.md). A successful render or automated check does not establish creative quality or user approval.

## Develop and produce

1. Save the request and concrete creative choices in `projects/<campaign>/brief.json`. [The campaign brief template](../../../templates/campaign-brief.json) is a planning record. For engine campaigns, `production.json` is the executable contract for assets, dependencies, shots, timing, and layouts. Use the engine's init command; populate both from the natural-language request. Keep revisions under the existing slug.
2. Establish the hook, story, product proof, audio direction, CTA, and requested formats. Check the relevant feature in the parent marketing catalog and actual UI. Infer routine choices; ask only about information that materially changes the result.
3. Use the installed Remotion skills for relevant creation, markup, captions, preview, and render work, and ImageGen for raster generation/editing. Engine tasks support local imports, demo captures, ElevenLabs speech, and Google video/music jobs. Verify provider models and pricing when selecting them. Set conservative per-task cost reservations and a campaign budget from the user's scope before paid submissions; respect explicit spending limits. Reuse existing paid jobs even when new submissions are disabled. Never turn an ambiguous response into a fresh paid request.
4. Follow the mandatory [brand pronunciation standard](../../../../ENVITEFY_BRAND.md) and the user's supplied audio reference: approximately **in-VY-tih-fy**, **/ɪnˈvaɪtɪfaɪ/**, four naturally connected syllables with stress on VY. Include the standard's complete direction or supported pronunciation controls for every spoken brand occurrence, then compare the result with the recording. The user approved this pronunciation on September 9, 2026; the [durable audio manifest](../../../assets/brand/audio/pronunciation.json) identifies the accepted reference and narrator take. Reuse an approved take when its line is unchanged. Use the shared helper for TTS metadata and native dialogue direction; transcription alone does not prove pronunciation. Keep visible branding spelled Envitefy. Generate/select assets and sound with continuity within the campaign and fresh art direction for new campaigns. Keep source media, prompts, selected takes and provider job state together. Check a short sample when selecting a new voice.
5. Assemble in Remotion with editable text, real demo captures, synchronized card-action explanations, and the exact brand PNGs. For another aspect ratio, adjust composition and shot framing deliberately.

   For newly generated raster artwork, finish the parent project's FFmpeg WebP conversion, verification, reference updates, and exact-original cleanup before importing the final asset. Record its prompt/provenance. Never delete supplied brand assets or user reference images as generated originals.
6. Review and export the requested formats. Inspect first frames, cut boundaries, hands/props/faces, product state and caption alignment, text fit, CTA, and audio. Record actual checks and unresolved issues. Repair isolated bad shots before replacing coherent sequences.
7. Save versioned exports and all supporting output files in `out/<campaign>/`, including intermediate renders, thumbnails, contact sheets, and review images. Create this directory before rendering or running FFmpeg. Never write video-specific files directly into `out/`; revisions and alternate formats stay in the original video's folder. Set each composition's `calculateMetadata().defaultOutName` to `<campaign>/<filename-without-extension>` for Studio and CLI defaults, and include the folder in explicit output paths. Update campaign notes, feedback, deliverables, and index. Deliver the playable file and link. Preserve lasting user preferences in the studio guide during the same task; keep one-off fixes in campaign feedback.

Creating a video includes its necessary local production and export. It does not itself request social posting, account-plan purchases, or submitting real customer RSVPs. Follow the user's actual scope when any of those are requested separately.

## Campaign handoff

Before ending a task, leave enough on disk for a fresh task to resume: current brief, selected assets, any in-flight provider job identifiers in private records, exact composition and export names, completed feedback, and remaining work. Keep credentials out of those records. Do not mark a video as reviewed or user-approved unless that happened.

The engine and renderer stay local and ignored under the current Git preference. This skill and its references preserve the workflow, but a fresh clone needs the local production runtime and assets restored before rendering. Check that `engine/cli.mjs` exists rather than assuming the guidance installs it.

Useful requests this skill should handle:
- “Create a 30-second TikTok for parents planning birthday parties. Make it funny and show how guests RSVP.”
- “Make Host Mode square for Instagram, keeping the single-hand bowl fix.”
- “The narrator sounds artificial. Try a more natural delivery without changing the product demo.”
- “Write a Facebook Reel caption and Reddit post for the latest square video.”

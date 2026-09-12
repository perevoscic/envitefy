---
name: envitefy-video-producer
description: Create, revise, review, and export Envitefy marketing videos using the local campaign engine, brand preferences, real product demonstrations, and saved campaign history. Also prepare captions and social copy for those videos.
---

# Envitefy Video Producer

Turn the user's brief into a finished, reviewed video using this studio. For a copy-only request, produce the requested copy without rendering or generating media.

**Provider rule (September 12, 2026, clarified): OpenAI for generated assets and substantive AI work; Remotion for animation, editing, composition and rendering.** Use OpenAI-generated stills, existing media and real demo captures in Remotion instead of defaulting to Google-generated footage. Gemini is allowed only for small text calls capped at 4,000 input characters, 256 output tokens and one candidate on Flash text models, without media/tools/cached context or bulk processing. Google video/image generation, Lyria music and uploaded-media analysis/transcription/review stay blocked. Follow the [standing provider rule](../../../STUDIO-GUIDE.md#openai-and-remotion-gemini-for-small-text-calls-only--september-12-2026); it supersedes the initial blanket ban and historical Google recovery instructions. New studio network code must use `scripts/provider-policy.mjs`; never bypass it or silently substitute Google when an OpenAI capability is unavailable.

For every social post, deliver **at least 10 distinct, relevant hashtags and/or tags per post and platform**, prioritizing the most popular options supported by current evidence. Follow the [social post copy standard](../../../STUDIO-GUIDE.md#social-post-copy) for popularity research, formatting, and field limits.

## Load the right context

The studio root is three directories above this skill folder. Read its [AGENTS.md](../../../AGENTS.md), [STUDIO-GUIDE.md](../../../STUDIO-GUIDE.md), and [campaign index](../../../projects/README.md). Paths in the production reference are relative to that studio root unless stated otherwise. Resolve from the skill's actual location, not a remembered drive letter.

For existing work, load only that campaign's brief, notes, feedback, and deliverables. Identify whether the user wants a new concept, a revision, an aspect-ratio adaptation, or accompanying copy. Preserve prior feedback when revising. A new campaign should not inherit the previous cast, duration, or narrated structure by accident.

## Choose the production path

The required model for new raster artwork and image edits is **`gpt-image-2.5-flare`** (user preference, September 10, 2026). Select the exact model explicitly, including for cast/reference frames. Follow the [explicit image-model workflow](references/engine.md#explicit-image-model) and record actual request provenance. Do not claim model enforcement from prompt text alone or silently substitute another model. Animate and assemble assets in Remotion; all modalities must respect the September 12 provider rule.

- For a new film or substantial story revision, use [Envitefy Ad Creative](../envitefy-ad-creative/SKILL.md) for concepts, script/storyboard, art direction, and creative critique. Then read the [production handoff](references/creative-direction.md), [future-video quality](references/quality.md), and [campaign engine](references/engine.md). Continue the same task through production and delivery; the creative handoff is not the finished video. Simple trims, format adaptations, caption fixes, and voice adjustments use the saved brief directly.
- For an engine campaign, start with `node engine/cli.mjs status <campaign>`. Read its `production.json` and current feedback before changing a shot. Resume known jobs; retain unchanged assets and approved speech.
- For an older campaign without `production.json`, use [the existing production reference](references/production.md) and its campaign-specific scripts. Adopt it only when useful, with `init --existing`; that creates a separate production plan and preserves existing briefs and compositions. Do not feed a legacy brief directly into the new engine.
- For exports, read [review and delivery](references/review.md). A successful render or automated check does not establish creative quality or user approval.

## Directed production path

For new films and creative rebuilds, read [directed workflow](references/directed-workflow.md). Use the schema-2 shared edit via `init --directed`; preserve legacy campaigns and paid-job recovery until explicitly adopting them. The stage order is direction, complete timed storyboard with temporary sound, difficult performance/action pilots, complete rough cut, finishing and exact-file review. A cold rough-cut reviewer must be a separate agent with `fork_turns: "none"`, receiving only the neutral packet and media before saving an unaided interpretation. Technical success and enthusiastic automated prose do not establish convincing acting, comedy or product credibility.

## Develop and produce

1. Save the request and concrete creative choices in `projects/<campaign>/brief.json`. [The campaign brief template](../../../templates/campaign-brief.json) is a planning record. For directed engine campaigns, `production.json` owns asset tasks and dependencies; `edit.json` alone owns timing, layouts, selected picture and independent sound clips. Generated manifests and review markers derive from it. Legacy schema-1 campaigns retain their existing contract. Use the engine's init command; populate both from the natural-language request. Keep revisions under the existing slug.
2. Use the ad creative skill's selected brief and `creative-development.md` for new concepts; preserve the brief and feedback for production-only revisions. Resolve the [handoff checks](references/creative-direction.md) and verify the relevant feature in the product catalog and actual UI before producing dependent assets. Translate creative scenes into the execution plan without inventing a competing script. Infer routine choices; ask only about information that materially changes the result.
3. Use the installed Remotion skills for animation, editing, markup, captions, preview and rendering, and OpenAI ImageGen for raster generation/editing. Engine tasks support local imports, demo captures and the existing ElevenLabs speech path; historical Google video/music tasks remain blocked. Use OpenAI for substantive AI work and preserve existing local media. Only occasional bounded text checks may use Gemini through the shared provider guard. Verify authorized provider models and pricing when selecting them. Set conservative per-task cost reservations and a campaign budget from the user's scope before paid submissions; respect explicit spending limits. Resume only permitted providers; historical Google jobs do not authorize new API access. Never turn an ambiguous response into a fresh paid request.
4. Follow the mandatory [brand pronunciation standard](../../../../ENVITEFY_BRAND.md) and the user's supplied audio reference: approximately **in-VY-tih-fy**, **/ɪnˈvaɪtɪfaɪ/**, four naturally connected syllables with stress on VY. Include the standard's complete direction or supported pronunciation controls for every spoken brand occurrence, then compare the result with the recording. The user approved this pronunciation on September 9, 2026; the [durable audio manifest](../../../assets/brand/audio/pronunciation.json) identifies the accepted reference and narrator take. Reuse an approved take when its line is unchanged. Use the shared helper for TTS metadata and native dialogue direction; transcription alone does not prove pronunciation. Keep visible branding spelled Envitefy. Generate/select assets and sound with continuity within the campaign and fresh art direction for new campaigns. Keep source media, prompts, selected takes and provider job state together. Check a short sample when selecting a new voice.
5. Assemble in Remotion with editable text, real demo captures, synchronized card-action explanations, and the exact brand PNGs. For another aspect ratio, adjust composition and shot framing deliberately.

   For newly generated raster artwork, finish the parent project's FFmpeg WebP conversion, verification, reference updates, and exact-original cleanup before importing the final asset. Record its prompt/provenance. Never delete supplied brand assets or user reference images as generated originals.
6. Handle quality work in the background using [review and delivery](references/review.md) and the [quality workflow](references/quality.md): internal concept/shot review, a separate AI review subagent for rough-cut critique and final verification, timestamped repairs, and technical/perceptual checks for every exact export. The user is the final human reviewer; do not require intermediate human approvals or hire an editor. Present polished playable previews with a concise review handoff, then record the user's actual approval or requested changes. Keep unobserved checks pending and disclose precise gaps. Apply the exact-file release gate to every format, including custom renderers; internal completion never grants user approval.
7. Save versioned exports and all supporting output files in `out/<campaign>/`, including intermediate renders, thumbnails, contact sheets, and review images. Create this directory before rendering or running FFmpeg. Never write video-specific files directly into `out/`; revisions and alternate formats stay in the original video's folder. Set each composition's `calculateMetadata().defaultOutName` to `<campaign>/<filename-without-extension>` for Studio and CLI defaults, and include the folder in explicit output paths. Update campaign notes, feedback, deliverables, and index. Deliver the playable file and link. Preserve lasting user preferences in the studio guide during the same task; keep one-off fixes in campaign feedback.

Creating a video includes its necessary local production and export. It does not itself request social posting, account-plan purchases, or submitting real customer RSVPs. Follow the user's actual scope when any of those are requested separately.

## Campaign handoff

Before ending a task, leave enough on disk for a fresh task to resume: current brief, creative-development notes when a concept was developed, selected assets, any in-flight provider job identifiers in private records, exact composition and export names, completed feedback, and remaining work. Keep credentials out of those records. Do not mark a video as reviewed or user-approved unless that happened.

The engine and renderer stay local and ignored under the current Git preference. This skill and its references preserve the workflow, but a fresh clone needs the local production runtime and assets restored before rendering. Check that `engine/cli.mjs` exists rather than assuming the guidance installs it.

Useful requests this skill should handle:
- “Create a 30-second TikTok for parents planning birthday parties. Make it funny and show how guests RSVP.”
- “Make Host Mode square for Instagram, keeping the single-hand bowl fix.”
- “The narrator sounds artificial. Try a more natural delivery without changing the product demo.”
- “Write a Facebook Reel caption and Reddit post for the latest square video.”

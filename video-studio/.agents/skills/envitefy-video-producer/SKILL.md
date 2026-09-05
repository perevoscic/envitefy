---
name: envitefy-video-producer
description: Create, revise, and export Envitefy marketing videos with the existing Video Studio pipeline, saved brand preferences, real product demos, and campaign history. Also prepare captions and social post copy for those videos.
---

# Envitefy Video Producer

Turn the user's brief into a finished, reviewed video using this studio. For a copy-only request, produce the requested copy without rendering or generating media.

## Load the right context

The studio root is three directories above this skill folder. Read its [AGENTS.md](../../../AGENTS.md), [STUDIO-GUIDE.md](../../../STUDIO-GUIDE.md), and [campaign index](../../../projects/README.md). Paths in the production reference are relative to that studio root unless stated otherwise. Resolve from the skill's actual location, not a remembered drive letter.

For existing work, load only that campaign's brief, notes, feedback, and deliverables. Identify whether the user wants a new concept, a revision, an aspect-ratio adaptation, or accompanying copy. Preserve prior feedback when revising. A new campaign should not inherit the previous cast, duration, or narrated structure by accident.

## Develop and produce

1. Save the request and concrete creative choices in `projects/<campaign>/brief.json`. [The campaign brief template](../../../templates/campaign-brief.json) is a planning record, not a renderer/API schema. Fill the relevant fields; choose a new lowercase slug for new work. Keep revisions under the existing slug.
2. Establish the hook, story, product proof, audio direction, CTA, and requested formats. Check the relevant feature in the parent marketing catalog and actual UI. Infer routine choices; ask only about information that materially changes the result.
3. For media work, read [references/production.md](references/production.md). Use the installed Remotion skills for the relevant creation, markup, captions, preview, or render work, and ImageGen for raster generation/editing. Use the available video provider for footage; the reference documents this studio's working scripts and their limits.
4. Generate/select assets and sound with continuity within the campaign and fresh art direction for new campaigns. Keep source media, prompts, selected takes, and provider job state together. Check a short voice sample before committing a full new narration track. A music-led treatment is available when it suits the concept.
5. Assemble in Remotion with editable text, real demo captures, synchronized card-action explanations, and the exact brand PNGs. For another aspect ratio, adjust composition and shot framing deliberately.
6. Review and export the requested formats. Inspect first frames, cut boundaries, hands/props/faces, product state and caption alignment, text fit, CTA, and audio. Record actual checks and unresolved issues. Repair isolated bad shots before replacing coherent sequences.
7. Save versioned exports and update campaign notes, feedback, deliverables, and index. Deliver the playable file and link. Preserve lasting user preferences in the studio guide during the same task; keep one-off fixes in campaign feedback.

Creating a video includes its necessary local production and export. It does not itself request social posting, account-plan purchases, or submitting real customer RSVPs. Follow the user's actual scope when any of those are requested separately.

## Campaign handoff

Before ending a task, leave enough on disk for a fresh task to resume: current brief, selected assets, any in-flight provider job identifiers in private records, exact composition and export names, completed feedback, and remaining work. Keep credentials out of those records. Do not mark a video as reviewed or user-approved unless that happened.

Useful requests this skill should handle:
- “Create a 30-second TikTok for parents planning birthday parties. Make it funny and show how guests RSVP.”
- “Make Host Mode square for Instagram, keeping the single-hand bowl fix.”
- “The narrator sounds artificial. Try a more natural delivery without changing the product demo.”
- “Write a Facebook Reel caption and Reddit post for the latest square video.”

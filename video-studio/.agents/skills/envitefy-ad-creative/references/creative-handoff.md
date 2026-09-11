# Creative handoff to production

Use when a concept needs a script/storyboard or will become a finished video. Paths in the tables are relative to the studio root. Match the requested level of detail for written work.

## Existing campaign records

For production, the producer initializes the campaign through its existing engine workflow and supplies the folder. For saved planning without production, use the [blank brief](../../../../templates/campaign-brief.json) and record it as planning; do not initialize jobs. Preserve an existing campaign's schema and fields rather than replacing its brief wholesale.

| Existing brief field | Creative content |
| --- | --- |
| `request`, `audience`, `objective`, `platforms`, `formats`, `targetDurationSeconds`, `assumptions` | User constraints, audience/context, objective, outputs, and provisional choices. Never invent a spending limit. |
| `concept`, `tone` | Selected premise, story turn, and manner of delivery. |
| `artDirection` | Cast or graphic approach, setting, wardrobe when relevant, framing, lighting, palette/texture, type hierarchy, continuity anchors, and difference from recent campaigns. Retain the configured image model. |
| `audio` | Final spoken script where appropriate, delivery/voice qualities, music and SFX. Keep phonetic controls out of visible copy. |
| `productProof` | Claim, catalog feature ID/availability, event type, action/result, source evidence, and capture questions. Separate verified capability from a planned recording. |
| `scenes` | Ordered IDs, provisional durations, beats, visuals/actions, exact spoken and visible copy, asset needs, and per-format framing. |
| `cta` | One main next action and supported destination, following the studio's brand ending. |
| `quality.viewerProblem`, `quality.promise`, `quality.referenceNotes`, `quality.conceptReview` | Creative intent and critique actually performed: reviewer, date, evidence, and unresolved questions. |

The arrays are planning records, not executable engine objects. Keep scene and proof objects consistent with the existing campaign. For new briefs, useful scene properties are `id`, `durationSeconds`, `beat`, `visual`, `spokenText`, `onScreenText`, `audioDirection`, `assetBrief`, `productProofIds`, and `formatNotes`; proof records can use `id`, `claim`, `catalogFeatureId`, `availability`, `eventType`, `action`, `visibleResult`, `evidence`, and `verificationNeeded`. These are planning conventions, not a new enforced schema. Keep aggregate narration consistent with scene dialogue.

Save alternatives, selection rationale, claim evidence, reference qualities, and critique history in `projects/<campaign>/creative-development.md`. Point concept review evidence there. The selected script in `brief.json` is authoritative; reference scene IDs from notes instead of maintaining another final script. Preserve unrelated review history and leave rough-cut, final-media, release, and user approval states untouched.

## Shot and asset direction

For each shot, specify:

- What the viewer notices and the emotional/story change it produces.
- Framing, action, environment, useful camera movement, and continuity anchors.
- Spoken and visible wording separately, with intended pauses, delivery, music/SFX, and captions.
- Provisional duration with time for comprehension, natural speech, product actions, and the required brand ending. Simplify or rewrite to meet a fixed runtime; flexible timing remains provisional until audio is measured.
- Asset intent: real app capture, supplied footage, generated scene, still artwork, or editable graphics. Give useful prompts and constraints without submitting provider requests or fabricating provenance.
- For proof, route/component, starting state, action/result, event type, and inspection status. Keep demo data fictional and identified when necessary. Never submit a real RSVP or publish an event merely to make a shot.
- Per-format placement of subjects, text, demo, captions, and brand overlays. Follow the studio's stationary Live Card and synchronized explanation requirements. Check current destination requirements when relevant to safe placement.

Use precise typography/logo overlays from the existing design and brand workflow. Do not ask footage models to draw exact controls, long text, or the wordmark. Connected shots need consistent identities, props, lighting, and geography; new campaigns follow their own direction.

For companion static ads, supply the shared promise, headline, support line if needed, CTA, key visual, crop/layout, and requested dimensions to the banner/design workflow. For every social post, include at least 10 distinct, relevant hashtags/tags per platform, prioritizing the most popular options supported by current evidence. Follow the [studio social post copy standard](../../../../STUDIO-GUIDE.md#social-post-copy) for research, formatting, field limits, and trend claims. Produce only requested variants and deliverables.

## Producer acceptance

Check for a specific audience, one main promise, clear next action, complete script/storyboard, truthful proof, achievable capture/asset plan, provisional timing, and deliberate framing for every requested format. Record the concept review and remaining capture questions.

Resolve ordinary omissions in the same task. Verify capability questions before recording concept review as passed or submitting paid generation that depends on them. Uncaptured footage may remain a planned task; an unverified feature is not proof. This internal handoff does not require another user-approval step.

A concept-review pass records the written review only. Implementation evidence can support planning, but the producer still inspects the actual product UI before producing dependent assets; capture, media inspection, and user approval remain separate checks.

The producer maps scene IDs, assets/dependencies, measured timing, audio, copy, and layouts into `production.json` using its [production handoff](../../envitefy-video-producer/references/creative-direction.md) and [engine reference](../../envitefy-video-producer/references/engine.md). It selects providers under studio requirements, validates the plan, and manages generation, WebP conversion/cleanup, assembly, and review. Do not replace the brief with an engine plan or call a video complete when only its script exists.

For revisions, change affected decisions and record their effect on the plan. The producer retains unchanged assets and approved speech, reconciles affected tasks, and reviews the changed export. Ideas-only work ends with written deliverables; a full-video request continues to the playable export and user handoff.

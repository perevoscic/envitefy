# Creative brief to production plan

Use this reference when accepting a creative brief or applying a story revision. [Envitefy Ad Creative](../../envitefy-ad-creative/SKILL.md) is the source for concepts, critique, scripts, storyboards, and art direction. Its [handoff contract](../../envitefy-ad-creative/references/creative-handoff.md) maps the existing brief fields. Production-only edits use the saved brief and feedback directly.

## Accept the handoff

Read `projects/<campaign>/brief.json` and its `creative-development.md` when present. Check the audience, promise, opening, story turn, CTA, script/storyboard, product proof, asset direction, and requested formats. Verify remaining capability questions using the product catalog and actual UI before accepting dependent claims. Preserve the user's direction and feedback; resolve ordinary omissions without another approval step.

Use the [quality workflow](quality.md) to record the concept review actually performed. A reviewed plan is not reviewed media or user approval. Keep unresolved capture requirements explicit and unobserved checks pending.

## Translate the plan

The brief is authoritative for what the film says and shows. `production.json` specifies how it is made. Use the [engine reference](engine.md) for its schema; do not copy planning scene objects directly into engine tasks.

- Preserve scene IDs where practical so beats, proof, asset tasks, and review findings remain traceable.
- Choose existing footage, real captures, generated media, or editable graphics for each asset brief. Record continuity references and dependencies explicitly; verify requested models and provider availability before submissions.
- Map provisional durations to frames at the chosen FPS, then reconcile with measured speech and actual product actions. Extend or rewrite deliberately rather than clipping or speeding up a line. Simplify the script when necessary to meet a fixed user runtime.
- Keep exact wording, captions, logos, and controls in editable overlays or real captures. Maintain connected-shot identities, props, lighting, and geography, and the studio's stationary Live Card framing and synchronized explanations.
- Translate format notes into deliberate framing and text/brand placement for every requested aspect ratio. A center crop is not a layout plan.
- Apply the brand ending and corner-overlay timing from the studio guide; allow sufficient readability and dwell time.

Choose tools after the story, manage paid reservations/jobs, and complete artwork conversion/cleanup through the existing workflow. Run the engine's dry-run validation before production. A missing local runtime does not prevent written planning, but must be resolved before claiming a playable video exists.

## Revisions and delivery

Reusing a concept does not freeze older branding or audio requirements. For requested revisions, apply the current studio rules according to their stated scope; newer explicit user instructions take precedence over older campaign defaults. A current request to preserve a particular treatment is itself an explicit instruction. Retain assets that still fit those requirements, and update affected overlays, copy, or audio without unnecessarily redeveloping the concept. An old no-narration default does not silently override a newer applicable spoken-demo requirement.

For retrieval-only requests, return the historical export with accurate status. For a revision, reuse an existing export only after checking that it satisfies both the request and applicable current rules; matching aspect ratio alone is insufficient. Ask about a conflict only when scope or precedence cannot resolve it.

If production constraints change a claim, story beat, or spoken copy, update the authoritative brief and affected production fields together. Record the reason in campaign notes; return to ad creative only for substantive creative work. Edit affected task configuration for content changes; request another take with `revise <campaign> <task> --reason "..."` only when a new asset is needed. Editing-only changes retain unchanged footage and approved speech.

Audition a short sample for a new narrator and compare every spoken Envitefy occurrence with the approved recording. Continue assembly and rendering through [quality](quality.md) and [review and delivery](review.md). Keep scene fixes in campaign feedback, lasting preferences in the studio guide, and user approval tied to the exact reviewed export.

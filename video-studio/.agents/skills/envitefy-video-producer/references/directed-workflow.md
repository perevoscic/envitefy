# Directed video workflow

The implemented path is deliberately small: one edit, early playable previews, scoped performance pilots, a cold rough-cut review and exact-file release. It protects production decisions and their history. It cannot determine whether a performance is believable or a joke works.

## Start or adopt

Use `node engine/cli.mjs init <campaign> --directed --title "Title" --formats 9x16` for a new campaign. Populate the creative brief, asset tasks and complete edit before rendering. `workflow-status` gives the next unfinished stage; ordinary `status` also reports new-submission blockers.

Legacy campaigns remain readable and recoverable. `workflow-adopt` explicitly migrates a supported legacy scene edit, saves `production.before-directed.json`, preserves effective native audio gains and keeps `engine-state.json` byte-for-byte unchanged. Complete narration/music assets are needed to migrate their actual durations. Custom compositions with no scene plan need an explicitly authored shared edit; the tool will not infer early planning from a finished movie.

## Records and ownership

| Record | Owns |
| --- | --- |
| `brief.json` | Audience, business objective, `direction` (emotionalChange, joke, visualStyle, performanceStandard), required content and a `copy` map. |
| `production.json`, schema 2 | Tasks, dependencies, reservations, supported formats, `editFile: "edit.json"`, workflow producer and required pilots. No duplicate scene timings or FPS. |
| `edit.json`, schema 1 | FPS, ordered shots with durationFrames, layouts, selected visual tasks, source trims, copy keys, captions, and independently timed audio clips. |
| `engine-state.json` | Existing provider attempts, receipts, reservations, selected takes, revisions and versioned renders. |
| `workflow.json` | Ordered, hash-linked artifact, decision and rejection events. Do not hand-edit previous events. |
| `workflow-evidence/` | Exact saved direction and observation records, preserved with SHA-256 references. |
| `out/<campaign>/` | Versioned media, render bindings, neutral cold-review packet/media and existing release packets. |

`brief.copy` is referenced by `headlineKey` or `captionKey` in a shot. All numeric edit timing lives in `edit.json`; manifests, SRT and review shot boundaries derive from it. Top-level edit notes do not change render identity. Selected source/take, visible copy, layout and timing changes do. Pilot evidence depends on its selected tasks and direction, independently of unrelated picture timing.

Audio clips use `id`, `task`, `bus`, `from`, `durationFrames`, and optional `trimBefore`, `playbackRate`, `volume`, `fadeInFrames`, `fadeOutFrames`, `captions`. Buses are dialogue, room, foley, notification and music. Clips may start before or finish after any picture cut; trims refer to source frames. Captions use clip-local milliseconds and are compiled into one global display/export timeline. Source video is silent by default in new directed edits; set `sourceVolume` deliberately when using native dialogue.

## Produce and review

1. Record a concrete direction artifact with `workflow-artifact <campaign> --stage direction --file projects/<campaign>/brief.json`. Save the actual internal critique and use `workflow-review --artifact <sequence> --file <report.json>`.
2. Render the **whole** timed storyboard with `render <campaign> --format 9x16 --mode animatic`. Missing selected assets can appear as labelled storyboard placeholders. Temporary dialogue/sound must be entered as audio clips, so the working film tests line lengths and breathing room. Placeholder graphics or silence cannot prove acting or finished sound.
3. Review the animatic before starting paid pilots. Each paid task has `phase: "pilot"` or `"production"`. New paid production requires at least one named, reviewed pilot. Required pilots are `workflow.pilots: [{id, taskIds}]`; pilot tasks also record their actual `construction`. Select the hardest performance/action first. Register a pilot using `--stage pilot --pilot <id>` and either its exact selected provider output or a compiled binding for edited coverage.
4. Two materially failed selected takes with the same construction stop new attempts under that construction. Change coverage or the production method and document it; a longer generation prompt alone is not a new construction. Choosing the right change remains a directing judgment.
5. Render a complete `--mode rough` cut. Use `cold-packet --artifact <sequence>` and give **only that packet and its media** to an independent reviewer with **`fork_turns: "none"`**. Do not send the script, plot, prior feedback or desired verdict. Save the unaided interpretation, perceived benefit, confusing moments and product-credibility response before supplying a targeted checklist.
6. Record the rough decision. A pass needs actual full-motion and full-audio coverage; sampled stills or transcription stay unverified. Then finish with `--mode final`, or `promote-rough --artifact <accepted-rough-sequence>` if the accepted rough needs no changes. A later registration cannot make an earlier, unbound final export establish this chronology. Preview rendering remains available through animatic/rough modes.
7. Complete final picture/sound inspection and the existing `prepare-release`, producer/independent targeted reviews, technical checks and user final approval. Every final format remains separately bound to its exact export. `workflow-review` and `record-review` never grant user approval or publish anything.

The generic observation report identifies `sha256`, `reviewer: {id, kind}`, `method`, `observations`, and `decision` (`pass`, `changes-requested`, `unverified`). Motion passes include `coverage: {picture: "full-motion", audio: "full-listening" | "no-audio", startSeconds: 0, endSeconds: <actual inspected duration>}`. A rough report additionally identifies `packetSha256`, `context: "fresh"`, `unaidedInterpretation`, `perceivedBenefit`, and `productCredibility`. These fields describe observation, not instructions to assert coverage that did not happen.

Defects have a concrete `problem` and media timestamp `atSeconds`. A pass cannot contain an unresolved defect; a resolved issue also needs severity and specific verification. Keep an uncertain review unverified, even if its overall prose is enthusiastic. Reconcile contradictory claims against the actual media, then reassess the relevant creative question.

For a user rejection, save the actual feedback, exact `sha256`, and `reopenFrom` stage; call `workflow-reject --artifact <sequence> --file <feedback.json>`. Later stages reopen without erasing previous evidence. Register the revised artifact after that event. Routine producer notes are not user approval.

## Recovery and custom renders

Creative checks apply before **new** paid submission. A recorded job ID, in-flight receipt or ambiguous submission still takes the existing recovery path, even if creative work is pending or new paid work is disabled. Reservations and deduplication remain in the existing engine. Use status before revising a task.

Shared renders save a `.binding.json` with the actual export SHA, input digests and the final prerequisite captured before rendering. A custom renderer must consume the canonical edit, capture `workflowInputs` before production, capture `finalPrerequisites` before finishing, and save that binding against the resulting bytes. Register it with `workflow-artifact --binding <file> --format <format>`. An export with no binding remains a preview. A binding records the producer's provenance; it is not independent evidence of media quality.

## Validation

Run `npm run test:engine` for recovery, release and workflow behavior. Run `node engine/validate-local.mjs` and then `node engine/validate-directed.mjs` **sequentially** with stable renderer sources: Remotion's webpack cache is shared on this Windows installation. The latter renders three formats, decodes them completely and measures sound on both sides of a picture cut. These fixtures do not receive creative approvals.

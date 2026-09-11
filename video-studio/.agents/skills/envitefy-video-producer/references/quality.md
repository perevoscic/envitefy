# Quality workflow for future Envitefy videos

Updated September 11, 2026: the user is the final human reviewer. Codex handles concept development, production, independent AI critique, technical checks, repairs and review records in the background during each requested video task. Do not hire or contact an editor. Do not require intermediate human concept or rough-cut approval unless the user asks for it. The next three new videos remain the initial quality pilot; existing campaigns are unchanged unless a revision is requested.

## Background production and review

1. **Concept:** use [Envitefy Ad Creative](../../envitefy-ad-creative/SKILL.md) for a new campaign or substantial story revision. Before paid generation, record the chosen concept in the brief and alternatives, claim evidence, and critique in `creative-development.md`. The [creative handoff](../../envitefy-ad-creative/references/creative-handoff.md) defines the script/storyboard and review evidence; verify audience, problem, one main promise, opening, real product action/result, CTA, reference qualities, and achievable motion. Choose routine details from the request and studio preferences; this is not an extra user-approval step. Stay within the authorized scope and budget.
2. **Selected shots:** inspect full moving shots and listen to audio. Check faces, hands, object contact, body movement, wardrobe, props, lighting, continuity and believable reactions. Repair, simplify, replace or remove weak material before final assembly. Money already spent does not justify keeping it. Stills cannot prove motion or sound quality.
3. **Independent rough-cut critique:** use a separate review subagent during video production. Give it the actual rendered media, audience, objective, formats, product truth and brand references without the producer's desired verdict. It must report its actual media inspection method and coverage, first-watch interpretation, timestamped defects, severity, viewer impact and specific corrections. Record the reviewer/session identity and rough-cut file/hash. The reviewer critiques rather than editing the film; the producer repairs it.
4. **Final internal verification:** after repairs, producer and independent AI reviewer inspect each exact final MP4, including continuous motion and audio, silent viewing and phone-size readability. Recheck repaired moments, the opening/cuts and ending. Record actual evidence and keep unavailable checks pending. A separate session does not automatically grant media perception; use available media-capable tools and describe them honestly.
5. **User handoff:** when internal checks pass, present the polished, playable export(s) as **ready for your review**. Keep the handoff concise: filename/version, format, duration, intended message, and any specific remaining limitation or minor choice. The user reviews the finished video and gives approval or changes in ordinary language. Codex maintains the detailed records; do not ask the user to complete JSON, checklists or technical forms.

If full motion/audio inspection is unavailable, continue every feasible check and deliver a clearly labelled preview with the exact gap disclosed. Do not claim complete internal review, fabricate evidence, or treat the user's general approval as proof that an unobserved technical/perceptual check was performed.

Record early reviews as they happen. If a review was missed, perform it honestly and record when it happened rather than backdating it. Changes requested by the user return to production, internal critique and final verification before another user handoff.

## Decision standard

| Area | Evidence required |
| --- | --- |
| Story and specificity | Clear situation, benefit and next action; opening earns attention and the writing belongs to this particular film. Record the first-watch interpretation and weak/strong beats. |
| Motion and continuity | Credible expressions, hands and object contact; no face/prop/wardrobe drift or accidental first-frame/cut discontinuity. Include time ranges. |
| Audio and pronunciation | Natural delivery at original speed, clear speech, clean edits and intelligible music balance. Compare every Envitefy occurrence against the approved recording. |
| Brand and copy | Exact supplied wordmark, correct visible spelling, contrast and placement, CTA and campaign-specific requirements. |
| Captions and timing | Readable at phone size, synchronized, useful dwell time and clearance from platform UI and important action. |
| Product proof | Real supported action and visible result match the claim; illustrative data represented honestly. |
| Format and framing | This output's crop, faces, hands, controls, logo and captions work at intended viewing size. |
| Ending and CTA | Story resolves, text has time to be read and the next action is clear. |

Classify issues as **blocker** (incorrect claim/branding, broken artifact, unusable audio or UI), **major** (conspicuously artificial performance, confusing story, material pacing/framing/readability problem), or **minor** (small polish issue). Blockers and major issues require repair. No numerical average cancels a serious defect. The independent AI reviewer verifies repairs in the current file. Only the user may explicitly accept a remaining minor issue with a reason; do not make the user arbitrate routine fixes.

## Exact-file records and release

The following commands support engine and custom campaign MP4s. They do not generate paid media or publish to social platforms.

```powershell
node engine/cli.mjs prepare-release new-film --file out/new-film/new-film-9x16-v1.mp4 --format 9x16 --duration 30 --producer "Codex producer"
node engine/cli.mjs release-status new-film --file out/new-film/new-film-9x16-v1.mp4
node engine/cli.mjs release new-film --file out/new-film/new-film-9x16-v1.mp4
```

Use the actual campaign, path, duration and producer. Formats are 9x16, 1x1 and 16x9; default FPS is 30. Use --fps when needed and --silent only for an intentionally silent film.

prepare-release checks dimensions, rate, duration, audio presence and complete FFmpeg decoding. It creates a schema-2 review packet inside out/<campaign>/release-review/<file-and-content-digest>/review.json. All creative judgments and user approval start pending. Repeating preparation preserves evidence for unchanged bytes; changed bytes receive a fresh packet. Existing schema-1 packets retain their original human rough-cut/final-review contract and are not silently migrated.

For schema 2:
- Populate creative intent and actual concept/rough-cut history.
- The two reviews are producer and independent AI critique. Keep their identities different, identify each AI inspection method, and record genuine viewing/listening coverage and evidence for all eight checks.
- Set pass only on observed checks. not-applicable is allowed for deliberately absent captions or audio in an intentionally silent export, with an explanation.
- Record issues with id, severity, startSeconds, endSeconds, problem, fix, status, verification, verifiedBy and verifiedAt. Resolved issues must be verified by the independent AI reviewer. accepted-minor additionally requires the user's acceptedBy, acceptedAt and acceptance reason.
- Leave userApproval pending until the user explicitly approves the specific presented export. Then record their identity, kind human, decision pass, actual response/evidence, reviewedAt and that file's SHA-256. Do not invent separate viewing/listening attestations on their behalf. A response clearly approving all presented formats may be recorded for each specified file; approval of one format does not cover unreviewed alternatives.

release-status reports ready-for-user-review when internal requirements pass and user approval is pending; readyToPublish remains false. Unresolved defects or missing inspection evidence remain changes-required. After actual user approval, release reruns technical inspection and writes a receipt with exact video/review hashes and the explicit user-approval record. release-status must validate that receipt immediately before a handoff calls the file ready to publish. Every requested format needs its own passing receipt.

Never copy final inspection or user approval across changed video bytes. Preserve previous exports, packets and approval history. In schema 2 a successful release records userApproved true only after explicit user approval passes validation; legacy receipts do not gain approval from this change. Social publishing remains a separate requested action.

The engine's record-review command remains producer evidence and cannot grant release readiness. The gate validates recorded evidence and file identity; it cannot prove someone watched the film or intercept manual social uploads.

## User review and pilot assessment

Use [reviewer-brief.md](reviewer-brief.md) to prepare the short user-facing handoff and the internal critique assignment. No freelance engagement is part of the selected workflow.

Across the first three new videos, record defects caught early, recurring issues, repair rounds, internal review effort and user feedback. Turn lasting corrections into studio preferences and keep scene-specific notes with the campaign. Assess the pilot after the third video while preserving user final approval. Audience/retention data can inform later choices when available; it is not a prerequisite that requires the user to recruit a panel for each film.

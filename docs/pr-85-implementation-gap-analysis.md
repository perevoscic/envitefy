# PR #85 Implementation Gap Analysis (`/studio` mobile redesign)

## Scope of this investigation
This document explains why PR #85 appears "not implemented", compares what PR #85 actually changed versus current `main`, and provides a concrete implementation roadmap to convert the plan into shipped product behavior.

## 1) What PR #85 actually merged
PR #85 merged exactly one commit (`02b4b24`) and exactly one file change: addition of `docs/studio-mobile-redesign-plan.md`.

- Commit message: `docs: add mobile-first /studio redesign implementation plan`.
- File added: `docs/studio-mobile-redesign-plan.md`.
- No `src/` files were changed in that PR.

### Conclusion
PR #85 is a **documentation-only PR**. It defines a proposed redesign but does not implement UI, state, routing, analytics, or API behavior.

## 2) Why you do not see the PR features in product
The features listed in your screenshot (step header, collapsible optional sections, immersive preview dock, unified bottom sheets, etc.) are mostly described as recommendations and action items in the planning document, not shipped code.

The plan itself explicitly frames these as future work in Quick Wins / Medium / Larger structural changes, including 1–3 day, 4–10 day, and 2–4 week buckets. That is implementation backlog language, not completion language.

## 3) PR #85 plan vs current `main`: gap matrix

## A. Step-based editor split + progress header
**Plan target:** Category → Essentials → Details → Style → Review/Generate with progress indicator.

**Current main:** Studio step model is only `"type" | "details"`, and `StudioCreateFlow` branches only between category/type content and details content.

- Current step type definition: `StudioCreateStep = "type" | "details"`.
- Current create flow renders `typeContent` when `createStep === "type"`, else details block.

**Gap:** The 4-step shell and progress header from the plan are not implemented.

## B. Collapsible optional/completed sections
**Plan target:** Collapsible optional and completed sections.

**Current main:** There is partial collapsing behavior (`More details` toggle) for some extra fields, but not the full plan-level section system with completion summaries.

- Existing toggle is local `showMoreDetails` and button label `More details`.

**Gap:** Partial implementation exists; full section-card architecture is missing.

## C. Immersive preview dock controls
**Plan target:** Dedicated immersive preview mode with minimal floating controls.

**Current main:** Preview is currently an editor-side pane (or mobile pane tab) rendered inside `StudioFormStep`, while workspace chrome/tabs remain in the shell.

- `StudioWorkspaceShell` always renders top `Create | Library` tabs.
- `StudioFormStep` toggles mobile `Editor` / `Preview` panes in-place.

**Gap:** No true fullscreen immersive preview route/state that suppresses surrounding studio chrome.

## D. Unified bottom-sheet system
**Plan target:** shared sheet primitive for style picker, image edit, save success.

**Current main:** There are separate interactions; style chips are inline in the form card, not bottom-sheet based.

- Image finish presets currently render as an in-flow block/grid of buttons.

**Gap:** No unified bottom-sheet primitive used across style/edit/save flows.

## E. Query-synced step architecture
**Plan target:** query/state model like `?category=birthday&step=details&preview=1`.

**Current main:** Query sync exists for `view`, `step`, and `category` in `StudioWorkspace`; however, because step model is only two-step, this is only partial foundation.

- State is initialized from query params.
- `navigateWorkspace` mutates `view`, `step`, `category` in URL.

**Gap:** plumbing exists, but expanded step graph and preview mode sync are not fully implemented.

## F. Date picker reliability
**Plan target:** robust native date/time behavior.

**Current main:** Inputs still use native `type="date"` / `type="time"` where applicable, but there is no explicit `showPicker()` forwarding pattern described in the plan.

- Field renderer uses `renderedInputType` and writes `<input type={renderedInputType}>`.

**Gap:** likely improved baseline exists, but the plan’s explicit wrapper/icon forwarding pattern is not implemented centrally.

## 4) Root-cause analysis (why expectations mismatched)
1. **PR title ambiguity:** The PR title contains “redesign ... implementation plan”, which can be read quickly as redesign implementation.
2. **Conversation/log language looked implementation-like:** The screenshot bullets read like shipped work, but the merged diff was docs-only.
3. **Main already has independent studio iterations:** Existing `/studio` code has some mobile/editor-preview behavior, making it easy to assume PR #85 shipped a complete redesign when it did not.

## 5) How to implement the PR #85 plan now (concrete execution plan)

## Phase 0 — Lock acceptance criteria (0.5–1 day)
- Convert each A–I section in `docs/studio-mobile-redesign-plan.md` into product-level acceptance criteria (DoD).
- Add explicit non-goals for v1 to prevent scope drift.
- Add tracking issue + checklist grouped by Quick/Medium/Large sections.

## Phase 1 — Quick wins (1–3 days)
1. **Preview chrome suppression flag:** add `isPreviewImmersive` path that hides top workspace chrome in preview state.
2. **Sticky action bar:** create a reusable sticky CTA bar and use step-aware CTA labels.
3. **Compact style selector trigger:** replace inline large style block with compact row + sheet trigger.
4. **Date/time wrapper hardening:** centralize date/time control wrappers and optional `showPicker` forwarding.

**Likely files:**
- `src/app/studio/StudioWorkspace.tsx`
- `src/app/studio/workspace/StudioFormStep.tsx`
- `src/app/studio/workspace/StudioFieldControls.tsx`
- `src/app/studio/workspace/StudioPhonePreviewPane.tsx`

## Phase 2 — Step architecture (4–10 days)
1. Expand `StudioCreateStep` beyond `type|details` to essentials/details/style/review.
2. Add step progress header and completion metadata.
3. Replace one long composer surface with per-step sections.
4. Preserve query-param synchronization and deep-linking to step.

**Likely files:**
- `src/app/studio/studio-types.ts`
- `src/app/studio/workspace/StudioCreateFlow.tsx`
- `src/app/studio/StudioWorkspace.tsx`
- new step components under `src/app/studio/workspace/`

## Phase 3 — Unified bottom sheets + image candidate compare (1–2 weeks)
1. Build `StudioBottomSheet` primitive with variants (`stylePicker`, `editImage`, `saveSuccess`).
2. Add candidate compare flow (`current` vs `candidate`) before replace.
3. Add undo-safe image version handling in draft state.

**Likely files:**
- `src/app/studio/StudioWorkspace.tsx`
- `src/app/studio/workspace/StudioFormStep.tsx`
- new components in `src/app/studio/workspace/`

## Phase 4 — Instrumentation + regression guards (2–4 days)
1. Add step funnel telemetry (entry, continue, generate, regenerate, save).
2. Add source-shape and behavior tests for step sync + sheet transitions + preview mode.
3. Add coverage for mobile-specific interactions.

**Likely files:**
- `src/app/studio/*.test.mjs`
- `src/app/studio/workspace/*.test.mjs`

## 6) Recommended immediate next actions
1. Treat PR #85 as a specification artifact, not implementation.
2. Open a new implementation epic referencing this document and `docs/studio-mobile-redesign-plan.md`.
3. Deliver in thin vertical slices (quick wins first) so users can see progressive changes quickly.
4. Update PR/commit templates to include an explicit “Code changes: yes/no” field to prevent docs-vs-implementation confusion.

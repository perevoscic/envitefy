# Studio Mobile-First Redesign Plan

## A. Executive Summary
Envitefy `/studio` should move from a long single-page web form into a **guided, category-first mobile creation flow** with progressive disclosure: **Category → Essentials → Style → Generate → Preview → Edit Image → Save**. The redesigned experience should use sticky bottom actions, step-aware headers, bottom sheets for optional controls, and a distraction-free preview mode. This reduces scroll burden, increases clarity, and makes image editing/regeneration feel native and immediate rather than buried in the page.

### Product squad synthesis
- **UX Flow Architect:** Replace the monolithic editor with a stepper journey and clear completion model.
- **Mobile Interaction Designer:** Use one-handed controls (bottom CTAs, sheets, segmented tabs, sticky action bars).
- **Forms & Input Specialist:** Split required vs optional inputs into concise sections; enforce correct mobile input types.
- **Image Editing Experience Specialist:** Add a dedicated “Edit Image” bottom sheet workflow with version compare/replace.
- **Frontend Implementation Strategist:** Implement with composable step components, shared studio state, and route/query-driven preview mode.

## B. Main UX Problems Found
1. **Flow is web-form heavy, not mobile-native.** Users perceive `/studio` as one long scroll instead of a guided creation journey.
2. **Category selection does not create a strong transition into a tailored builder.** After selection, the next step feels generic.
3. **Form causes vertical fatigue.** Required and optional data compete equally; hierarchy is weak.
4. **Image finish options consume too much vertical space.** The large style block pushes primary actions below fold.
5. **Date picker regression.** Event date field behavior suggests input type/focus handling broke; keyboard appears instead of calendar.
6. **Preview is not immersive.** Top chrome/navigation remains visible, weakening “this is my final card” confidence.
7. **Image regeneration lacks an in-context mobile pattern.** Users must context-switch/scroll to find controls.
8. **CTA hierarchy is diluted.** “Generate image” and “Create live card” coexist without step-aware progression.

## C. Recommended New Studio Information Architecture

### Proposed IA (mobile-first)
1. **Studio Home**
   - Two primary tabs: `Create` | `Library`
   - Create tab starts with compact category rail/grid.
2. **Category Builder (step-based shell)**
   - Header: back, category title, progress (e.g., `Step 1 of 4`).
   - Steps:
     1) Essentials
     2) Details
     3) Look & Feel (optional)
     4) Review + Generate
3. **Preview Mode (dedicated immersive state)**
   - Fullscreen preview canvas/card.
   - Minimal control dock: Edit, Regenerate, Save.
4. **Image Edit Sheet**
   - Prompt editor + style override + regenerate.
   - Candidate comparison (Current vs New) before replace.
5. **Save/Publish Confirmation**
   - Save to Library, Continue Editing, Share/Publish (if applicable).

### Structural rules
- Required fields only appear in early steps.
- Optional styling and media are deferred and collapsible.
- Primary action is always fixed bottom-right/center, step-specific.
- Every step includes immediate “Continue” affordance and visible completion state.

## D. Mobile-First Interaction Model
1. **Single-focus screens:** Each step presents one job, not the entire creation stack.
2. **Sticky bottom action bar:**
   - Primary CTA (filled): `Continue`, `Generate`, `Use New Version`, etc.
   - Secondary CTA (ghost/text): `Back`, `Skip`, `Keep Current`.
3. **Bottom sheets for secondary choices:** image style, advanced options, prompt editing.
4. **Progressive disclosure:** hide optional complexity until users request it.
5. **One-thumb reachability:** key actions and step tabs in bottom half of viewport.
6. **Context-preserving transitions:** no hard reload between editor and preview; animate slide/fade.
7. **Autosave draft feedback:** lightweight “Saved” toast + unsaved dot indicator.

## E. Recommended UI Changes by Area

### 1) Category selection
- Replace static category jump with a **Category Transition Screen**:
  - Category hero chip/icon + 1-line promise (“Let’s build your birthday invite”).
  - Show next required inputs at a glance (“Name, Date, Time, Location”).
  - CTA: `Start`.
- Keep categories scannable using 2-column cards with icon, title, and short descriptor.
- On selection, route to `/studio?category=birthday&step=essentials`.

### 2) Form layout
- Break into mobile sections:
  - **Essentials:** Title/person, date, time, location, RSVP.
  - **Details:** Description, host notes, optional links.
  - **Enhancements (optional):** style, source images/flyer.
- Use section cards with concise labels and helper text.
- Collapse completed sections to summary rows (“Date: Sat, May 16 • 4:30 PM”).
- Increase tap targets to 44px+, tighten vertical spacing by removing oversized decorative padding.
- Required fields surfaced first; optional fields under “Add optional details”.

### 3) Optional style selector
**Best pattern: Bottom sheet + horizontal chips (recommended).**
- In form, show compact row: `Image Style: Auto` + `Change` button.
- Tapping opens bottom sheet with:
  - Searchable chips or segmented groups (Playful, Elegant, Bold, etc.).
  - Live miniature preview swatches.
  - `Apply` CTA.
- Why this is best:
  - Preserves discoverability (clearly labeled row).
  - Removes large in-flow card height.
  - Faster scanning/selection in constrained mobile viewport.

### 4) Date picker
**Likely break cause**
- `input[type="text"]` replaced `type="date"`, custom masking intercepts tap/focus, or icon click handler no longer invokes `showPicker()`/native control on supported browsers.

**Correct behavior**
- Tapping the date field or calendar icon should open native date UI where available.
- Manual entry fallback only when native picker unsupported.

**Implementation pattern**
- Use native input:
  - `<input type="date" inputMode="none" />` for date
  - `<input type="time" />` for time
- Forward taps from wrapper/icon to input via `ref.current?.showPicker?.()` then `focus()` fallback.
- Avoid readonly text proxies for date/time on mobile.
- Keep visible formatted value separate only for display, not as primary input element.

**Accessibility/browser considerations**
- Associate label with input (`htmlFor`/`id`).
- Maintain keyboard fallback and proper `aria-describedby` for validation.
- Test on iOS Safari + Chrome Android (showPicker support differs).

### 5) Preview mode
- Entering Preview triggers **immersive mode**:
  - Hide top nav/menu and non-essential studio chrome.
  - Full-height preview canvas with device-safe paddings.
  - Minimal floating controls:
    - `Back to Edit`
    - `Edit Image`
    - `Save`
- Add `Preview` state indicator only (small pill), not full editor tabs/header stack.
- Keep load/progress overlays within preview canvas, not page-level clutter.

### 6) Image editing/regeneration
**Recommended flow: Persistent “Edit Image” FAB + bottom sheet editor**
1. User taps `Edit Image` in preview control dock.
2. Bottom sheet opens with:
   - Prompt textarea (pre-filled current prompt).
   - Style selector (compact chips).
   - Optional strength slider (`Subtle ↔ Bold change`).
   - `Regenerate` primary CTA.
3. After generation, show side-by-side swipe compare:
   - Current (A) vs New (B).
   - Actions: `Keep Current` (secondary) and `Use New Version` (primary).
4. Choosing new version replaces preview instantly and logs prior version in session history (undo possible).

### 7) Save/publish/library actions
- Replace bottom-page save button with sticky action in preview:
  - `Save to Library` primary.
  - Secondary overflow: `Rename`, `Duplicate`, `Share draft`.
- After save, show confirmation sheet:
  - “Saved to Library”
  - `View in Library`
  - `Keep Editing`

## F. Suggested Screen Flow
1. Open `/studio` → `Create` tab default.
2. Pick category card.
3. Category transition screen clarifies required inputs.
4. **Step 1 Essentials** (short form) → Continue.
5. **Step 2 Details** (description + optional metadata) → Continue/Skip.
6. **Step 3 Look & Feel** (optional style in bottom sheet, optional media upload) → Continue.
7. **Step 4 Review & Generate** (summary + Generate Image CTA).
8. Auto-transition to **Preview immersive mode**.
9. If image change needed → `Edit Image` sheet → Regenerate → Compare → Keep/Replace.
10. Save to library from preview control dock.
11. Confirmation sheet with next actions.

## G. Component/System Recommendations

### Reusable components
- `StudioStepShell` (header, progress, content slot, sticky actions).
- `StudioProgressHeader` (category title + step meter).
- `StudioSectionCard` (collapsible section + completion summary).
- `StudioStickyActionBar` (primary/secondary CTA).
- `StudioBottomSheet` (style picker, image edit, save confirmation).
- `StudioDateTimeField` (native input wrapper + icon forwarding).
- `StudioPreviewCanvas` (immersive preview + lightweight overlays).
- `ImageVersionCompare` (A/B toggle or swipe).

### Interaction tokens
- Motion: 180–240ms ease-out for step transitions.
- Spacing scale tuned for mobile density (8/12/16/20).
- Touch targets minimum 44px height.
- Elevated surfaces reserved for sheets and sticky bars only.

## H. Engineering Handoff Notes

### React + Next.js + Tailwind implementation strategy
1. **Route/state model**
   - Keep route stable at `/studio`; sync step with query param (`?category=birthday&step=details&preview=1`).
   - Maintain creation draft in a single store (React context + reducer or Zustand).
2. **Step architecture**
   - Convert monolithic form into step components:
     - `StudioStepEssentials`
     - `StudioStepDetails`
     - `StudioStepStyle`
     - `StudioStepReview`
   - Validation gates per step using lightweight schema slices.
3. **Date/time fix**
   - Standardize on controlled native date/time inputs with browser capability checks.
   - Abstract to `StudioDateTimeField` to avoid regressions.
4. **Preview mode toggle**
   - Add `isPreviewImmersive` flag that conditionally hides app/studio top nav wrappers.
   - Render preview in a dedicated layout variant (mobile-first).
5. **Bottom sheets**
   - Use one shared sheet primitive with variant content:
     - `stylePicker`
     - `editImage`
     - `saveSuccess`
6. **Image regeneration state**
   - Keep `currentImage`, `candidateImage`, `currentPrompt`, `candidatePrompt` in isolated image edit slice.
   - Use optimistic UI while regenerating; disable destructive actions during request.
7. **Performance**
   - Lazy-load preview-heavy components and image tooling after Essentials step completion.
   - Defer non-critical library/media fetches to background.

### Suggested state shape
- `studioDraft`: category, fields, completion map, lastSavedAt.
- `studioFlow`: currentStep, isPreviewImmersive, activeSheet.
- `studioImage`: current, candidate, prompt, style, generationStatus.
- `studioActions`: generate, regenerate, acceptCandidate, discardCandidate, saveDraft.

## I. Prioritized Action Plan

### Quick wins (1–3 days)
1. Hide top nav/menu in preview mode.
2. Fix date/time fields to reliably open native pickers.
3. Move style choices into compact selector + sheet.
4. Add sticky bottom CTA bar with step-aware labels.

### Medium-effort improvements (4–10 days)
1. Split current editor into 3–4 step screens with progress header.
2. Collapse optional fields and completed sections.
3. Add immersive preview control dock (`Edit Image`, `Save`).
4. Build unified bottom sheet system for style/edit/save flows.

### Larger structural changes (2–4 weeks)
1. Full state refactor into step-driven architecture with query sync.
2. Implement image candidate comparison and version replacement workflow.
3. Introduce category transition screens and tailored per-category field defaults.
4. Add analytics instrumentation per step (drop-off, regenerate rate, save conversion).

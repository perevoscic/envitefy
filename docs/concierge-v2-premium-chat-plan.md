# Concierge V2 Premium Chat Plan

## Phase 1 Product Definition

### Product Promise

Concierge V2 should feel like a professional event operating assistant, not a form. A user should be able to describe an event in natural language, upload source material, review what Envitefy understood, correct details conversationally, and publish a usable event page with supporting tools.

### Primary Surface

`/concierge-v2` is the canonical chat experience. `/chat` already redirects there, so new premium chat work should land in the V2 surface instead of reviving the legacy `/chat` client.

### Core Happy Path

1. The user opens `/concierge-v2`.
2. The first screen is a calm chat workspace with a composer ready for text or upload.
3. The user sends a short event brief.
4. Concierge shows progress while it reads the brief and builds a draft.
5. The assistant summarizes the draft and calls out only important missing details.
6. The user can edit key fields in a live review panel.
7. The user publishes the event page and gets links to the guest page and operating tools.

### Required States

- Empty state with starter prompts.
- Text brief submitted.
- Draft generation in progress.
- Draft ready with missing fields.
- Draft ready with no blocking gaps.
- Publish in progress.
- Published success with links.
- Recoverable error with retry.

### Quality Bar

- No dead ends: every failure state must offer retry or manual continuation.
- No layout jumps that move the composer unexpectedly.
- Mobile keyboard-safe composer.
- Long user messages and assistant messages must wrap cleanly.
- The assistant should ask fewer, higher-value questions.
- Visual style should be restrained, dense enough for repeat use, and visibly more polished than an admin form.

### Implementation Direction

The first implementation milestone keeps the existing V2 APIs:

- `POST /api/concierge/sessions`
- `POST /api/concierge/sessions/[id]/apply`

The UI changes first: typed brief -> assistant-style progress -> draft review -> publish. Dedicated message persistence, upload intake, and streaming can follow once the chat shell is stable.

## Phase 2 Chat-First Interaction

### Goal

Make the default path feel like a professional assistant conversation instead of a configuration form.

### Required Work

- Replace the prefilled textarea with an empty assistant welcome state.
- Add user and assistant message bubbles with accessible live-region behavior.
- Keep the composer stable at the bottom of the chat surface.
- Support Enter to send and Shift+Enter for multiline input.
- Show starter prompts only before the first brief.
- Show assistant progress while the draft is being created.
- Summarize the generated package in plain language.

### Status

Completed in the current implementation.

## Phase 3 Review And Correction Loop

### Goal

Let users correct the draft without feeling like they are editing raw generated output.

### Required Work

- Keep a live review panel visible beside the conversation.
- Let users edit key fields directly when direct editing is faster than chat.
- Turn missing fields into quick chips that prefill the composer.
- Preserve the existing draft as hidden context when the user sends a correction.
- Keep the visible chat message clean and user-authored.
- Provide a precise retry path for the exact failed generation request.

### Status

Completed for the client-side V2 shell. A later backend pass should replace the current session-row refinement approach with a dedicated message endpoint.

## Phase 4 Upload Intake

### Goal

Make uploaded invitations, PDFs, screenshots, and flyers feel native to the same chat flow.

### Required Work

- Add an upload affordance in the composer.
- Validate file type and size before upload.
- Use the existing OCR helper for images and PDFs.
- Send extracted text and structured hints into the V2 creation endpoint.
- Show upload progress as assistant status.
- Offer retry when OCR or draft creation fails.

### Status

Completed using the existing snap upload pipeline and Concierge V2 session endpoint.

## Phase 5 Session Continuity

### Goal

Make the experience resilient when users leave, refresh, or return later.

### Required Work

- Load recent Concierge V2 sessions.
- Show recent drafts in a compact resume panel.
- Resume a selected session into the chat and review panel.
- Restore published state and owner links when a session was already applied.
- Use readable titles even when list payloads are partial.

### Status

Completed for recent-session loading and resume.

## Phase 6 Validation And Release Readiness

### Goal

Protect the premium shell from regressions and identify the remaining release blockers.

### Required Work

- Add source-shape tests for the chat shell, upload path, resume path, refinement path, and owner links.
- Run targeted Concierge V2 behavior tests.
- Run Biome on touched files.
- Run broader TypeScript and VS Code diagnostics where available.
- Perform desktop and mobile visual QA against a stable dev server.

### Status

Source-shape tests, targeted behavior tests, and Biome pass. Full TypeScript still fails on existing repo-wide issues outside this surface. VS Code diagnostics and browser visual QA are blocked by local tooling/server availability in the current session.

## Implementation Progress

### Completed In First Pass

- Replaced the form-first V2 page with a chat-first workspace.
- Added assistant/user message state, progress messages, and recoverable errors.
- Kept the existing V2 session and apply endpoints for lower-risk rollout.
- Added recent draft loading from `GET /api/concierge/sessions`.
- Added session resume from `GET /api/concierge/sessions/[id]`.
- Added conversational refinements that include the previous draft context behind the scenes.
- Added upload intake through the existing OCR helper, then routes extracted text into V2 as `sourceKind: "upload"`.
- Added retry affordances for failed text and upload creation.
- Added source-shape tests for the premium chat shell.
- Added safer API response parsing so non-JSON failures still produce controlled chat errors.
- Added exact retry-state preservation for hidden refinement and upload-derived creation prompts.
- Improved recent draft titles when a list item lacks a normalized draft title.

### Remaining Hardening

- Persist every chat turn as first-class conversation messages instead of reconstructing messages from session rows.
- Stream assistant/progress events from the API instead of client-side progress placeholders.
- Add a dedicated V2 message endpoint for draft refinements instead of creating a fresh session row per correction.
- Add browser visual QA for desktop and mobile once a stable local dev server is available in the working session.
- Add upload fixtures or mocked OCR tests for the UI-level upload path.

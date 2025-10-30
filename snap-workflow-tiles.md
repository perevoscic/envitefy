# Snap Workflow Integration (Tiles Layout)

This note complements `snap-workflow.md`. The legacy document still covers the OCR -> calendar pipeline end to end. This file explains how that workflow is surfaced inside the new home tiles experience and shared entry points (sidebar shortcuts, query params, etc.). Update both docs whenever the request/response contract or entry logic changes.

## Modal Workflow (Home)

- The capture + ingest logic still lives in `src/app/page.tsx`, but editing now happens inside `SnapEventModal`, a local overlay rendered by the Home page.
- Camera and file `<input type="file">` elements stay mounted (camera uses `capture="environment"`) so any caller can trigger a picker even while the modal is closed.
- `Home` exposes `window.__openSnapCamera` and `window.__openSnapUpload` so other surfaces can launch the workflow. The helpers are cleaned up on unmount.
- During OCR the thin `scan-inline` progress bar renders inline on the homepage. Once data arrives we populate state, open `SnapEventModal`, and keep the editor in the overlay. Closing the modal runs `resetForm()` which also clears the captured event.
- The page still renders the dashed "Snap or upload" card when no event is present to preserve the empty state messaging.

## Entry Triggers

| Surface | Behaviour |
| ------- | --------- |
| **Home -> "Snap Event" card** | Calls `openCamera()` (which resets state and clicks the camera input). |
| **Home -> "Upload Event" card** | Calls `openUpload()`, immediately opening the library picker. |
| **Left sidebar shortcuts** | Attempt `window.__openSnapCamera/__openSnapUpload`; if undefined the link falls back to navigating to `/?action=camera|upload`. |
| **Query params (`/?action=camera|upload`)** | A `useEffect` in `Home` consumes the param, triggers the matching picker, then removes the query to avoid replays. |

## UX Notes

- `SnapEventModal` locks page scroll while open and closes on overlay click, Escape, the header close button, or the "Cancel" action.
- Calendar buttons (`Add to Google`, `Add to Outlook`, `Download ICS`) still reuse `buildSubmissionEvent` defined in `page.tsx` and described in `snap-workflow.md`.
- Selecting a new file always calls `resetForm()` before re-opening the picker so stale state never leaks into the next capture.

## Maintenance Checklist

- Adding new entry buttons? Use the window helpers or route to `/?action=camera|upload`; avoid sprinkling additional hidden inputs around the app.
- Adjusting the editor schema or reminders logic? Update both this file (entry points) and `snap-workflow.md` (pipeline details).
- Keep the `loading` -> `scan-inline` indicator wired so users always see progress feedback while OCR runs.

_Last updated: 2025-10-30_


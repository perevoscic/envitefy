# Snap Page Workflow (Camera & Upload → Event Creation)

This document walks through everything that happens on `/snap`, from pressing **Snap It Now** or **Upload** all the way to calendar insertion, history logging, and reset. Source references point to `src/app/snap/page.tsx` unless noted otherwise.

## 1. Entry Triggers

| Action                 | Function     | Key steps                                                                                                                                                     |
| ---------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Snap It Now** button | `openCamera` | Clears previous selections, runs `redirectIfNoCredits`, clicks the hidden camera `<input type="file" capture="environment">` (`lines 982-1005`, `1705-1716`). |
| **Upload** button      | `openUpload` | Mirrors the camera path but targets the general file input (`lines 986-1005`, `1718-1729`).                                                                   |

- Credit gating is effectively disabled (`isLifetime` is `true`), but the guard remains for reinstating limits (`lines 386-416`).
- Hidden inputs reset their `.value` before each click so re-selecting the same file still triggers `onFile`.

## 2. Shared File Intake (`onFile`)

1. Resets both hidden inputs and exits if no file was chosen (`lines 618-633`).
2. PDFs go straight to ingestion; images are normalized through `preparePickedImage` (`lines 634-641`, `src/utils/pickImage.ts:23-71`):
   - Applies EXIF orientation.
   - Downscales the longest side to ≤ 2000 px.
   - Re-encodes as JPEG.
3. Stores the processed `File` in state (`setFile`) and forwards it to `ingest` (`lines 640-643`).

## 3. OCR Ingestion (`ingest`)

- Builds `FormData`, posts to `/api/ocr`, and aborts after 45 s to keep the UI responsive (`lines 652-675`).
- Surfaces network/HTTP errors with actionable messages (`lines 666-681`).
- Successful responses:
  - Capture raw OCR text.
  - Populate `fieldsGuess`.
  - Infer a category (backend-provided or keyword fallback) (`lines 683-754`).

## 4. Schedules & Practice Tables

- `events` arrays are normalized into ISO VEVENTs for bulk export buttons (`lines 756-767`, helper `lines 543-613`).
- `practiceSchedule` payloads populate the group selector UI and pause finalization until the user chooses a team block (`lines 769-804`).

## 5. State & UI Updates

- For single events, set the main `event` state, assign a default 24 hour reminder, and reset the “already saved” guard (`lines 803-813`).
- Show the editor tray so the user can adjust title, timing, recurrence, venue, RSVP, description, reminders, and category (`lines 1860-2580`).
- Location edits trigger a debounced Nominatim lookup; selecting a suggestion stores both the formatted address and lat/lon (`lines 1036-1066`).

## 6. Preparing an Event Payload

- `buildSubmissionEvent` converts the editable strings back into ISO datetimes, defaulting to 90 minute durations and normalizing addresses while locking in the timezone (`lines 1069-1079`).
- `parseStartToIso` (chrono-based) understands natural language like “Saturday at 2 pm” (`lines 993-1018`).

## 7. Persisting History Once

- `saveHistoryIfNeeded` guards with `hasSavedRef`, optionally creates a WebP thumbnail, and POSTs the snapshot to `/api/history` (cache the returned ID for navigation) (`lines 816-909`).
- After saving, update cached credits (if ever re-enabled), write plan info to the profile cache, and emit `history:created` for sidebar refreshes (`lines 862-906`).

## 8. Downstream Actions

All primary actions run through `closeAfter`, ensuring history is saved first and the UI resets afterwards (`lines 1184-1230`, `2598-2683`).

| Button                             | Flow                                                                                                                                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Add to Google**                  | POST `/api/events/google`; 400/401 reroute to `/api/google/auth?consent=1` with the event serialized into `state`. Success opens the returned `htmlLink`, with special handling for iOS/Android (`lines 1231-1314`). |
| **Add to Outlook**                 | POST `/api/events/outlook`; failures fall back to an Outlook Web compose link, desktops attempt native scheme hand-off first (`lines 1324-1379`).                                                                    |
| **Download / Add via ICS (Apple)** | Build `/api/ics` query with `floating=1`, recurrence, and reminders; navigate inline (iOS/macOS Safari) or as an attachment elsewhere (`lines 1122-1166`).                                                           |
| **Save & View Details**            | Run `saveHistoryIfNeeded`, reset, and navigate to `/history/[id]` once the record exists (`lines 1218-1229`).                                                                                                        |
| **Bulk Drafts**                    | When `bulkEvents` is populated, open one Google or Outlook draft per normalized event for manual confirmation (`lines 1384-1426`).                                                                                   |

## 9. Cleanup

- Regardless of the action, `resetForm` clears state, empties inputs, collapses the editor, and returns the page to its hero state ready for another capture (`lines 368-397`).
- The shared pipeline means both **Snap It Now** (camera) and **Upload** converge immediately after `onFile`; from there, the user experience and downstream effects are identical.

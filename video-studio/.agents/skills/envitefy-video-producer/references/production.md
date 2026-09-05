# Studio production reference

Read for actual video production or revisions. Paths and commands below are relative to the `video-studio` folder. Read the campaign's own notes before using its scripts.

## Workspace and campaign records

The studio remains inside the Envitefy repository because it uses parent brand assets, credentials, product sources, and Playwright. Use the saved local checkout for existing media; a fresh Git worktree may not contain uncommitted or ignored assets. Do not relocate the studio or create a nested Git repository to give it a separate Codex sidebar entry.

For a new campaign, create:

```text
projects/<campaign>/brief.json
projects/<campaign>/production-notes.md
projects/<campaign>/feedback.md
projects/<campaign>/deliverables.json
public/projects/<campaign>/
out/<campaign>-<aspect>-v<N>.mp4
```

Add script/storyboard, captions, or social-copy files when useful. Store private provider records under the campaign as `*-job.json` and `*-request.json`, covered by `.gitignore`. Only files needed by the rendered video belong in `public/`. Do not store keys, signed download URLs, or raw provider responses there.

The planning template at `templates/campaign-brief.json` is independent of the older Intro narration schema and Host Mode generator schema. Adapt the renderer/generator explicitly to new creative structures. The user does not need to fill out a form: populate the brief from their natural-language request and reasonable choices.

## Available pipeline

| Need | Existing implementation | Important scope |
| --- | --- | --- |
| Editing/rendering | Remotion, `src/Root.tsx`, scene components | Use installed Remotion skills for current APIs. Keep animations frame-driven. |
| Raster artwork | ImageGen tool/skill | Preserve exact logos as supplied assets. |
| Fictional video footage | `scripts/generate-host-assets.mjs` | **Hardcoded to Host Mode**: paths, shot names, prompts and provider job lineage. Read/adapt to a new campaign before invoking for new work. |
| Original music | Same script, mode `lyria` | Host Mode's working instrumental path; `music` is an older ElevenLabs Music attempt that returned a paid-plan requirement. |
| Voice narration | `scripts/generate-narration.mjs`; `npm run voices`; `npm run narration -- <id>` | Expects the Intro-compatible brief with scene narration, voice/model settings and five scene IDs. It caches speech and aligns captions. It is not a generic new-video command. |
| Real UI screenshots | `scripts/capture-host-demo.mjs` | Captures the local Carter Housewarming showcase into Host Mode assets. Adapt URL, selectors, and output folder for another event type. |
| Intro notification sounds | `scripts/compose-host-soundtrack.mjs` | Deterministic Host Mode sound effects/fallback music. |
| Final music mix | `scripts/mix-host-soundtrack.mjs` | Host Mode's 22-second timing; adapt durations for new work. |

Working provider history on 2026-09-05: Google `gemini-omni-1.1-flash` video and `lyria-3-clip-preview` music; ElevenLabs TTS for the earlier Intro. Verify API documentation and model availability when changing provider calls; these identifiers are recorded history, not a rule to use an obsolete model forever.

The generation scripts load parent `.env`, then `.env.local`, then inherited process overrides. `GEMINI_API_KEY` supplies Google calls, `ELEVENLABS_API_KEY` supplies ElevenLabs, and `ELEVENLABS_VOICE_ID` is optional. Confirm credential presence without printing values. Existing rendering needs no new provider calls if its assets are present.

Async video calls submit once and save state. Subsequent invocations check the existing job and download after the remote file is active. Resume the recorded job after an interruption; do not delete it to force a retry or blindly issue a replacement paid request. If status is ambiguous, read/poll it; if failed, record the failure and choose a bounded recovery within the brief and any budget. Honor a user-provided spending limit.

## Current compositions and revisions

| Composition | Format | Purpose |
| --- | --- | --- |
| `EnvitefyHostMode` | 1080 × 1920, 30 fps, 22 s | Current vertical product story; latest delivered version is in the campaign deliverables record. |
| `EnvitefyHostModeSquare` | 1080 × 1080, 30 fps, 22 s | Square framing and side-by-side product layout; shares source scenes/audio. |
| `EnvitefyIntro` | 1080 × 1920, 30 fps, duration from manifest | Older narrated introduction; keep available, but its voice was not the user's preferred direction. |

Host Mode details that matter when revising:
- `Chaos.tsx` trims the first two source frames and uses playback rate 1.5 to avoid the opening kitchen mismatch.
- `Party.tsx` overlays `bowl-single-hand.mp4` at party-local frames 89–148. Original `party.mp4` supplies the other shots and ambient audio. The full-scene `party-single-hand.mp4` edit is unused because it changed the setting.
- `Product.tsx` keeps each card state and its action explanation together. RSVP capture uses `housewarming@envitefy.com` by changing the capture DOM only, without creating a mailbox or editing app data.
- `final-mix.wav` supplies the music and notification timing. Confirm beat/caption timing if scene lengths change.

## Capture, assemble, and preview

Read relevant parent product catalog entries and renderer routes before promising a feature. Use an existing public sample suitable for that event type; a housewarming screen is not proof that every vertical has identical controls. Wait for fonts, images, and intended UI state before capturing. Keep a true product screenshot separate from illustrative artwork.

Preview uses `npm run dev` at port 3100. The parent application supplies the sample capture at port 3000, via its own `scripts/dev-single.js` flow. Reuse running servers. New compositions should have distinct IDs in `src/Root.tsx`; preserve previously delivered compositions. Use editable Remotion overlays for text and brand assets so aspect-ratio changes stay manageable.

## Review and export

Review a still from each scene and key UI state, then the actual export. Check the first several frames individually and both sides of edited cut boundaries; sampling once per second can miss source-frame defects. For people, inspect identities, setting, wardrobe, hands, props, and contact with objects. Listen to narration/music transitions and check for clipping, abrupt cutoffs, or captions leading the action.

Common commands (substitute the actual composition, version, and frame):

```powershell
npm run lint
npx remotion still EnvitefyHostMode out/host-mode-review.png --frame=230 --scale=0.5 --timeout=120000 --log=error
npx remotion render EnvitefyHostMode out/host-mode-9x16-v4.mp4 --concurrency=2 --timeout=120000 --log=error
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,channels -show_entries format=duration,size -of json out/host-mode-9x16-v4.mp4
```

`npm run lint` runs ESLint and TypeScript. For TS/TSX edits, also use the parent Biome and editor diagnostics commands from the repository instructions. If the optional editor bridge is absent, record that and use standalone checking. Run focused tests when changing functional scripts; ordinary visual changes need rendering/inspection rather than tests that mirror style values.

The package aliases `render:tiktok` and `render:instagram` overwrite their convenience output filenames. For a revision, render to a new versioned file first and update `deliverables.json` after review. Record composition, aspect ratio, dimensions, fps, duration, path, version, and review status. Do not label an assistant-reviewed export as user-approved.

Deliver local media using an absolute path in a Markdown media embed and a direct file link. Keep internal job identifiers and provider debugging out of the viewer-facing video and post copy.

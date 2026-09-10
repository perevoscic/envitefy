# Local campaign engine

Run commands from the saved `video-studio` folder. Runtime: `engine/cli.mjs`; renderer: `src/engine/entry.tsx`. These local files remain ignored under the user's Git preference. The engine is an agent-operated production tool, not an unattended creative generator or a public app feature.

## Commands

```powershell
node engine/cli.mjs init birthday-film --title "Birthday, together" --request "A funny birthday film with a real RSVP demo" --formats 9x16,16x9
node engine/cli.mjs status birthday-film
node engine/cli.mjs resume birthday-film --dry-run
node engine/cli.mjs resume birthday-film
node engine/cli.mjs resume birthday-film --only opening-footage --allow-paid
node engine/cli.mjs render birthday-film --format 9x16 --dry-run
node engine/cli.mjs render birthday-film --format 9x16
node engine/cli.mjs review birthday-film --format 9x16
```

`init` creates campaign records and directories without selecting a creative concept or submitting jobs. Fill its brief and production plan before running production. `init <existing-id> --existing` preserves the existing brief, notes and exports; it refuses to replace an existing production.json. Update projects/README.md with the campaign's real status and deliverables.

`resume` processes local tasks and resumes known provider jobs. `--allow-paid` enables new submissions within the current user-authorized scope; the flag does not itself grant authorization. It requires `budgetUsd` and a conservative `maxCostUsd` for each paid task. Reservations accumulate across takes, including failed/ambiguous submissions. They are a planning guard, not a measurement or guarantee of the provider bill. Verify pricing and units when setting them. Check account availability without exposing credentials. The engine reads the parent .env, .env.local, then process overrides.

Each resume invocation makes at most one status poll per active Google task. Pending tasks remain recorded for another invocation. There is no hidden polling loop or automatic paid retry. CLI status reports missing sources, failed tasks, damaged artifacts and unresolved earlier takes; inspect that result before considering a stage complete.

## Executable production contract

New production plans and briefs default to `gpt-image-2.5-flare` for artwork. Status reports this image model. Generated raster import tasks must include `config.generated: true` and `config.model: "gpt-image-2.5-flare"`; validation rejects missing or different model provenance. Existing sources and previously approved assets do not need regeneration merely to adopt the engine.

`projects/<id>/production.json` uses schemaVersion 1:

```json
{
  "schemaVersion": 1,
  "imageModel": "gpt-image-2.5-flare",
  "id": "birthday-film",
  "title": "Birthday, together",
  "fps": 30,
  "formats": ["9x16", "16x9"],
  "budgetUsd": null,
  "tasks": [
    {
      "id": "opening-footage",
      "kind": "import",
      "dependsOn": [],
      "config": { "source": "public/projects/birthday-film/selected-opening.mp4" }
    }
  ],
  "scenes": [
    {
      "id": "opening",
      "visualTask": "opening-footage",
      "durationFrames": 120,
      "trimBefore": 0,
      "headline": "The party starts here.",
      "layouts": {
        "9x16": { "fit": "cover", "objectPosition": "50% 40%", "textPosition": "top" },
        "16x9": { "fit": "contain", "objectPosition": "50% 50%", "textPosition": "top" }
      }
    }
  ]
}
```

The example source must be selected and exist before execution. Formats are `9x16`, `1x1`, and `16x9`; dimensions are 1080×1920, 1080×1080, and 1920×1080. Every scene needs an explicit layout for every requested format. Scene IDs and scene counts are flexible. There is no five-scene Intro requirement.

Scene options: `audioTask`, `audioOffsetFrames`, `volume` (narration), `sourceVolume` (footage), `playbackRate`, `caption` (supporting copy), `background`, `showBrand`, and `captions` containing `{text,startMs,endMs}` relative to the scene. Speech task timings supply captions unless explicitly overridden. Top-level `musicTask` and `musicVolume` add a full-length soundtrack with a closing fade. The engine refuses cuts beyond available footage, clipped speech, and short music beds. Assemble custom SFX or elaborate mixes as local media and import them.

## Task adapters

### Explicit image model

The user's September 10 request pins new raster artwork and edits to **gpt-image-2.5-flare**. [OpenAI's model reference](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare) identifies it as an image-generation/editing model. This is the model used for visual source assets before the motion stage.

Use the installed ImageGen skill. When its built-in tool does not expose explicit model selection, this user-requested model control authorizes its bundled CLI/model path. Read that skill's CLI reference and run `scripts/image_gen.py generate` or `edit` with `--model gpt-image-2.5-flare`; never rely on its default model. Do not modify the bundled CLI or create a replacement SDK runner. `--dry-run` verifies the exact request without an API call. If the exact model is unavailable, report that limitation rather than switching models.

Save the generation request/provenance privately with the campaign, complete FFmpeg WebP conversion and exact-original cleanup, then import the final WebP with `generated: true`, `model: "gpt-image-2.5-flare"`, and provenance pointing to the actual request record. The engine validates the declaration; the producing agent must verify it against the actual request. An image prompt merely mentioning Flare is not proof of model selection.

| kind | config | Behavior |
| --- | --- | --- |
| import | source, optional provenance/generated | Imports media from studio public/, assets/, or out/. Set generated:true for generated artwork; generated PNG/JPEG must complete the WebP/cleanup workflow first. |
| capture | url, waitFor, optional actions/selector/viewport/scale/fullPage | Headless Playwright capture, waits for fonts/images and requested UI states, writes WebP. Actions are `{type:"click" or "wait",selector:"..."}`. Non-GET/HEAD/OPTIONS requests are blocked to prevent live submissions. Use inspected demo selectors. |
| speech | text, voiceId, model, optional voiceSettings | ElevenLabs timestamped speech using the shared pronunciation controls. Saves audio, captions and a private receipt. No automatic voice selection or audition approval. |
| google-video | prompt, model, optional aspectRatio/resolution/apiRevision/previousTask/referenceTask | Google Interactions video generation, preserving job IDs, continuity lineage and private response records. Model selection is explicit; verify current access. |
| google-music | prompt, model, optional apiRevision | Google Interactions audio generation with the same durable submit/resume path. |

Paid tasks additionally need `maxCostUsd` outside config. A `previousTask` must appear in dependsOn and have a completed Google job. A `referenceTask` must be a dependency producing an image or video; its media is sent as a reference. Only use references authorized for that generation. The user's pronunciation recording is not uploaded by default.

Google request structure follows the studio's working integration. Consult the current [Interactions reference](https://ai.google.dev/api/interactions-api) before changing its contract or model. ElevenLabs uses [speech with timing](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps/). Local tests mock provider responses; they do not certify live account access.

## Cache, recovery and revision

The engine fingerprints task inputs, imported file bytes and dependency fingerprints. Outputs have unique names per fingerprint. Engine state preserves attempts, selected artifacts and their SHA-256 hashes, reserved costs, revisions and exports. Scene-only edits reuse source assets; a new asset take invalidates its dependants. Corrupted imported copies can be restored from their source. Completed provider receipts permit redownloading outputs without a new submission.

`submitting` without a job ID means the outcome is ambiguous. Do not delete the state or increment the take to force another call. For Google, find the real job in provider records and attach it:

```powershell
node engine/cli.mjs recover birthday-film opening-footage --job EXISTING_JOB_ID
node engine/cli.mjs resume birthday-film
```

Speech resumes processing a saved receipt, but cannot recover an unknown synchronous provider response by job ID. Reconcile with the provider before manually recording the outcome. If a task was edited while its older job remained active, restore the earlier configuration from private state/request records and resolve that job first. Failed jobs need an explicit corrected/new take and sufficient budget; there is no automatic charge retry.

```powershell
node engine/cli.mjs revise birthday-film opening-footage --reason "Replace the incorrect hand movement"
```

Locks prevent simultaneous campaign mutations and reclaim a lock only after its recorded process is gone. Existing exports are never overwritten. Renderer, brand, scene and asset changes select a new export version. Read technical review and editorial evidence before updating the latest deliverable.

## Verification and local limits

```powershell
node --test engine/engine.test.mjs
node engine/validate-local.mjs
```

The first exercises caching, revisions, locks, budget reservations, paid-job recovery and provider contracts using fixtures. The second renders new scenes and an existing Host Mode excerpt in all three formats under out/_studio/, tests reuse/revision, and creates technical reports. It needs the local Host Mode export, fonts, wordmark, FFmpeg and Remotion installation; it makes no provider calls. Review the test exports separately from customer-facing deliverables.

The generic renderer supports sequential footage/images, editable overlays, aligned speech and a music bed. Use the existing Remotion workflow for custom choreography, tracking/compositing, elaborate transitions or multiple visual layers. Keep those deliberate edits with the campaign; do not flatten every creative request into the generic layout.

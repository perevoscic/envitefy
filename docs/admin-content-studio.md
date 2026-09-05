# Content Studio

`/admin/marketing-images` is the admin-only workspace for creating and refining Envitefy prompts, social images, and short AI videos. Create starts with an idea; Library reopens saved conversations and earlier campaign runs. Generated versions never replace their ancestors.

## Setup

The app uses its existing Postgres database. Apply the additive migration once per environment:

```sh
node scripts/marketing-studio.mjs migrate
node scripts/marketing-studio.mjs check
node scripts/marketing-studio.mjs providers
```

The maintenance script reads `.env.local`, then `.env`, preserving existing process environment values. `check` reports configuration presence without exposing credentials. `providers` performs a read-only Google model-access check; it does not generate paid media.

Required configuration:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Existing Postgres database; existing `PGSSL_*` configuration is respected. |
| `OPENAI_API_KEY` | Creative direction, captions, image generation, and image editing. |
| `GEMINI_API_KEY` | Google Gemini Omni Flash video access. Existing Google API-key aliases are also accepted. |
| `BLOB_READ_WRITE_TOKEN` | Private media storage. Development falls back to local files only when this token is absent. Required in serverless production. |
| `CRON_SECRET` | Bearer credential sent by the hosting scheduler to the reconciliation endpoint. |

Optional model overrides are `ADMIN_MARKETING_PROMPT_MODEL`, `ADMIN_MARKETING_IMAGE_MODEL`, and `ADMIN_MARKETING_VIDEO_MODEL`. Video defaults to `gemini-omni-1.1-flash`. Models must support the provider operations used here; selecting an arbitrary text model does not enable video generation.

Visible branding is optional. Brand voice and verified product knowledge apply by default. When a logo is requested, the official wordmark is composited rather than redrawn. Video composition needs FFmpeg on the server; it preserves the generated audio.

## Background processing

`vercel.json` invokes `/api/admin/marketing-studio/reconcile` every minute. Set `CRON_SECRET` on the deployment; Vercel sends it as a bearer token. For another host, schedule the same authenticated endpoint every minute. `ADMIN_MARKETING_STUDIO_CRON_SECRET` is an alternative for a custom scheduler.

For development, keep the app running and start a worker in a second terminal:

```sh
node scripts/marketing-studio.mjs reconcile --watch
```

It defaults to `http://localhost:3000`; set `MARKETING_STUDIO_BASE_URL` for another local port or an explicitly targeted deployment. Without a scheduled caller, the browser also refreshes active jobs while the studio is open.

Video runs at Google in the background. The application saves the provider interaction ID and checks it in bounded requests. A database lease prevents two tabs or worker calls from submitting the same version twice. Completed media is copied to private application storage; provider retention is not the Library's storage policy.

An interrupted submission with no confirmed provider ID is marked for attention and is not retried automatically. Check provider usage before explicitly creating a new attempt. Download/finalization failures retry the existing output rather than purchase another generation.

## Data and compatibility

Marketing conversations reuse `conversation_threads` and `conversation_messages`, scoped to `thread_type = 'admin_marketing'`. Thread metadata stores drafts/settings. `admin_marketing_versions` stores inputs, parent version, results, and job state; `admin_marketing_assets` records private media. Access remains shared between verified admins and separate from customer event conversations.

The earlier campaign editor remains at `/admin/marketing-images/legacy`, with existing campaign APIs and assets unchanged. Library links to previous work. `/admin/ad-studio` remains available through Advanced tools.

## Release verification

1. Apply the migration and run the two readiness checks above.
2. Create a prompt, edit it, save it, and reopen it from Library.
3. Generate one image and refine it from its selected original version. Check the download and copied caption.
4. Generate one video, leave the browser closed, and let the scheduled worker finish. Reopen it, play/download the MP4, then refine the video.
5. Verify an earlier campaign still opens and exports.
6. Check the main workspace and settings at mobile and desktop widths, keyboard focus, errors, and version selection.

Generation tests make real billable provider calls. Unit/contract tests use injected providers instead. Deploy only after confirming credentials, storage, and the minute-based scheduler in that environment.

Run the focused automated suite with `node --experimental-transform-types --test src/lib/admin/marketing-studio/*.test.ts src/app/admin/marketing-images/page.test.mjs`. To verify the database constraints against a configured environment, run `node --experimental-transform-types scripts/marketing-studio.mjs verify <marketing-conversation-id>`; temporary test records are rolled back.

## Implementation verification — September 4, 2026

- Applied the additive migration to the configured database; image/video credentials, private Blob storage, and the local worker secret passed readiness checks.
- Verified a real saved prompt, exact manual prompt save, image generation, and refinement from the original image. Each generated image has separate original and finished assets.
- Generated a real portrait video through Gemini Omni Flash, then refined it through its saved interaction. Both independent MP4s are saved in private Blob storage: approximately 10 seconds, H.264 at 720×1280 with AAC audio. The local reconciliation worker processed both jobs.
- Verified unchanged video/audio bytes through finalization, partial responses (206), invalid ranges (416), and attachment download headers against the real MP4. Automated tests also exercise branded video composition with exact audio preservation.
- Ran rollback-only database checks for request deduplication, exact prompts, conflicting requests, cross-conversation parent isolation, single job claims, expired submission protection, and customer-thread isolation.
- All 63 focused studio tests pass, as do the changed navigation guards and four landing tests covering the locked branding. Targeted Biome is clean across 39 files. The TypeScript check reports existing errors in imported discovery dependencies, with no studio diagnostics. The broader admin/middleware suites also contain two existing source-shape failures concerning event navigation. The VS Code diagnostics bridge is unavailable in this environment.
- Final responsive browser review, reference upload, and browser playback checks remain pending: Chrome blocked automation while another extension panel was open, and its file-upload permission was disabled. The temporary mobile viewport could not be reset while that panel was blocking automation.
- Production deployment and its environment-specific scheduler configuration have not been performed. The checked-in cron configuration and setup steps above are ready for deployment.

# Envitefy Video Studio

A local Remotion project for Envitefy marketing videos. **EnvitefyHostMode** is the current 22-second TikTok: fictional host footage, a real product demo, original music, and notification sound effects. **EnvitefyIntro** is the earlier 30-second narrated introduction with ImageGen photography and illustrative cards.

## Start a fresh production task

Use this folder as the primary folder of a local Codex project named **Envitefy Video Studio**: `D:\Develop_local\envitefy\video-studio`. Keep it in place because the working scripts use the parent application's product sources, branding, credentials, and Playwright. For existing assets, use the saved local folder rather than a fresh worktree.

If the studio is not yet listed in Codex's Projects sidebar, create a local project named **Envitefy Video Studio**, attach this folder, and make it primary. Project registration is an app setting, separate from these files. [Official project guide](https://learn.chatgpt.com/docs/projects#use-local-projects-for-folders-and-codebases)

Start a new task there and describe the video naturally:

> Create a 30-second TikTok for parents planning birthday parties. Make it funny and show how guests RSVP.

The [project instructions](AGENTS.md) load the [saved preferences](STUDIO-GUIDE.md) and route production to the [Envitefy Video Producer skill](.agents/skills/envitefy-video-producer/SKILL.md). You can also explicitly invoke `$envitefy-video-producer`. Repository skills under `.agents/skills` are discovered from the task's working folder; start a fresh task if this task's skill list has not refreshed. [Official skills guide](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills)

[Campaign history](projects/README.md) preserves briefs, selected assets, versions and feedback. Lasting preferences are updated in the guide; a one-shot fix stays with its campaign. The existing parent Envitefy project's instructions also point here, so requests from that project can use the same workflow.

## Current TikTok

Preview `http://localhost:3100/EnvitefyHostMode`, then export with `npm run render:tiktok` from this folder. The output is `out/envitefy-tiktok-host-mode.mp4`.

For Instagram's square version, preview `http://localhost:3100/EnvitefyHostModeSquare` and export with `npm run render:instagram`. The output is `out/envitefy-instagram-square.mp4` (1080 × 1080, 30 fps, 22 seconds). This composition uses shot-specific framing, a side-by-side live-card layout, and repositioned captions and CTA while sharing the vertical version's footage and audio.

The story is four seconds of group chat chaos, a half-second pause, seven and a half seconds demonstrating one live event card, and ten seconds enjoying the party. The product screens are captured from the app's public `/showcase/the-carter-housewarming` demo. They do not represent a newly published event. All human footage depicts fictional adults.

Assets and production inputs are in `projects/host-mode/brief.json` and `public/projects/host-mode/`. `GEMINI_API_KEY` supplies Google video and music generation. The asset script persists each job before polling, prevents blind resubmission, and saves provider output locally. Commands `node scripts/generate-host-assets.mjs chaos`, `party`, or `lyria` submit once, then check/download on subsequent invocations. Complete the first video before requesting the party shot; the previous interaction keeps the fictional host consistent. Provider jobs and request records are ignored by Git. A new campaign should use its own project paths and generation state.

`node scripts/capture-host-demo.mjs` captures the local public demo, with optional analytics declined and no RSVP submitted. For this video, the RSVP contact is displayed as `housewarming@envitefy.com`, as requested, by changing the capture page's text only. This does not create a mailbox or change the app's public demo data. Captures are staged and only copied into the video assets after every screen succeeds. `node scripts/compose-host-soundtrack.mjs` builds the local fallback instrumental and precisely timed notification effects. `node scripts/mix-host-soundtrack.mjs` combines the notification introduction with the generated Lyria instrumental into the final 22-second audio mix. ElevenLabs Music returned a paid-plan requirement on this account; it is not needed to render the completed TikTok.

## Run

From `video-studio`:

```sh
npm install
npm run voices
npm run narration -- intro
npm run dev
```

The preview is at `http://localhost:3100/EnvitefyIntro`. Export when ready:

```sh
npm run render
```

Output: `out/envitefy-intro.mp4` (1080 × 1920, 30 fps). Timing and subtitles are saved in `public/projects/intro/manifest.json` and `captions.srt`. Duration follows actual narration and holds the closing scene to reach the brief's target when narration is shorter. Longer narration extends the video; it is never cut to meet a target.

## Credentials and narration

The Node narration script reads the parent repository's `.env`, then `.env.local`, then process environment overrides. Configure `ELEVENLABS_API_KEY` there. An optional `ELEVENLABS_VOICE_ID` overrides the brief's library narrator. Credentials are used only by the Node script and are never included in the browser manifest or bundle.

Requests go to ElevenLabs' speech-with-timestamps endpoint. Character alignment is converted to Remotion caption words; FFprobe measures the saved audio to calculate scene boundaries. Audio and timing are cached by voice, model, settings, text, and output format. Unchanged scenes are reused on a rerun. Changes consume additional provider credits. Calls are sequential and fail on provider errors; there is no automatic paid retry loop.

## Reuse the older narrated Intro template

For a fresh concept, use the producer skill and [planning brief](templates/campaign-brief.json); the workflow is not restricted to this older five-scene introduction. The steps below apply only when intentionally reusing its renderer and narration schema.

1. Copy `projects/intro/brief.json` into `projects/<new-id>/brief.json`. Keep the five scene IDs (`hook`, `create`, `share`, `updates`, `payoff`) when using this introduction template.
2. Set the audience, script, voice, target duration, and a fresh art direction. Vary people, locations, composition, palette accents, and animation between campaigns. Keep people consistent within a video's story when appropriate.
3. Generate new artwork with ImageGen in Codex and copy its output into `public/images/`. Set `heroImage` to the new relative asset path. ImageGen generation is an agent step; the narration CLI does not generate images.
4. Use `src/lib/product-marketing-catalog.ts` in the parent app to validate each claim. Use current product screenshots for an actual UI demonstration, or clearly identify illustrative cards.
5. Run `npm run narration -- <new-id>`. In Remotion Studio, change `projectId` in the composition's props, or render with `npx remotion render EnvitefyIntro out/<new-id>.mp4 --props='{"projectId":"<new-id>"}'`.
6. Preview every scene, inspect caption timing and text placement, and render the MP4. For a new scene structure, add scene components and update the renderer and manifest validation together.

Branding uses the exact user-selected PNG files: parent `public/email/envitefy-wordmark-email.png` and `public/icons/apple-touch-icon-120.png`, copied byte-for-byte into `public/brand/`. Do not redraw or restyle them. Bundled Josefin fonts retain their OFL notices. The supporting photograph for the earlier introduction is `public/images/garden-party.png`, generated with ImageGen on September 5, 2026; it depicts fictional people.

## Checks

```sh
npm test
npm run lint
```

The root project's Biome linter can also check `video-studio/src` and `video-studio/scripts`. Use the root `lint:vscode` command when its editor diagnostics bridge is running.

This is a local production tool. It does not add a public Envitefy feature or connect to admin Marketing Studio yet. Remotion company licensing and ElevenLabs commercial-use plan requirements apply to production use.

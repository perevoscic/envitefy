# Envitefy Video Studio

This folder is the working home for Envitefy video production. A request to create a video means produce and review the finished export, using the existing local pipeline.

## Start a video task

- Read [STUDIO-GUIDE.md](STUDIO-GUIDE.md) for the user's standing preferences.
- Use [envitefy-video-producer](.agents/skills/envitefy-video-producer/SKILL.md) for concepts, new videos, video revisions, format adaptations, and associated post copy.
- Read [projects/README.md](projects/README.md) to locate prior work. For a revision, read that campaign's brief, production notes, feedback, and deliverables before changing assets.
- Infer routine creative choices from the request and saved preferences. Ask only when missing information materially changes the deliverable; continue independent work while waiting.
- A new video gets its own campaign folder and fresh art direction. Revisions and alternate aspect ratios stay with their original campaign.
- Save every export, intermediate render, thumbnail, contact sheet, and review image inside `out/<campaign>/`. Never save video-specific files directly in `out/`. Keep revisions and alternate formats in that same folder, with versioned filenames. Set each composition's `calculateMetadata().defaultOutName` to `<campaign>/<filename-without-extension>` so Studio and CLI renders use the folder automatically; explicit render paths must also include it.

## Memory that survives tasks

- `STUDIO-GUIDE.md` is the single source for standing creative preferences. Update it when the user expresses a lasting preference; record its date and scope. Specific scene fixes belong in campaign feedback instead. New instructions from the user take precedence.
- `projects/<campaign>/brief.json` records the request, chosen concept, audience, formats, audio direction, and product proof.
- `projects/<campaign>/production-notes.md` records generation inputs, selected assets, continuity, rendering, and verification.
- `projects/<campaign>/feedback.md` records requested revisions and their resolution.
- `projects/<campaign>/deliverables.json` points to the latest reviewed export for each aspect ratio. Version filenames so prior delivered exports remain available.
- Update `projects/README.md` when adding or completing a campaign. These are local records; do not imply that every past conversation is automatically loaded.

## Local boundaries and dependencies

Standing Git preference (September 10, 2026, clarified): preserve the studio's reusable knowledge on GitHub: `README.md`, `AGENTS.md`, `STUDIO-GUIDE.md`, `.gitignore`, `.agents/skills/envitefy-video-producer/`, `templates/campaign-brief.json`, and the written pronunciation reference at `assets/brand/audio/pronunciation.json`. Keep generated videos, images, audio, exports, campaign records, production source code, and scripts local and ignored. The root `.gitignore` lists the allowed guidance files; `.dockerignore` excludes the entire studio from application container uploads. Do not force-add local production files. If one is already tracked, remove only its Git index entry with `git rm --cached`, preserving the local file. Campaign history and the audio recordings referenced by the written guidance still live in this local studio. The user chose current-branch cleanup only; preserve older Git history.

Run studio commands from this folder. The parent folder is the Envitefy application, not another video campaign. Its marketing catalog at `../src/lib/product-marketing-catalog.ts` is the source for customer-facing claims; use relevant entries rather than copying the full inventory into video instructions.

The parent `.env` and `.env.local` supply server-side provider credentials. Never copy them into briefs, public assets, browser bundles, or skill files. The current studio relies on parent branding, product sources, and Playwright, so use this saved local folder when working with existing uncommitted media.

Remotion preview uses port 3100; the app's demo capture uses port 3000. Check existing servers before starting them. Video source and output belong here; edits to the live application require a task that calls for them.

The skill contains the workflow and links to the scripts. Do not assume the existing Host Mode generator can accept a new campaign ID: its paths and shots are campaign-specific.

## Campaign engine

The reusable local runner is `engine/cli.mjs`; its contract and recovery rules are in the producer skill's [engine reference](.agents/skills/envitefy-video-producer/references/engine.md). New engine campaigns use `production.json` alongside the creative `brief.json`. Start revisions with status, retain unchanged assets, and resolve recorded provider jobs before submitting another take. The engine is local production code and remains ignored with the renderer in `src/engine/`.

Run `node --test engine/engine.test.mjs` after functional engine changes. `node engine/validate-local.mjs` renders a local three-format validation under out/_studio/ without paid generation. A technical pass leaves creative review pending; use the [review reference](.agents/skills/envitefy-video-producer/references/review.md) and never treat editor review as user approval.

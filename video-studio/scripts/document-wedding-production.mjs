import fs from 'node:fs';import path from 'node:path';
const project='projects/wedding-200-texts/',out='out/wedding-200-texts/';
const workspace=process.cwd();
for(const name of ['chaos-contact.jpg','payoff-contact.jpg','ui-inspection.png']){
 const source=path.resolve(project,name),destination=path.resolve(out,name);
 if(!source.startsWith(workspace+path.sep)||!destination.startsWith(workspace+path.sep))throw new Error('Unexpected output path');
 if(fs.existsSync(source)&&!fs.existsSync(destination))fs.renameSync(source,destination);
}
const job=project+'payoff-clean-job.json';const state=JSON.parse(fs.readFileSync(job,'utf8'));state.localDisposition='rejected-take';state.lastObservedPollError={httpStatus:400,code:'content_blocked'};state.recovery='Selected a new six-second image-referenced toast take instead.';fs.writeFileSync(job,JSON.stringify(state,null,2));
const notes=`# Wedding 200 Texts — production notes

## Request and organization
- One 25-second 9:16 TikTok, 1080 × 1920 at 30 fps.
- Follow-up: user requested a dedicated output folder matching existing campaigns. Created out/wedding-200-texts/; all final exports and visual review outputs are kept there.
- Final composition: EnvitefyWedding200Texts. Editable source: src/Wedding200Texts.tsx and src/wedding-200-texts/.
- Exact supplied public/brand/envitefy-com.png appears during share and on the end card, preserving transparency, colors and proportions. No duplicate domain line.

## Selected moving footage
- chaos.mp4: fresh fictional South Asian woman in rose satin and East Asian man in forest knit polo, candlelit restaurant dinner. Use 0–7 seconds with native dialogue intact. Source is 720 × 1280 at 24 fps; final is upscaled to 1080 × 1920 at 30 fps.
- share-edit.mp4: same opening source from 7 seconds, 1.4x for a 1.2-second sharing moment.
- guests.mp4: new woman on sofa and man at cafe, actual moving phone-use shots. Final inserts at 10.8–11.4 and 14.7–15.3 seconds.
- payoff-toast.mp4: SELECTED ending. New six-second moving shot conditioned on toast-reference.png, matching couple/wardrobe/restaurant. Final uses first 4.5 seconds. Consistent two pale-wine glasses, one clink, native line, slow lowering.
- Original payoff.mp4 appended opening footage and had a duplicate wine glass. First cleanup poll returned provider content_blocked; recorded as rejected. payoff-refined.mp4 removed the duplicate but retained wine color drift and added repeated speech/generated subtitles. Both takes rejected. Final toast is clean and has no repeated speech/subtitles.
- Google gemini-omni-1.1-flash supplied footage, lyria-3-clip-preview supplied original instrumental. Saved private job/request records allow resumption without duplicate submissions.

## Real interface demonstration
- Public real sample: https://envitefy.com/showcase/garden-vows, elegant actual Garden Vows wedding live card for Ava & James at The Conservatory, October 10, 4:30 PM.
- Actual production app HTML and assets captured with Playwright. Native RSVP configuration was enabled only in an isolated local fixture to demonstrate the real existing RSVP form. Replaced sample example.com contact with wedding-demo@envitefy.com only in capture fixture; no mailbox provisioned.
- All non-GET/HEAD external requests blocked. Fictional /api/events/demo-wedding-200-texts/rsvp response fulfilled locally; no real RSVP submitted. Evidence: capture-network-safety.json and demo-response.json.
- Share copied actual showcase URL; evidence share-verification.json. Actual read-only calendar GET saved wedding-invitation.ics and verified BEGIN:VEVENT, timing, title and location.
- Calendar demo represents manual calendar save; this sample ICS carries no explicit VALARM. The requested “Calendar reminders” caption is accompanied by the accurate action “Add it to your calendar” / “Calendar file saved”; no automatic reminder setup is demonstrated or claimed.
- Details 8.2–10.8, RSVP 11.4–14.7, calendar 15.3–18.0. Demo video crops the actual 398 × 597 live card from 430 × 760 browser recording; no generated UI replacement.

## Dialogue and audio
- Native opening: “We said I do, not I’ll answer two hundred texts.” ElevenLabs forced alignment locates speech at 2.579–6.579 seconds. Captions display matching phrases.
- Native ending: “Now… the seating chart.” Exact alignment within ending 1.199–2.659 seconds, final timeline 19.199–20.659 seconds.
- Original playful pizzicato/bass/percussion groove; synthesized quiet buzz/chime effects. Speech ducking, clean clink, music fully stops at 20.729 seconds. Restaurant ambience fades at 22.5; end card silent.
- Mix final AAC measured -17.06 LUFS integrated and -1.48 dBTP. No clipped sentence or repeated line. Use final-mix.wav, do not reuse rejected-take audio.

## Verification
- ESLint and TypeScript passed (npm run lint); parent Biome lint passed for all seven touched TS/TSX files.
- Optional VS Code diagnostics bridge unavailable; tool reported “Could not find a Chat to CLI linter bridge.” Standalone TypeScript and both linters passed.
- Rendered and visually inspected opening, card, exact logo and end card; inspected final contact sheet plus first frames and both sides of scene boundaries, guest cut-ins, RSVP confirmation, calendar controls, toast and reaction.
- FFprobe: H.264, 1080 × 1920, 30 fps, 750 decoded frames, exactly 25.000 seconds; stereo 48 kHz AAC; 12,836,374 bytes. Full ffmpeg decode completed without errors. Loudness and silence reports saved.
- Final assistant review is not user approval.

## Commands
- node scripts/generate-wedding-assets.mjs chaos guests music (resume saved jobs)
- node scripts/generate-wedding-toast.mjs then node scripts/generate-wedding-assets.mjs payoff-toast (resume selected ending)
- node scripts/capture-wedding-demo.mjs (all external writes blocked)
- node scripts/prepare-wedding-edit.mjs demo / payoff / audio
- node scripts/align-wedding-dialogue.mjs opening / ending
- npx remotion render EnvitefyWedding200Texts out/wedding-200-texts/wedding-200-texts-9x16-v1-render.mp4 --concurrency=2 --timeout=120000 --log=error
- node scripts/package-wedding-final.mjs
`;
fs.writeFileSync(project+'production-notes.md',notes);
fs.writeFileSync(project+'feedback.md','# Feedback\n\n- 2026-09-05: User requested a separate folder in out/ matching other videos. Created out/wedding-200-texts/ and placed the final video, intermediate render, and visual review files there. Standing preference already recorded in STUDIO-GUIDE.md.\n');

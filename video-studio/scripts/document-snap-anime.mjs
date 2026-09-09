import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
const p='projects/mom-just-snap-it',a='public/projects/mom-just-snap-it',out='out/mom-just-snap-it';
const files=await fs.readdir(a);const assets=[];
for(const name of files){const bytes=await fs.readFile(a+'/'+name);assets.push({path:a+'/'+name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),sharedBy:['EnvitefySnapAnimeWide','EnvitefySnapAnimeVertical']});}
await fs.writeFile(p+'/shared-assets.json',JSON.stringify({singleTimeline:true,sceneComponent:'src/mom-just-snap-it/SnapAnime.tsx',audio:'public/projects/mom-just-snap-it/final-mix.wav',assets},null,2));
const notes=`
## Selected production and corrections

- Four source anime scenes generated once for this production in landscape 1920 × 1080 at 24 fps, conformed to 30 fps during the shared edit. Both responsive formats reference the same selected files; no vertical animation was independently generated.
- Opening uses 0–7 seconds of opening.mp4. Unrequested mother ad-lib at 2.15–3.9 seconds is removed from the shared soundtrack; physical paper flutter remains.
- Discovery removes the repeated second “make it digital” phrase (5.8–7.35 seconds). Digital scene removes the repeated second “share it with” (8.43–8.87). Picture and dialogue use matching cuts; only short end holds fill the specified scene lengths.
- Camera insert uses the stable source span beginning 2.4 seconds, excluding its initial reference replay. The single camera-final.mp4 contains tracked screen replacement and editable-code lettering composited on the physical invitation. Gray-screen segmentation preserves the animated fingertip and bezel. Shutter contact/flash is at shared scene frame 35 (global frame 515); the same effect timing is used in both formats.
- Payoff-clean is an edit of the original payoff that clears the fridge after the removal insert. The montage is shortened before speech to keep the complete payoff line at the 31-second brand transition. Original complete payoff dialogue is retained in the common soundtrack.
- Native source dialogue is edited only once. Offline base.en and small.en transcript checks confirm all four requested passages, with no extra line or duplicate phrase in the final mix. Transcription does not establish brand phonetics.
- Original Lyria music is retimed from 30 to 35 seconds and ducked beneath dialogue. Native paper sounds, shared synthesized shutter/taps/detail-transfer/chime effects, and fade-out are mixed into one 48 kHz stereo WAV. One AAC encode is muxed into both final MP4s.

## Actual product demonstration

- The running parent app returned HTTP 500. Captures use an isolated local bundle of the current unmodified BirthdaySkin, EventGuestActions and SnapLaunchCards components, with the authenticated Snap heading treatment and the app's previously saved compiled stylesheet. Fictional party data is supplied to these actual components; no customer record, RSVP, message or calendar write occurred.
- Exact party: Mia’s 8th Birthday, October 17, 2026, 2–4 PM America/Chicago; Maple Park, 820 W 7th Street, Austin, TX. This is a fictional campaign sample, not a claim of a real scheduled party. Demo contact birthday-demo@envitefy.com is not represented as a provisioned mailbox.
- Received-invitation RSVP uses the extracted host contact. The footage does not present a newly invented hosted attendance form.
- Actual Share event control copied https://envitefy.com/event/mias-8th-birthday into the isolated browser clipboard. No message was sent to Dad; the copy describes the next sharing action.
- Actual buildCalendarLinks generated Google, Outlook and Apple URLs. The unchanged local /api/ics GET implementation was invoked directly because the running app route was unhealthy. Its real REQUEST ICS output is retained as birthday.ics; title, UTC start 20261017T190000Z and end 20261017T210000Z pass validation.
- Calendar app confirmation/saved views are explicitly labelled “Calendar preview”; they illustrate the required native Add confirmation. This manual ICS route does not require linking a calendar account to Envitefy. OAuth is not skipped or falsely shown as completed.

## Review and limitations

- Moving half-size previews of both full 35-second layouts were rendered before final encoding, plus every story and product state. Additional review corrected vertical face crops, calendar overflow, RSVP button cropping, and the gray phone display. Final file decode/spec/audio identity and cut-boundary checks are recorded separately.
- Studio ESLint and TypeScript passed. Focused parent Biome passed. The optional VS Code diagnostics bridge is absent; the parent lint wrapper also scans unrelated repository files and reports existing errors, so focused checks supply the touched-file result.
- Automatic approval review rejected uploading the supplied private pronunciation reference and generated dialogue to Google Gemini for analysis because this exact payload/destination was not explicitly approved. An approval question is pending. No upload was performed and no alternate upload route was attempted. Exact brand pronunciation against the reference remains unverified; do not describe these exports as having passed that audio comparison.
- The cast reference was converted with FFmpeg libwebp quality 85/compression 6, decoded and verified at 1672 × 941. The exact generated PNG original was removed under the standing cleanup authorization. Code-rendered flyer WebP is verified at 900 × 1100; its temporary PNG was removed. Supplied brand PNG and actual UI screenshots remain intact as source assets.

## Editable project

Shared scene source: src/mom-just-snap-it/SnapAnime.tsx. Shared captions: src/mom-just-snap-it/captions.json. Both compositions are registered in src/Root.tsx. Original and selected assets are retained in public/projects/mom-just-snap-it. All outputs/review media are in out/mom-just-snap-it.

Reproduce selected edit with prepare-snap-anime-edit.mjs, composite-snap-anime-camera.py, letter-snap-anime-invitation.py and mix-snap-anime.mjs. Render both with node scripts/render-snap-anime-final.mjs. Provider generation scripts resume saved jobs and must not be blindly re-submitted.
`;
await fs.appendFile(p+'/production-notes.md',notes);
await fs.writeFile(p+'/README.md',`# Envitefy — Mom, Just Snap It!\n\nOne shared 35-second / 1050-frame timeline, two responsive layouts.\n\n- EnvitefySnapAnimeWide: 1920 × 1080 at 30 fps.\n- EnvitefySnapAnimeVertical: 1080 × 1920 at 30 fps.\n\nEditable scene and layout: ../../src/mom-just-snap-it/SnapAnime.tsx\nShared source library: ../../public/projects/mom-just-snap-it/\nOutputs and review media: ../../out/mom-just-snap-it/\n\nRun npm run dev from video-studio, then select either composition. Run node scripts/render-snap-anime-final.mjs to export both with one identical encoded soundtrack. See production-notes.md for source selection, workflow proof, limitations and pending pronunciation review.\n`);
let brief=JSON.parse(await fs.readFile(p+'/brief.json','utf8'));brief.status='final exports rendering; pronunciation comparison pending approval';brief.event.rsvp='Host email extracted from invitation: birthday-demo@envitefy.com (fictional demo contact)';await fs.writeFile(p+'/brief.json',JSON.stringify(brief,null,2));
let index=await fs.readFile('projects/README.md','utf8');if(!index.includes('[Mom, Just Snap It!]'))index=index.replace('| --- | --- | --- |','| --- | --- | --- |\n| [Mom, Just Snap It!](mom-just-snap-it/brief.json) | One 35-second anime production with two responsive layouts and identical shared source media/audio. Visual previews completed; final exports rendering, reference-pronunciation comparison pending approval. | `out/mom-just-snap-it/envitefy-snap-anime-16x9.mp4`; `out/mom-just-snap-it/envitefy-snap-anime-9x16.mp4`. |');await fs.writeFile('projects/README.md',index);
console.log('Campaign provenance, shared hashes, product proof and pending audio-review status recorded.');

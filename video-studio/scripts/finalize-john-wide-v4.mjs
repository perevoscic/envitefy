import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const dir='projects/john-space-disco/';
const file='out/john-space-disco/john-space-disco-16x9-v4.mp4';
const qa=JSON.parse(await fs.readFile(dir+'wide-export-checks-v4.json','utf8'));
const bytes=await fs.readFile(file);
if(!qa.fullDecodePassed||!qa.videoStreamUnchanged||Number(qa.probe.format.duration)!==30||Number(qa.probe.format.size)!==bytes.length)throw Error('V4 checks do not match export');
const transcript=JSON.parse(await fs.readFile(qa.localTranscript,'utf8'));
if(!transcript.some(s=>/Bring their birthday ideas to life with .*Concierge/i.test(s.text)))throw Error('Complete new narration not confirmed');
const entry={version:4,composition:'EnvitefyJohnSpaceDiscoWide',aspectRatio:'16:9',width:1920,height:1080,fps:30,durationSeconds:30,frames:900,path:file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),reviewStatus:'assistant-reviewed',userApproved:false,reviewedAt:new Date().toISOString(),reviewNotes:'Updated brand narration to in-VY-tee-fy with primary stress on VY. Explicit CMU phonemes verified in the speech request and returned provider alignment. Complete line verified locally; full decode, exact format/duration and audio levels passed. Video stream hash matches V3 exactly, preserving every reviewed visual fix.'};
for(const name of ['deliverables-16x9.json','deliverables.json']){
 const data=JSON.parse(await fs.readFile(dir+name,'utf8'));
 data.status='reviewed';
 data.exports=[...(data.exports||[]).filter(e=>!(e.aspectRatio==='16:9'&&e.version===4)),entry];
 data.latestReviewedByAspect={...data.latestReviewedByAspect,'16:9':file};
 await fs.writeFile(dir+name,JSON.stringify(data,null,2)+'\n');
}
const note='\n## V4 completed — in-VY-tee-fy\n\nSeptember 8, 2026: User changed the brand pronunciation to **in-VY-tee-fy**, with primary stress on VY. Updated the current studio guide, production skill/reference, shared brand guidance and speech helper. Historical delivered versions remain available.\n\nThe creation line uses the same Jessica voice with Flash v2 and explicit CMU `IH0 N V AY1 T IY0 F AY0`; returned provider alignment includes `@ih0@n@v@ay1@t@iy0@f@ay0`. This sets VY as stressed and tee as unstressed. The complete spoken line was checked locally, including after mixing. Automatic transcription was used for completeness, not as proof of stress. Request/alignment records provide the exact configured pronunciation.\n\nNew source: public/projects/john-space-disco/vo-create-wide-v4.mp3 (3.004 seconds). New master: wide-final-mix-v4.wav. Narration begins at 5.35 seconds and fits completely before the next scene. Final MP4 copies the V3 H.264 stream exactly; its video-stream SHA-256 matches V3, so all 900 reviewed frames and visual corrections are preserved. Full decode passed; final duration is exactly 30 seconds at 1920 × 1080, 30 fps, stereo 48 kHz AAC. Measured loudness: -15.1 LUFS, true peak -1.5 dBFS.\n\nShared pronunciation tests, ESLint, TypeScript and Biome passed. Final checks: wide-export-checks-v4.json. Reproduction: scripts/john-wide-voice.mjs create v4; scripts/prepare-john-wide-v4.mjs; scripts/verify-john-wide-v4.mjs. Current default composition output: john-space-disco/john-space-disco-16x9-v4.\n\nLatest assistant-reviewed export: '+file+'. No publishing or user approval of the final media is implied.\n';
await fs.appendFile(dir+'production-notes-16x9.md',note);
await fs.appendFile(dir+'revision-16x9-v4.md',note);
await fs.appendFile(dir+'feedback-16x9.md','\n2026-09-08 V4: User requested **in-VY-tee-fy**. Updated the saved pronunciation and replaced the creation narration using explicit primary VY stress. Preserved the complete V3 video stream. Final reviewed export: '+file+'.\n');
const shared=JSON.parse(await fs.readFile(dir+'deliverables.json','utf8'));
let index=await fs.readFile('projects/README.md','utf8');
index=index.split('\n').map(line=>line.startsWith('| [John’s Space Dino Disco]')?'| [John’s Space Dino Disco](john-space-disco/brief.json) | 30-second 3D birthday fantasy with real Concierge/actions and same-link updates. Horizontal V4 uses in-VY-tee-fy narration and preserves V3’s character, laptop and Live Cards fixes. | Horizontal: `'+file+'`; vertical: `'+shared.latestReviewedByAspect['9:16']+'`. See [deliverables](john-space-disco/deliverables.json), [widescreen notes](john-space-disco/production-notes-16x9.md), and [vertical notes](john-space-disco/production-notes-9x16.md). |':line).join('\n');
await fs.writeFile('projects/README.md',index);
console.log(JSON.stringify(entry,null,2));

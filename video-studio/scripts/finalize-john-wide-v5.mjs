import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {ENVITEFY_IPA,ENVITEFY_SSML,toDisplayText} from './brand-pronunciation.mjs';
const dir='projects/john-space-disco/';
const file='out/john-space-disco/john-space-disco-16x9-v5.mp4';
const qa=JSON.parse(await fs.readFile(dir+'wide-export-checks-v5.json','utf8'));
const bytes=await fs.readFile(file);
if(!qa.fullDecodePassed||!qa.videoStreamUnchanged||Number(qa.probe.format.duration)!==30||Number(qa.probe.format.size)!==bytes.length)throw Error('V5 checks do not match export');
if(ENVITEFY_IPA!=='ɪnˈvaɪtiˌfaɪ'||ENVITEFY_SSML!==qa.pronunciation.ssml)throw Error('Shared pronunciation changed before completion');
if(!toDisplayText(qa.pronunciation.providerAlignedText).includes('with Envitefy Concierge'))throw Error('Caption spelling normalization failed');
const transcript=JSON.parse(await fs.readFile(qa.localTranscript,'utf8'));
if(!transcript.some(s=>/Bring their birthday ideas to life with .*Concierge/i.test(s.text)))throw Error('Incomplete narration');
const entry={version:5,composition:'EnvitefyJohnSpaceDiscoWide',aspectRatio:'16:9',width:1920,height:1080,fps:30,durationSeconds:30,frames:900,path:file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),reviewStatus:'assistant-reviewed',userApproved:false,reviewedAt:new Date().toISOString(),reviewNotes:'Creation narration regenerated with the exact user IPA tag <phoneme alphabet="ipa" ph="ɪnˈvaɪtiˌfaɪ">Envitefy</phoneme>. The global speech helper, compatible-model routing, dialogue prompts and standing brand guidance use that pronunciation. Exact request, complete spoken line, full decode, 30-second format, audio levels and unchanged video-stream hash verified.'};
for(const name of ['deliverables-16x9.json','deliverables.json']){
 const data=JSON.parse(await fs.readFile(dir+name,'utf8'));
 data.status='reviewed';
 data.exports=[...(data.exports||[]).filter(e=>!(e.aspectRatio==='16:9'&&e.version===5)),entry];
 data.latestReviewedByAspect={...data.latestReviewedByAspect,'16:9':file};
 await fs.writeFile(dir+name,JSON.stringify(data,null,2)+'\n');
}
const note='\n## V5 completed — exact IPA for all new Envitefy audio\n\nSeptember 8, 2026: User supplied **Inviteefy**, IPA **/ɪnˈvaɪtiˌfaɪ/**, and the exact tag `<phoneme alphabet="ipa" ph="ɪnˈvaɪtiˌfaɪ">Envitefy</phoneme>`, asking that it apply to all Envitefy audio. This supersedes all earlier pronunciation variants. The shared helper, compatible-model selection, reusable speech generators, native-dialogue prompt direction, studio guide and brand/producer skills now use this exact specification. Older setup code is guarded against restoring obsolete defaults. Written branding remains Envitefy. Previous exported revisions remain available.\n\nThe horizontal V5 creation line was regenerated as vo-create-wide-v5.mp3 using the exact IPA tag. The completed private request records its precise text; provider normalized alignment is retained. For IPA input the provider returned zero-stress CMU token labels, so those labels and automatic transcription are not used as an acoustic stress judgment. The exact requested input and complete final spoken line were verified. Caption normalization handles these returned token labels.\n\nMaster: wide-final-mix-v5.wav. Final MP4 copies the V4 video stream exactly, retaining all 900 previously reviewed frames. All visual corrections, actual product demonstrations and the Live Cards closing label remain intact. Full decode passes, duration is exactly 30 seconds, dimensions 1920 × 1080 at 30 fps, stereo 48 kHz AAC. Loudness is -15.2 LUFS; true peak -1.5 dBFS. The new line begins at 5.35 seconds and ends within its creation scene.\n\nNine shared speech/caption tests passed. Actual returned alignment was tested against official caption spelling. ESLint passed with Node globals for scripts; TypeScript and Biome passed for touched composition sources. The optional editor diagnostics bridge remains unavailable as previously recorded. Full media checks are in wide-export-checks-v5.json.\n\nReproduce with scripts/john-wide-voice.mjs create v5, scripts/package-john-wide-audio.mjs v5, and scripts/verify-john-wide-v5.mjs. Default output: john-space-disco/john-space-disco-16x9-v5. Latest assistant-reviewed file: '+file+'. No publishing or user approval of the completed media is implied.\n';
await fs.appendFile(dir+'production-notes-16x9.md',note);
await fs.writeFile(dir+'revision-16x9-v5.md','# Horizontal V5 — exact IPA pronunciation\n'+note);
await fs.appendFile(dir+'feedback-16x9.md','\n2026-09-08 V5: Applied user’s exact IPA `/ɪnˈvaɪtiˌfaɪ/` and IPA phoneme tag to current narration and all shared speech-generation defaults. V5 preserves every V4 video frame. Export: '+file+'.\n');
const shared=JSON.parse(await fs.readFile(dir+'deliverables.json','utf8'));
let index=await fs.readFile('projects/README.md','utf8');
index=index.split('\n').map(line=>line.startsWith('| [John’s Space Dino Disco]')?'| [John’s Space Dino Disco](john-space-disco/brief.json) | 30-second 3D birthday fantasy with real Concierge/actions and same-link updates. Horizontal V5 uses the exact Inviteefy IPA and preserves the character, laptop and Live Cards fixes. | Horizontal: `'+file+'`; vertical: `'+shared.latestReviewedByAspect['9:16']+'`. See [deliverables](john-space-disco/deliverables.json), [widescreen notes](john-space-disco/production-notes-16x9.md), and [vertical notes](john-space-disco/production-notes-9x16.md). |':line).join('\n');
await fs.writeFile('projects/README.md',index);
console.log(JSON.stringify(entry,null,2));

import fs from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';
const b='public/projects/john-space-disco/',o='out/john-space-disco/',p='projects/john-space-disco/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit',windowsHide:true});if(r.status)throw Error('FFmpeg failed');}
const request=JSON.parse(fs.readFileSync(p+'voice-create-wide-v4-request.json','utf8'));
if(request.status!=='completed'||!request.body.text.includes('IH0 N V AY1 T IY0 F AY0'))throw Error('Expected completed VY-stressed speech request');
const alignment=JSON.parse(fs.readFileSync(p+'voice-create-wide-v4-alignment.json','utf8'));
const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',b+'vo-create-wide-v4.mp3'],{encoding:'utf8'}).trim());
if(duration>6.4||duration<2)throw Error('Narration duration needs review');
const line=fs.readFileSync('scripts/mix-john-wide-v3.mjs','utf8').split('\n').find(s=>s.startsWith('const filter=')).trim();
const filter=JSON.parse(line.slice('const filter='.length,-1));
ff(['-i',b+'music.mp3','-i',b+'wide-edit-hook-v3.mp4','-i',b+'wide-edit-update.mp4','-i',b+'wide-edit-payoff.mp4','-i',b+'vo-create-wide-v4.mp3','-i',b+'vo-update.mp3','-i',b+'wide-effects.wav','-filter_complex',filter,'-map','[a]','-ar','48000','-ac','2','-c:a','pcm_s16le',b+'wide-final-mix-v4.wav']);
ff(['-i',o+'john-space-disco-16x9-v3.mp4','-i',b+'wide-final-mix-v4.wav','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-af','atrim=duration=30','-t','30','-movflags','+faststart',o+'john-space-disco-16x9-v4.mp4']);
ff(['-i',b+'vo-create-wide-v4.mp3','-ac','1','-ar','16000',o+'wide-v4-voice-review.wav']);
ff(['-ss','5.35','-i',o+'john-space-disco-16x9-v4.mp4','-t','4','-vn','-ac','1','-ar','16000',o+'wide-v4-final-voice-review.wav']);
for(const [file,oldName,newName] of [
 ['src/JohnSpaceDiscoWide.tsx','wide-final-mix-v3.wav','wide-final-mix-v4.wav'],
 ['src/Root.tsx','john-space-disco/john-space-disco-16x9-v3','john-space-disco/john-space-disco-16x9-v4'],
])fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(oldName,newName));
fs.writeFileSync(p+'wide-v4-voice-production.json',JSON.stringify({spokenName:'in-VY-tee-fy',cmu:'IH0 N V AY1 T IY0 F AY0',primaryStress:'VY',sourceDurationSeconds:duration,mixStartSeconds:5.35,mixEndSeconds:5.35+duration,providerAlignedText:alignment.characters.join(''),source:'vo-create-wide-v4.mp3',writtenBrand:'Envitefy',reference:'https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices'},null,2)+'\n');
console.log('V4 created with the new narration and the original V3 video stream.');
console.log(JSON.stringify({duration,providerAlignedText:alignment.characters.join('')}));

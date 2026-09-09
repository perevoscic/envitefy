import fs from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
const b='public/projects/john-space-disco/',o='out/john-space-disco/',p='projects/john-space-disco/',voice='vo-create-jessica-user-reference-v1.mp3';
const review=JSON.parse(fs.readFileSync(p+'user-reference-narration-comparison.json','utf8'));
if(!review.review.phoneticMatch||!review.review.stressMatch||!review.review.naturalCandidateDelivery||review.review.candidateIPA.replaceAll('/','')!=='ɪnˈvaɪtɪfaɪ')throw Error('Reference comparison failed');
const voiceHash=crypto.createHash('sha256').update(fs.readFileSync(b+voice)).digest('hex');
if(voiceHash!==review.candidateHash)throw Error('Reviewed voice changed');
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit',windowsHide:true});if(r.status)throw Error('FFmpeg failed');}
function savedFilter(path){const line=fs.readFileSync(path,'utf8').split('\n').find(x=>x.startsWith('const filter=')).trim();return JSON.parse(line.slice('const filter='.length,-1));}
const revisions=[
 {aspectRatio:'9:16',slug:'9x16',version:10,previousVersion:9,width:1080,height:1920,composition:'EnvitefyJohnSpaceDisco',component:'src/JohnSpaceDisco.tsx',prefix:'vertical',start:5.5,filter:savedFilter('scripts/prepare-john-vertical-v7.mjs'),sources:['hook.mp4','update.mp4','payoff.mp4','vertical-effects.wav']},
 {aspectRatio:'16:9',slug:'16x9',version:8,previousVersion:7,width:1920,height:1080,composition:'EnvitefyJohnSpaceDiscoWide',component:'src/JohnSpaceDiscoWide.tsx',prefix:'wide',start:5.35,filter:savedFilter('scripts/mix-john-wide-v3.mjs').replace('loudnorm=I=-15:TP=-1.5:LRA=9,apad,atrim=0:30[a]','loudnorm=I=-15:TP=-1.5:LRA=9,aresample=48000,asetpts=PTS-STARTPTS,apad,atrim=end_sample=1440000[a]'),sources:['wide-edit-hook-v3.mp4','wide-edit-update.mp4','wide-edit-payoff.mp4','wide-effects.wav']}
];
const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',b+voice],{encoding:'utf8'}).trim());
if(duration>6.3||duration<2)throw Error('Voice duration needs review');
const records=[];
for(const r of revisions){
 const base=o+'john-space-disco-'+r.slug+'-v'+r.previousVersion+'.mp4',output=o+'john-space-disco-'+r.slug+'-v'+r.version+'.mp4',mix=b+r.prefix+'-final-mix-v'+r.version+'.wav';
 if(fs.existsSync(output))throw Error('Version exists: '+output);
 ff(['-i',b+'music.mp3','-i',b+r.sources[0],'-i',b+r.sources[1],'-i',b+r.sources[2],'-i',b+voice,'-i',b+'vo-update.mp3','-i',b+r.sources[3],'-filter_complex',r.filter,'-map','[a]','-ar','48000','-ac','2','-c:a','pcm_s16le',mix]);
 ff(['-i',base,'-i',mix,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-af','atrim=0:30,asetpts=PTS-STARTPTS','-t','30','-movflags','+faststart',output]);
 ff(['-ss',String(r.start),'-i',output,'-t',String(duration+.25),'-vn','-ac','1','-ar','16000',o+r.prefix+'-v'+r.version+'-final-voice-review.wav']);
 ff(['-i',output,'-vn','-ac','1','-ar','16000',o+r.prefix+'-v'+r.version+'-full-audio-review.wav']);
 let component=fs.readFileSync(r.component,'utf8');component=component.replace(new RegExp(r.prefix+'-final-mix-v[0-9]+\\.wav'),r.prefix+'-final-mix-v'+r.version+'.wav');fs.writeFileSync(r.component,component);
 let root=fs.readFileSync('src/Root.tsx','utf8');root=root.replace(new RegExp('john-space-disco/john-space-disco-'+r.slug+'-v[0-9]+'),'john-space-disco/john-space-disco-'+r.slug+'-v'+r.version);fs.writeFileSync('src/Root.tsx',root);
 records.push({...r,base,output,mix,voice:b+voice,voiceSha256:voiceHash,voiceDurationSeconds:duration,audioReview:p+'user-reference-narration-comparison.json',status:'exported-awaiting-final-checks'});console.log('Exported '+output);
}
fs.writeFileSync(p+'user-reference-revision.json',JSON.stringify({date:'2026-09-09',standard:'../ENVITEFY_BRAND.md',pronunciation:'in-VY-tih-fy',ipa:'ɪnˈvaɪtɪfaɪ',records},null,2)+'\n');

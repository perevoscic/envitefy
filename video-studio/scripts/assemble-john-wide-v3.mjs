import fs from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';
const b='public/projects/john-space-disco/',o='out/john-space-disco/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit',windowsHide:true});if(r.status)throw Error('FFmpeg failed');}
for(const [shot,duration,speed] of [['hook',6,1.2],['create',7,1]]){
  const file=b+'wide-'+shot+'-fixed-v3.mp4';
  const p=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=width,height:format=duration','-of','json',file],{encoding:'utf8'}));
  if(!p.streams.some(s=>s.width===1920&&s.height===1080)||Math.abs(Number(p.format.duration)-duration)>.2)throw Error('Unexpected edited source format; inspect before trimming '+shot);
  ff(['-i',file,'-t',String(duration/speed),'-vf','setpts=(PTS-STARTPTS)/'+speed+',fps=30','-af','atempo='+speed,'-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-ar','48000',b+'wide-edit-'+shot+'-v3.mp4']);
  ff(['-i',b+'wide-edit-'+shot+'-v3.mp4','-vn','-ac','1','-ar','16000',o+'wide-'+shot+'-v3-review.wav']);
  ff(['-i',b+'wide-edit-'+shot+'-v3.mp4','-vf','fps=5,scale=480:270,tile=5x7','-frames:v','1',o+'wide-'+shot+'-v3-contact.jpg']);
}
for(const [file,from,to] of [
  ['src/john-space-disco-wide/Hook.tsx','wide-edit-hook.mp4','wide-edit-hook-v3.mp4'],
  ['src/john-space-disco-wide/Create.tsx','wide-edit-create.mp4','wide-edit-create-v3.mp4'],
  ['src/Root.tsx','john-space-disco/john-space-disco-16x9-v2','john-space-disco/john-space-disco-16x9-v3'],
])fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(from,to));
const prep=fs.readFileSync('scripts/prepare-john-wide-v3.mjs','utf8').replace("b+'wide-edit-hook.mp4'","b+'wide-edit-hook-v3.mp4'");
fs.writeFileSync('scripts/mix-john-wide-v3.mjs',prep);
const mix=spawnSync(process.execPath,['scripts/mix-john-wide-v3.mjs'],{stdio:'inherit',windowsHide:true});if(mix.status)throw Error('Mix failed');
let verify=fs.readFileSync('scripts/verify-john-wide-export.mjs','utf8')
  .replaceAll('john-space-disco-16x9-v2.mp4','john-space-disco-16x9-v3.mp4')
  .replaceAll('wide-loudness.txt','wide-v3-loudness.txt')
  .replaceAll('wide-final-review','wide-v3-final-review')
  .replaceAll('wide-final-contact.jpg','wide-v3-final-contact.jpg')
  .replaceAll('wide-export-checks.json','wide-export-checks-v3.json')
  .replace('40,148,149','40,80,100,110,120,125,130,135,140,145,148,149');
fs.writeFileSync('scripts/verify-john-wide-v3.mjs',verify);
console.log('V3 footage, composition, narration mix and verification prepared.');

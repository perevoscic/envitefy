import fs from 'node:fs/promises';import {spawnSync,execFileSync} from 'node:child_process';
const out='out/john-space-disco/',file=out+'john-space-disco-9x16-v5.mp4';
const j=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels:format=duration,size','-of','json',file],{encoding:'utf8',windowsHide:true}));
const v=j.streams.find(s=>s.codec_name==='h264'),a=j.streams.find(s=>s.codec_name==='aac');if(!v||v.width!==1080||v.height!==1920||v.r_frame_rate!=='30/1'||Number(v.nb_frames)!==900||Math.abs(Number(j.format.duration)-30)>.04||!a)throw Error('Export properties mismatch');
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner',...args],{encoding:'utf8',windowsHide:true});if(r.status)throw Error(r.stderr);return r.stderr;}
ff(['-v','error','-i',file,'-f','null','-']);
ff(['-v','error','-i',file,'-vf','fps=1,scale=216:384,tile=6x5','-frames:v','1',out+'vertical-v5-contact.jpg']);
const frames=[0,1,2,147,148,149,150,151,358,359,360,361,568,569,570,571,778,779,780,781,898,899];
ff(['-v','error','-i',file,'-vf',"select='"+frames.map(n=>'eq(n,'+n+')').join('+')+"',scale=180:320,tile=6x4",'-frames:v','1',out+'vertical-v5-cuts.jpg']);
ff(['-v','error','-i',file,'-vf',"select='eq(n,435)+eq(n,690)+eq(n,746)+eq(n,870)',scale=360:640,tile=4x1",'-frames:v','1',out+'vertical-v5-details.jpg']);
const loudness=ff(['-i',file,'-af','loudnorm=I=-15:TP=-1.5:LRA=9:print_format=json','-f','null','-']);const match=loudness.match(/\{\s*"input_i"[\s\S]*?\}/);const result={...j,decodedEntireVideo:true,loudness:match?JSON.parse(match[0]):null,checkedCutFrames:frames,status:'technical-checks-passed; visual review pending'};await fs.writeFile('projects/john-space-disco/vertical-v5-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));

ff(['-v','error','-ss','26','-i',file,'-vf','fps=8,scale=180:320,tile=8x4','-frames:v','1',out+'vertical-v5-ending.jpg']);

for(let second=26;second<30;second++)ff(['-v','error','-i',file,'-vf',"select='between(n,"+(second*30)+","+(second*30+29)+")',scale=180:320,tile=10x3",'-frames:v','1',out+'vertical-v5-second-'+second+'-all-frames.jpg']);

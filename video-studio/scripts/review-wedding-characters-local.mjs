import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const out='out/wedding-characters/',source=out+(process.argv[2]||'wedding-characters-9x16-v1.mp4');
function run(command,args){const r=spawnSync(command,args,{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr);return r.stdout||r.stderr;}
function ff(args){return run('ffmpeg',['-y','-hide_banner','-loglevel','error',...args]);}
const probe=JSON.parse(run('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height,r_frame_rate,sample_rate,channels,nb_frames','-show_entries','format=duration,size','-of','json',source]));
fs.writeFileSync(out+'technical-review.json',JSON.stringify(probe,null,2));console.log(probe);
ff(['-i',source,'-vf','fps=1,scale=216:384,tile=5x5','-frames:v','1','-q:v','4',out+'review-contact.jpg']);
const frames=[0,1,2,3,38,39,89,90,134,135,239,240,266,267,287,288,371,372,395,396,416,417,524,525,560,561,602,603,638,639,744,749];
for(let i=0;i<frames.length;i++){ff(['-i',source,'-vf',`select=eq(n\\,${frames[i]}),scale=270:480`,'-frames:v','1','-q:v','4',out+`boundary-${String(i).padStart(2,'0')}.jpg`]);}
ff(['-framerate','1','-i',out+'boundary-%02d.jpg','-vf','tile=8x4','-frames:v','1','-q:v','4',out+'review-boundaries.jpg']);
for(const [name,sec]of [['planner',6.7],['product',2.1],['calendar',3.7],['dancer',11],['crier',16],['wedding',18],['end-card',23.5]])ff(['-ss',String(sec),'-i',source,'-vf','scale=540:960','-frames:v','1','-q:v','3',out+'review-'+name+'.jpg']);
ff(['-i',source,'-vn','-ac','1','-ar','24000',out+'final-audio.mp3']);
ff(['-i',source,'-f','null','NUL']);
console.log('Local frame extraction and full media decode passed.');



import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const project='projects/birthday-second-job',file='out/birthday-second-job/birthday-second-job-9x16-v3.mp4';
function run(command,args){const r=spawnSync(command,args,{encoding:'utf8',maxBuffer:6e6});if(r.status!==0)throw new Error(r.stderr||command+' failed');return r.stdout;}
run('ffmpeg',['-y','-hide_banner','-loglevel','error','-i','out/birthday-second-job/birthday-second-job-9x16-v3-render.mp4','-map','0:v','-map','0:a','-c:v','copy','-c:a','aac','-b:a','256k','-af','atrim=0:30','-t','30','-movflags','+faststart',file]);
const info=JSON.parse(run('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height,r_frame_rate,duration,nb_frames,sample_rate,channels','-show_entries','format=duration,size','-of','json',file]));
if(info.format.duration!=='30.000000'||info.streams[0].nb_frames!=='900'||info.streams[0].width!==1080||info.streams[0].height!==1920)throw new Error('Export specification mismatch');
run('ffmpeg',['-v','error','-i',file,'-f','null','NUL']);
fs.writeFileSync(project+'/export-verification-v3.json',JSON.stringify(info,null,2));
run('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',file,'-vf',"select='eq(n,0)+eq(n,60)+eq(n,250)+eq(n,330)+eq(n,357)+eq(n,375)+eq(n,395)+eq(n,560)+eq(n,689)+eq(n,691)+eq(n,800)+eq(n,840)',scale=216:384,tile=4x3",'-frames:v','1','out/birthday-second-job/birthday-v3-final-proof.jpg']);
console.log(JSON.stringify({path:file,duration:info.format.duration,bytes:info.format.size,frames:info.streams[0].nb_frames,decode:'pass'}));


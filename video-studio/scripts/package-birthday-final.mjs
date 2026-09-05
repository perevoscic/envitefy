import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const project='projects/birthday-second-job',file='out/birthday-second-job/birthday-second-job-9x16-v2.mp4';
function run(command,args){const r=spawnSync(command,args,{encoding:'utf8',maxBuffer:6e6});if(r.status!==0)throw new Error(r.stderr||command+' failed');return r.stdout;}
run('ffmpeg',['-y','-hide_banner','-loglevel','error','-i','out/birthday-second-job/birthday-second-job-9x16-v2-render.mp4','-map','0:v','-map','0:a','-c:v','copy','-c:a','aac','-b:a','256k','-af','atrim=0:30','-t','30','-movflags','+faststart',file]);
const info=JSON.parse(run('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height,r_frame_rate,duration,nb_frames,sample_rate,channels','-show_entries','format=duration,size','-of','json',file]));
if(info.format.duration!=='30.000000'||info.streams[0].nb_frames!=='900'||info.streams[0].width!==1080||info.streams[0].height!==1920)throw new Error('Export specification mismatch');
run('ffmpeg',['-v','error','-i',file,'-f','null','NUL']);
fs.writeFileSync(project+'/export-verification.json',JSON.stringify(info,null,2));
run('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',file,'-vf',"select='eq(n,330)+eq(n,331)+eq(n,332)+eq(n,333)+eq(n,350)+eq(n,357)+eq(n,395)+eq(n,554)',scale=216:384,tile=4x2",'-frames:v','1','out/birthday-second-job/birthday-v2-final-proof.jpg']);
console.log(JSON.stringify({path:file,duration:info.format.duration,bytes:info.format.size,frames:info.streams[0].nb_frames,decode:'pass'}));


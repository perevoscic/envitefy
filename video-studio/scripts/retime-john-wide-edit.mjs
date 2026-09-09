import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const t=JSON.parse(fs.readFileSync('projects/john-space-disco/vertical-capture-timing.json','utf8'));
const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-ss',String(t.edit-0.45),'-i',t.video,'-filter_complex','[0:v]split=2[a][b];[a]trim=0:0.32,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=1.7[a1];[b]trim=0.32:1.03,setpts=PTS-STARTPTS[b1];[a1][b1]concat=n=2:v=1:a=0,fps=30[v]','-map','[v]','-an','-t','2.734','-c:v','libx264','-preset','fast','-crf','14','-pix_fmt','yuv420p','public/projects/john-space-disco/wide-ui-edit.mp4'],{stdio:'inherit',windowsHide:true});if(r.status)throw Error('edit timing failed');

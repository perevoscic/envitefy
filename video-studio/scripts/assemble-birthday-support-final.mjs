import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const filter='[0:v]trim=0:7,setpts=PTS-STARTPTS[v0];[1:v]split=2[a][b];[a]trim=7:14.8,setpts=PTS-STARTPTS[v1];[2:v]trim=0:0.6,setpts=PTS-STARTPTS[v2];[b]trim=15.4:25,setpts=PTS-STARTPTS[v3];[v0][v1][v2][v3]concat=n=4:v=1:a=0,fps=30,trim=0:25[v]';
const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i','out/birthday-support-hook-fix.mp4','-i','out/birthday-support-9x16-v1-render.mp4','-i','out/birthday-support-guest-fix.mp4','-filter_complex',filter,'-map','[v]','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','copy','-t','25','out/birthday-support-final-assembled.mp4'],{stdio:'inherit'});
if(r.status!==0)throw new Error('Assemble failed');
let pack=fs.readFileSync('scripts/package-birthday-support.mjs','utf8');
pack=pack.replace("input='out/birthday-support-9x16-v1-render.mp4'","input='out/birthday-support-final-assembled.mp4'");
fs.writeFileSync('scripts/package-birthday-support.mjs',pack);
console.log('Assembled final inserts.');

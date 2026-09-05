import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const base='public/projects/birthday-second-job/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit'});if(r.status!==0)throw new Error('ffmpeg failed');}
// Overlap the subtle incoming camera shift; keep the child's original performance timing.
// Slow only the silent wide reaction after her sentence, eliminating the 16.4167s closeup.
const filter="[0:v]split=3[a][b][c];[a]trim=start=10:end=12.958333,setpts=(PTS-STARTPTS)*1.0225352,fps=30,format=yuv420p,settb=AVTB[pre];[b]trim=start=12.958333:end=15.7,setpts=PTS-STARTPTS,fps=30,format=yuv420p,settb=AVTB[line];[c]trim=start=15.7:end=16.416667,setpts=(PTS-STARTPTS)*1.81395264,fps=30,tpad=stop_mode=clone:stop_duration=0.1,trim=duration=1.3,settb=AVTB[reaction];[pre][line]xfade=transition=fade:duration=0.066667:offset=2.958333,trim=duration=5.7[body];[body][reaction]concat=n=2:v=1:a=0,fps=30,trim=duration=7[v];[0:a]asplit=2[aa][ab];[aa]atrim=10:15.7,asetpts=PTS-STARTPTS[voice];[ab]atrim=15.7:16.416667,asetpts=PTS-STARTPTS,atempo=0.5512823,apad,atrim=0:1.3[room];[voice][room]concat=n=2:v=0:a=1[aout]";
ff(['-i',base+'payoff.mp4','-filter_complex',filter,'-map','[v]','-map','[aout]','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac',base+'payoff-smooth-v3.mp4']);
console.log('Created a 7-second wide payoff with a smoothed incoming cut and no closeup.');


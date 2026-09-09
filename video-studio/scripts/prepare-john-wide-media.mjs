import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const b='public/projects/john-space-disco/',o='out/john-space-disco/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit',windowsHide:true});if(r.status)throw Error('FFmpeg failed');}
for(const [name,start,dur,speed] of [['hook',0,6,1.2],['create',6,7,1],['guests',0,7,1],['update',6,5,1],['payoff',0,4,1]]){
ff(['-ss',String(start),'-i',b+name+'-wide.mp4','-t',String(dur/speed),'-vf','setpts=(PTS-STARTPTS)/'+speed+',fps=30','-af','atempo='+speed,'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-ar','48000',b+'wide-edit-'+name+'.mp4']);
ff(['-i',b+'wide-edit-'+name+'.mp4','-vn','-ac','1','-ar','16000',o+'wide-'+name+'-review.wav']);
ff(['-i',b+'wide-edit-'+name+'.mp4','-vf','fps=1,scale=480:-1,tile=3x2','-frames:v','1',o+'wide-'+name+'-contact.jpg']);
}
console.log('Widescreen sources normalized with audio; local review files ready.');

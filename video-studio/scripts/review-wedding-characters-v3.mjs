import {spawnSync} from 'node:child_process';
const root='out/wedding-characters/',source=root+'wedding-characters-9x16-v3.mp4';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr);}
ff(['-i',source,'-vf','fps=1,scale=216:384,tile=5x5','-frames:v','1','-q:v','4',root+'v3-final-contact.jpg']);
ff(['-ss','13.9','-i',source,'-t','3.6','-vf','fps=10,crop=1080:950:0:750,scale=324:285,tile=6x6','-frames:v','1','-q:v','3',root+'v3-box-contact-review.jpg']);
const frames=[371,372,395,396,416,417,420,426,432,438,444,450,456,462,468,474,480,486,492,498,504,510,516,524,525,639,644,705,749];
ff(['-i',source,'-vf','select='+frames.map(n=>'eq(n\\,'+n+')').join('+')+',scale=216:384,tile=5x6','-frames:v','1','-q:v','3',root+'v3-changed-frames.jpg']);
for(const [label,frame]of [['hand-contact',435],['tissue',488],['end-card',705]])ff(['-i',source,'-vf','select=eq(n\\,'+frame+'),scale=540:960','-frames:v','1','-q:v','3',root+'v3-final-'+label+'.jpg']);
ff(['-i',source,'-f','null','NUL']);
console.log('V3 complete MP4 decode passed; physical-contact review frames extracted.');


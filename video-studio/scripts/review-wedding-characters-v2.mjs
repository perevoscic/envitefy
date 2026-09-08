import {spawnSync} from 'node:child_process';
const root='out/wedding-characters/',source=root+'wedding-characters-9x16-v2.mp4';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr);}
ff(['-i',source,'-vf','fps=1,scale=216:384,tile=5x5','-frames:v','1','-q:v','4',root+'v2-final-contact.jpg']);
const frames=[239,240,243,246,249,252,255,258,261,264,266,267,525,561,603,638,639,644,705,749];
const select=frames.map(n=>'eq(n\\,'+n+')').join('+');
ff(['-i',source,'-vf','select='+select+',scale=216:384,tile=5x4','-frames:v','1','-q:v','3',root+'v2-changed-frames.jpg']);
for(const [label,frame]of [['dancer',253],['end-card',705],['wedding',548]])ff(['-i',source,'-vf','select=eq(n\\,'+frame+'),scale=540:960','-frames:v','1','-q:v','3',root+'v2-final-'+label+'.jpg']);
ff(['-i',source,'-f','null','NUL']);
console.log('Revised MP4 fully decoded; changed frames extracted.');


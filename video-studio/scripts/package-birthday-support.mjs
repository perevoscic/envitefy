import fs from 'node:fs'; import cp from 'node:child_process';
function run(args){const r=cp.spawnSync('ffmpeg',['-y','-hide_banner',...args],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr);return r.stderr;}
const input='out/birthday-support-final-assembled.mp4',output='out/birthday-support-9x16-v1.mp4',project='projects/birthday-support/';
if(!fs.existsSync(input))throw new Error('Render is not finished');
run(['-loglevel','error','-i',input,'-map','0:v:0','-map','0:a:0','-c:v','copy','-af','atrim=0:25,asetpts=PTS-STARTPTS','-c:a','aac','-b:a','192k','-t','25','-movflags','+faststart',output]);
const probe=cp.spawnSync('ffprobe',['-v','error','-count_frames','-show_entries','stream=codec_name,width,height,r_frame_rate,duration,nb_read_frames,sample_rate,channels','-show_entries','format=duration,size','-of','json',output],{encoding:'utf8'});
if(probe.status!==0)throw new Error(probe.stderr);
const info=JSON.parse(probe.stdout);fs.writeFileSync(project+'export-probe.json',JSON.stringify(info,null,2));
if(info.streams[0].width!==1080||info.streams[0].height!==1920||info.streams[0].nb_read_frames!=='750'||Number(info.format.duration)!==25)throw new Error('Export spec mismatch');
run(['-v','error','-i',output,'-f','null','-']);
const audio=run(['-i',output,'-af','loudnorm=I=-15:TP=-1.5:LRA=8:print_format=json','-f','null','-']);
fs.writeFileSync(project+'loudness.txt',audio);
const silence=run(['-i',output,'-af','silencedetect=noise=-50dB:d=0.1','-f','null','-']);
fs.writeFileSync(project+'silence-check.txt',silence);
run(['-loglevel','error','-i',output,'-vf','fps=1,scale=216:384,tile=5x5','-frames:v','1',project+'final-contact.jpg']);
const frames=[0,1,2,149,150,151,152,153,209,210,211,269,270,271,335,336,337,353,354,355,443,444,445,461,462,463,539,540,541,673,674,675,676,748,749];
const selection=frames.map(n=>'eq(n\\,'+n+')').join('+');
run(['-loglevel','error','-i',output,'-vf','select='+selection+',scale=180:320,tile=7x5','-frames:v','1',project+'final-boundaries.jpg']);
for(const [name,time] of [['rsvp',13.7],['calendar',17.6],['endcard',24]]){
 run(['-loglevel','error','-ss',String(time),'-i',output,'-vf','scale=540:960','-frames:v','1',project+'final-'+name+'.jpg']);
}
console.log(JSON.stringify(info,null,2));
console.log(audio.slice(audio.lastIndexOf('{')));
console.log(silence.split('\n').filter(l=>l.includes('silence_')).join('\n'));


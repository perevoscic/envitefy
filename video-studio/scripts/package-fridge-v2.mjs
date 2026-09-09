import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const out='out/fridge-freedom/',file=out+'fridge-freedom-9x16-v2.mp4';
function run(command,args){const r=spawnSync(command,args,{encoding:'utf8',maxBuffer:12e6});if(r.status!==0)throw Error(r.stderr||command+' failed');return r;}
const ff=args=>run('ffmpeg',['-y','-hide_banner','-loglevel','error',...args]);
ff(['-i',out+'fridge-freedom-9x16-v2-render.mp4','-map','0:v','-map','0:a','-c:v','copy','-c:a','aac','-b:a','256k','-af','atrim=0:30','-t','30','-movflags','+faststart',file]);
const info=JSON.parse(run('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height,r_frame_rate,duration,nb_frames,sample_rate,channels','-show_entries','format=duration,size','-of','json',file]).stdout);
if(info.format.duration!=='30.000000'||info.streams[0].nb_frames!=='900'||info.streams[0].width!==1080||info.streams[0].height!==1920)throw Error('Export specification mismatch');
ff(['-i',file,'-f','null','NUL']);
ff(['-i',file,'-vf',"select='between(n,0,29)',scale=216:384,tile=6x5",'-frames:v','1',out+'v2-first-second-review.jpg']);
ff(['-i',file,'-vf','fps=1,scale=216:384,tile=6x5','-frames:v','1',out+'v2-final-contact.jpg']);
const frames=[16,17,73,74,133,134,209,210,337,338,359,360,659,660,689,690,719,720,749,750,779,780,809,810,819,820,870,899];
ff(['-i',file,'-vf',`select='${frames.map(n=>'eq(n,'+n+')').join('+')}',scale=240:426,tile=7x4`,'-frames:v','1',out+'v2-boundaries-review.jpg']);
ff(['-ss','22','-i',file,'-vf','fps=4,scale=240:426,tile=8x4','-frames:v','1',out+'v2-ending-review.jpg']);
for(const [name,sec]of [['first',0],['reaction',5.5],['payoff',29.3]])ff(['-ss',String(sec),'-i',file,'-vf','scale=540:960','-frames:v','1',out+'v2-final-'+name+'.jpg']);
const loud=run('ffmpeg',['-hide_banner','-i',file,'-af','loudnorm=I=-15:TP=-1.5:LRA=8:print_format=json','-f','null','NUL']).stderr;
fs.writeFileSync(out+'v2-loudness-report.txt',loud);const match=loud.match(/\{\s*"input_i"[\s\S]+?\}/);const loudness=match?JSON.parse(match[0]):null;
const blacks=run('ffmpeg',['-hide_banner','-i',file,'-vf','blackdetect=d=0.08:pix_th=0.10','-an','-f','null','NUL']).stderr;fs.writeFileSync(out+'v2-black-frame-report.txt',blacks);if(blacks.includes('black_start:'))throw Error('Review detected black intervals');
fs.writeFileSync(out+'v2-technical-verification.json',JSON.stringify({...info,fullDecode:'passed',blackFrames:'none',loudness},null,2));
console.log(JSON.stringify({path:file,duration:info.format.duration,frames:info.streams[0].nb_frames,bytes:info.format.size,decode:'passed',blackFrames:'none',loudness},null,2));

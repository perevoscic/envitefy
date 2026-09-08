import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const out='out/fridge-freedom/',p='projects/fridge-freedom/',file=out+'fridge-freedom-9x16-v1.mp4';
function run(command,args){const r=spawnSync(command,args,{encoding:'utf8',maxBuffer:8e6});if(r.status!==0)throw Error(r.stderr||command+' failed');return {stdout:r.stdout,stderr:r.stderr};}
const ff=args=>run('ffmpeg',['-y','-hide_banner','-loglevel','error',...args]);
ff(['-i',out+'fridge-freedom-9x16-v1-render.mp4','-map','0:v','-map','0:a','-c:v','copy','-c:a','aac','-b:a','256k','-af','atrim=0:30','-t','30','-movflags','+faststart',file]);
const info=JSON.parse(run('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height,r_frame_rate,duration,nb_frames,sample_rate,channels','-show_entries','format=duration,size','-of','json',file]).stdout);
if(info.format.duration!=='30.000000'||info.streams[0].nb_frames!=='900'||info.streams[0].width!==1080||info.streams[0].height!==1920)throw Error('Export spec mismatch');
ff(['-i',file,'-f','null','NUL']);fs.writeFileSync(out+'technical-verification.json',JSON.stringify({...info,fullDecode:'passed'},null,2));
ff(['-i',file,'-vf','fps=1,scale=216:384,tile=6x5','-frames:v','1',out+'review-contact.jpg']);
const frames=[0,1,2,3,209,210,297,298,359,360,392,393,427,428,442,443,508,509,536,537,567,568,607,608,622,623,659,660,809,810,819,820,861,899];
ff(['-i',file,'-vf',`select='${frames.map(n=>'eq(n,'+n+')').join('+')}',scale=216:384,tile=6x6`,'-frames:v','1',out+'review-boundaries.jpg']);
for(const [name,sec]of [['camera',12.65],['search',9.4],['calendar',21.25],['payoff',28.8]])ff(['-ss',String(sec),'-i',file,'-vf','scale=540:960','-frames:v','1',out+'final-'+name+'.jpg']);
const loud=run('ffmpeg',['-hide_banner','-i',file,'-af','loudnorm=I=-15:TP=-1.5:LRA=8:print_format=json','-f','null','NUL']).stderr;
fs.writeFileSync(out+'loudness-report.txt',loud);const match=loud.match(/\{\s*"input_i"[\s\S]+?\}/);if(match)fs.writeFileSync(out+'loudness.json',match[0]);
const blacks=run('ffmpeg',['-hide_banner','-i',file,'-vf','blackdetect=d=0.08:pix_th=0.10','-an','-f','null','NUL']).stderr;fs.writeFileSync(out+'black-frame-report.txt',blacks);if(blacks.includes('black_start:'))throw Error('Review detected black frames');
fs.writeFileSync(p+'deliverables.json',JSON.stringify({campaign:'fridge-freedom',status:'exported-pending-final-visual-review',exports:[{version:1,path:file,composition:'EnvitefyFridgeFreedom',aspectRatio:'9:16',width:1080,height:1920,fps:30,durationSeconds:30,videoCodec:'H.264',audioCodec:'AAC',userApproved:false}],notes:'One deliverable. Actual moving source footage and real Envitefy component recordings. Message and calendar are illustrative local phone inserts; calendar event comes from actual Envitefy ICS.'},null,2));
console.log(JSON.stringify({path:file,duration:info.format.duration,frames:info.streams[0].nb_frames,bytes:info.format.size,decode:'pass',blackFrames:'none'}));

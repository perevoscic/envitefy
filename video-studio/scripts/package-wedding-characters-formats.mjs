import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const format=process.argv[2];
if(!['1x1','16x9'].includes(format))throw new Error('Use 1x1 or 16x9.');
const width=format==='1x1'?1080:1920,height=1080;
const dir='out/wedding-characters/',stem='wedding-characters-'+format+'-v1',output=dir+stem+'.mp4';
function run(cmd,args){const r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:8*1024*1024});if(r.status!==0)throw new Error(r.stderr||r.error?.message);return r;}
run('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',dir+stem+'-render.mp4','-i','public/projects/wedding-characters/final-mix-v3.wav','-map','0:v:0','-map','1:a:0','-t','25','-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-c:v','libx264','-preset','slow','-crf','17','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',output]);
const probe=JSON.parse(run('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height,r_frame_rate,pix_fmt,color_range,color_space,sample_rate,channels,nb_frames,duration','-show_entries','format=duration,size','-of','json',output]).stdout);
const video=probe.streams.find(s=>s.codec_name==='h264');
if(probe.format.duration!=='25.000000'||video.width!==width||video.height!==height||video.nb_frames!=='750')throw Error('Unexpected dimensions or duration');
run('ffmpeg',['-hide_banner','-v','error','-i',output,'-f','null','NUL']);
const meter=run('ffmpeg',['-hide_banner','-i',output,'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json','-f','null','NUL']).stderr;
const audio=JSON.parse(meter.match(/\{[\s\S]*?\}/g).at(-1));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const branding={};for(const [studio,parent]of [['public/brand/envitefy-com.png','../public/brand/envitefy-com.png'],['public/brand/apple-touch-icon-120.png','../public/icons/apple-touch-icon-120.png']])branding[studio]={sha256:hash(studio),matchesParent:hash(studio)===hash(parent)};
const result={file:output,aspectRatio:format==='1x1'?'1:1':'16:9',composition:format==='1x1'?'EnvitefyWeddingCharactersSquare':'EnvitefyWeddingCharactersWide',probe,audio,branding,sha256:hash(output),fullDecodePassed:true};
fs.writeFileSync(dir+format+'-v1-technical-review.json',JSON.stringify(result,null,2));
const sw=format==='1x1'?270:384,sh=format==='1x1'?270:216;
run('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',output,'-vf','fps=1,scale='+sw+':'+sh+',tile=5x5','-frames:v','1','-q:v','7',dir+format+'-v1-contact.jpg']);
const cuts=[0,1,38,39,89,90,134,135,173,239,240,266,267,287,288,330,371,372,395,396,416,417,430,448,470,490,524,525,560,561,602,603,638,639,640,644,705,749];
run('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',output,'-vf',"select='"+cuts.map(n=>'eq(n,'+n+')').join('+')+"',scale="+sw+':'+sh+',tile=5x8','-frames:v','1','-q:v','9',dir+format+'-v1-cuts.jpg']);
for(const [name,n]of [['planner',184],['demo',65],['calendar',110],['dancer',350],['crier',435],['end',705]]){
run('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',output,'-vf',"select='eq(n,"+n+")',scale="+(width/2)+':540','-frames:v','1','-q:v','3',dir+format+'-v1-'+name+'.jpg']);
}
console.log(JSON.stringify(result,null,2));

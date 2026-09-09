import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const out='out/fridge-freedom/',file=out+'fridge-freedom-9x16-v4.mp4';
const t=JSON.parse(fs.readFileSync('src/fridge-freedom/camera-timing-v4.json','utf8'));
const capture=t.pressFrame+t.captureDelayFrames;
const cases=[{name:'main',start:t.mainStartFrame,trim:0},{name:'cleanup',start:t.cleanupStartFrame,trim:t.cleanupTrimStartFrame}];
function run(command,args){const r=spawnSync(command,args,{encoding:'utf8',maxBuffer:8e6});if(r.status!==0)throw Error(r.stderr||command+' failed');return r;}
const ff=args=>run('ffmpeg',['-y','-hide_banner','-loglevel','error',...args]);
const report=[];
for(const shot of cases){
 const press=shot.start+t.pressFrame-shot.trim,flash=shot.start+capture-shot.trim,thumbnail=shot.start+t.pressFrame+t.thumbnailDelayFrames-shot.trim;
 ff(['-i',file,'-vf',`select='between(n,${press-6},${press+9})',crop=800:700:200:1100,scale=320:280,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='%{eif\\:n+${press-6}\\:d}':x=10:y=10:fontsize=23:fontcolor=white:box=1:boxcolor=black,tile=4x4`,'-frames:v','1',out+`v4-${shot.name}-press-frames.jpg`]);
 ff(['-i',file,'-vf',`select='eq(n,${press-1})+eq(n,${press})+eq(n,${flash})+eq(n,${thumbnail})',scale=360:640,tile=4x1`,'-frames:v','1',out+`v4-${shot.name}-press-sequence.jpg`]);
 const signal=run('ffmpeg',['-hide_banner','-i',file,'-vf',`select='between(n,${flash-4},${flash+4})',crop=500:1050:280:270,signalstats,metadata=mode=print`,'-an','-f','null','NUL']).stderr;
 fs.writeFileSync(out+`v4-${shot.name}-flash-signal.txt`,signal);
 const brightness=[...signal.matchAll(/pts_time:([\d.]+)[\s\S]*?lavfi.signalstats.YAVG=([\d.]+)/g)].map(m=>({frame:Math.round(Number(m[1])*t.fps),averageLuma:Number(m[2])}));
 const brightest=brightness.reduce((a,b)=>a.averageLuma>b.averageLuma?a:b);
 if(brightest.frame!==flash)throw Error(`${shot.name}: flash expected frame ${flash}, got ${brightest.frame}`);
 report.push({shot:shot.name,visiblePressFrame:press,flashFrame:flash,thumbnailFrame:thumbnail,shutterSeconds:flash/t.fps,measuredFlashFrame:brightest.frame});
}
const wav=fs.readFileSync('public/projects/fridge-freedom/v4-effects.wav');
for(const item of report){
 const onset=Math.round(item.shutterSeconds*48000);
 const before=Array.from({length:4800},(_,i)=>wav.readInt16LE(44+(onset-4800+i)*2));
 if(before.some(v=>v!==0))throw Error(`${item.shot}: premature audio effect`);
 if(wav.readInt16LE(44+onset*2)===0)throw Error(`${item.shot}: missing shutter onset`);
 item.shutterSourceOnsetSample=onset;
 item.noShutterInPreceding100ms=true;
}
fs.writeFileSync(out+'v4-shutter-sync-verification.json',JSON.stringify({fps:t.fps,checks:report},null,2));
console.log(JSON.stringify(report,null,2));

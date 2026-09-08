import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const base='public/projects/wedding-characters/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit'});if(r.status!==0)throw new Error('FFmpeg failed');}
const phase=process.argv[2]||'portraits';
if(phase==='portraits'){
  const edits=[
    ['planner-open','planner',0,1.3],['planner-reveal','planner',2.4,3.5],
    ['dancer-open','dancer',.5,.9],['dancer-dance','dancer',3.2,2.8],
    ['crier-open','crier',.5,.8],['crier-tissue','crier',2.5,3.6],
    ['planner-payoff','planner-wedding',8.25,1.2],['dancer-payoff','dancer-wedding',10.25,1.4],['crier-payoff','crier-wedding',8.65,1.2]
  ];
  for(const [dest,source,start,duration] of edits) ff(['-ss',String(start),'-i',base+source+'.mp4','-t',String(duration),'-vf','scale=1080:1920,fps=30','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-ar','48000',base+dest+'.mp4']);
}
if(phase==='demo'){
 const t=JSON.parse(fs.readFileSync('projects/wedding-characters/capture-timing.json','utf8'));
 const segments=[['rsvp',t.rsvp-.05,1.7,1],['quick-rsvp',t.confirmed,.7,1],['calendar',t.calendar,1.5,1.3]];
 for(const [name,start,duration,rate] of segments)ff(['-ss',String(start),'-i',t.videoPath,'-vf',`crop=398:607:16:30,setpts=(PTS-STARTPTS)/${rate},scale=796:1214,fps=30`,'-t',String(duration),'-an','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p',base+'demo-'+name+'.mp4']);
}
if(phase==='audio'){
 const clips=[['planner-open',0,1.3,.65],['planner-reveal',4.5,3.5,1.3],['dancer-dance',9.6,2.8,.7],['crier-open',12.4,.8,.7],['crier-tissue',13.9,3.6,.8],['planner-payoff',17.5,1.2,.5],['dancer-payoff',18.7,1.4,.65],['crier-payoff',20.1,1.2,.65]];
 const inputs=['-i',base+'music.mp3'];for(const [name]of clips)inputs.push('-i',base+name+'.mp4');
 const filters=["[0:a]atrim=0:25,asetpts=PTS-STARTPTS,volume='if(between(t,5.4,7.8),0.035,if(between(t,12.4,17.5),0.18,0.27))':eval=frame,afade=t=in:st=0:d=0.12,afade=t=out:st=23.8:d=1.2[m]"];
 clips.forEach(([,start,duration,gain],i)=>filters.push(`[${i+1}:a]atrim=0:${duration},asetpts=PTS-STARTPTS,volume=${gain},afade=t=in:st=0:d=0.015,afade=t=out:st=${duration-.04}:d=0.04,adelay=${Math.round(start*1000)}:all=1[a${i}]`));
 filters.push('[m]'+clips.map((_,i)=>'[a'+i+']').join('')+`amix=inputs=${clips.length+1}:normalize=0:duration=first,alimiter=limit=0.89:level=0,loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000,atrim=0:25[out]`);
 ff([...inputs,'-filter_complex',filters.join(';'),'-map','[out]','-ac','2','-c:a','pcm_s16le',base+'final-mix.wav']);
}





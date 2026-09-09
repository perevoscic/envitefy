import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';import sharp from 'sharp';
const out='out/mom-just-snap-it',assets='public/projects/mom-just-snap-it';
const shots=['opening','discovery','digital','payoff'];
for(const shot of shots){
 const probe=JSON.parse(spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',`${assets}/${shot}.mp4`],{encoding:'utf8'}).stdout);console.log(shot,probe.format.duration);
 const ff=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',`${assets}/${shot}.mp4`,'-vf','fps=1,scale=384:-1,tile=5x2','-frames:v','1',`${out}/${shot}-contact.jpg`],{encoding:'utf8'});if(ff.status)throw Error(ff.stderr);
 spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',`${assets}/${shot}.mp4`,'-vn','-ac','1','-ar','24000',`${out}/${shot}-voice.wav`]);
}
const rows=await Promise.all(shots.map(async (s,i)=>({input:await sharp(`${out}/${s}-contact.jpg`).resize(1440).toBuffer(),left:0,top:i*324})));
await sharp({create:{width:1440,height:1296,channels:3,background:'#ffffff'}}).composite(rows).jpeg({quality:88}).toFile(`${out}/source-contact.jpg`);

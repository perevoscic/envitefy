import {spawnSync} from 'node:child_process';import fs from 'node:fs/promises';import sharp from 'sharp';
const a='public/projects/mom-just-snap-it',out='out/mom-just-snap-it';
for(const shot of ['camera-insert','payoff-clean']){
 if(!(await fs.stat(`${a}/${shot}.mp4`).catch(()=>null)))continue;
 const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',`${a}/${shot}.mp4`,'-vf','fps=2,scale=384:-1,tile=5x4','-frames:v','1',`${out}/${shot}-review.jpg`],{encoding:'utf8'});if(r.status)throw Error(r.stderr);
}

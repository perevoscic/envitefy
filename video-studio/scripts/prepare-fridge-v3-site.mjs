import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';
const meta=JSON.parse(await fs.readFile('projects/fridge-freedom/v3-site-capture.json','utf8'));
const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-sseof','-2.15','-i',meta.videoPath,'-t','2','-an','-vf','crop=430:800:0:0,fps=30,scale=860:1600','-c:v','libx264','-crf','17','-preset','fast','public/projects/fridge-freedom/v3-snap-landing.mp4'],{encoding:'utf8'});if(r.status)throw Error(r.stderr);
const logo=await fetch('https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png');if(!logo.ok)throw Error('Logo download failed');await fs.writeFile('public/projects/fridge-freedom/google-logo.png',Buffer.from(await logo.arrayBuffer()));

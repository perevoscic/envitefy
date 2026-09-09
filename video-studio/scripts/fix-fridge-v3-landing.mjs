import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';
const p='scripts/prepare-fridge-v3-site.mjs';let script=await fs.readFile(p,'utf8');script=script.replace('fps=30,scale=860:1600','crop=430:800:0:0,fps=30,scale=860:1600');await fs.writeFile(p,script);
const meta=JSON.parse(await fs.readFile('projects/fridge-freedom/v3-site-capture.json','utf8'));const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-sseof','-2.15','-i',meta.videoPath,'-t','2','-an','-vf','crop=430:800:0:0,fps=30,scale=860:1600','-c:v','libx264','-crf','17','-preset','fast','public/projects/fridge-freedom/v3-snap-landing.mp4'],{encoding:'utf8'});if(r.status)throw Error(r.stderr);
const search='src/fridge-freedom/SearchV3.tsx';let s=await fs.readFile(search,'utf8');s=s.replace('  interpolate,','  interpolate,\n  staticFile,');s=s.replace(/<div\s+style=\{\{\s+position: "absolute",\s+top: 897,[\s\S]*?Find a better way to keep the invite\.\s*<\/div>/,'');
s=s.replace(/<div\s+style=\{\{\s+width: 52,[\s\S]*?>\s*e\s*<\/div>/,'<CanvasImage src={staticFile("brand/apple-touch-icon-120.png")} style={{width:52,height:52,borderRadius:12}} />');
await fs.writeFile(search,s);
console.log('Snap capture cropped to the recorded viewport; exact supplied favicon applied.');

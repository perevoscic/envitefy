import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';
for(const name of ['Shared','Opening','Product','Cleanup']){
 const file=`src/fridge-freedom/${name}.tsx`;let code=await fs.readFile(file,'utf8');code=code.replaceAll('<Video\n','<Video\n        objectFit="cover"\n').replaceAll('objectFit: "cover",','').replaceAll(', objectFit: "cover"','');await fs.writeFile(file,code);
}
const ff=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-ss','12.9','-i','public/projects/fridge-freedom/phone.mp4','-t','1.1','-vf','fps=30,scale=1080:1920','-an','-c:v','libx264','-crf','18','-preset','fast','public/projects/fridge-freedom/snap-action.mp4'],{encoding:'utf8'});if(ff.status)throw Error(ff.stderr);
let prep=await fs.readFile('scripts/prepare-fridge-edit.mjs','utf8');prep=prep.replace("'-ss','11.7'","'-ss','12.9'");await fs.writeFile('scripts/prepare-fridge-edit.mjs',prep);

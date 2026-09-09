import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
import fs from 'node:fs/promises';
const serveUrl=await bundle({entryPoint:'src/index.ts',outDir:process.cwd()+'/out/john-space-disco/wide-bundle'});
const composition=await selectComposition({serveUrl,id:'EnvitefyJohnSpaceDiscoWide'});
await fs.writeFile('out/john-space-disco/wide-render-composition.json',JSON.stringify(composition,null,2));
const frames=[0,40,125,180,275,342,380,435,503,550,591,657,718,768,801,833,872,899];
for(let i=0;i<frames.length;i+=2)await Promise.all(frames.slice(i,i+2).map(frame=>renderStill({serveUrl,composition,frame,scale:0.5,imageFormat:'jpeg',output:'out/john-space-disco/wide-frame-'+frame+'.jpg',logLevel:'error'})));
console.log('Widescreen scene review frames ready.');

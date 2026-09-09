import {bundle} from '@remotion/bundler';import {selectComposition,renderStill} from '@remotion/renderer';
const url=await bundle({entryPoint:'src/index.ts'});
for(const [id,format] of [['EnvitefySnapAnimeWide','16x9'],['EnvitefySnapAnimeVertical','9x16']]){const composition=await selectComposition({serveUrl:url,id});for(const frame of [4,8,12,15])await renderStill({serveUrl:url,composition,frame,output:`out/mom-just-snap-it/fixed-lift-${format}-${frame}.jpg`,scale:.5,imageFormat:'jpeg',logLevel:'error'});console.log(format+' corrected lift reviewed frames ready');}

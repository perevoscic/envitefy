import fs from 'node:fs/promises';import {bundle} from '@remotion/bundler';import {selectComposition,renderStill,openBrowser} from '@remotion/renderer';
const out='out/small-shower';const url=await bundle({entryPoint:'src/index.ts'});await fs.writeFile(out+'/bundle-path.txt',url);const browser=await openBrowser('chrome');
try{const comp=await selectComposition({serveUrl:url,id:'EnvitefySmallShowerVertical',puppeteerInstance:browser});for(const f of [678,704,790])await renderStill({serveUrl:url,composition:comp,puppeteerInstance:browser,output:out+'/final-crop-'+f+'.jpg',frame:f,scale:.5,imageFormat:'jpeg',logLevel:'error'});}finally{await browser.close({silent:true});}
console.log('Final crop review ready');

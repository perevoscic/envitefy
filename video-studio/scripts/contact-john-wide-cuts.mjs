import fs from 'node:fs';
import sharp from '../../node_modules/sharp/lib/index.js';
const d='out/john-space-disco/wide-final-review/';
const index=JSON.parse(fs.readFileSync(d+'index.json','utf8'));
for(const [name,frames,cols] of [['opening',[0,1,2,3,4,5],3],['cuts',[149,150,151,359,360,361,569,570,571,779,780,781,833,834,835,842,843,844],3]]) {
const tiles=await Promise.all(frames.map(async (f,i)=>({input:await sharp(d+index.find(x=>x.frame===f).path).resize(480,270).toBuffer(),left:i%cols*480,top:Math.floor(i/cols)*270})));
await sharp({create:{width:cols*480,height:Math.ceil(frames.length/cols)*270,channels:3,background:'#f0f0f0'}}).composite(tiles).jpeg({quality:90}).toFile('out/john-space-disco/wide-final-'+name+'.jpg');
}

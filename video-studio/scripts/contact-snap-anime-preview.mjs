import sharp from 'sharp';import fs from 'node:fs/promises';
const out='out/mom-just-snap-it',frames=[30,170,250,380,515,549,573,595,612,628,653,682,735,822,890,980];
for(const format of ['16x9','9x16']){
 const width=format==='16x9'?384:216,height=format==='16x9'?216:384;const inputs=[];
 for(let i=0;i<frames.length;i++){const path=out+`/review-${format}-${frames[i]}.jpg`;if(!(await fs.stat(path).catch(()=>null)))continue;inputs.push({input:await sharp(path).resize(width,height).toBuffer(),left:(i%4)*width,top:Math.floor(i/4)*height});}
 if(inputs.length)await sharp({create:{width:width*4,height:height*4,channels:3,background:'#c7c7c7'}}).composite(inputs).jpeg({quality:88}).toFile(out+`/preview-scenes-${format}.jpg`);
}

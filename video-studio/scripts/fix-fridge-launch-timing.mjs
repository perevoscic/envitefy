import fs from 'node:fs/promises';
const file='scripts/package-fridge-final.mjs';let s=await fs.readFile(file,'utf8');
s=s.replace("'-map','0:v','-map','0:a','-c:v','copy'","'-filter_complex','[0:v]split[main][reference];[main][reference]freezeframes=first=338:last=359:replace=335[v]','-map','[v]','-map','0:a','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p'");
await fs.writeFile(file,s);

import fs from 'node:fs/promises';
const file='src/mom-just-snap-it/SnapAnime.tsx';
let s=await fs.readFile(file,'utf8');
s=s.replace('import openingTracking from "./opening-tracking.json"','import openingTracking from "./opening-tracking-v3.json"').replaceAll('opening-lettering-base.mp4','opening-v3-final.mp4').replace(': f < 84',': f < 72').replace(': f < 102',': f < 96').replace(': f < 126',': f < 117').replace(': f < 140',': f < 135');
await fs.writeFile(file,s);
console.log('Shared opening updated in both compositions; calendar review holds improved.');

import fs from 'node:fs/promises';
const shot='scripts/composite-fridge-v3-camera.mjs';let m=await fs.readFile(shot,'utf8');m=m.replace(',despill=green:mix=0.35','');await fs.writeFile(shot,m);
const search='src/fridge-freedom/SearchV3.tsx';let s=await fs.readFile(search,'utf8');s=s.replace('  Sequence,\n','');s=s.replace('src={asset("v3-snap-landing.mp4")}','src={asset("v3-snap-landing.mp4")}\n                from={94}');await fs.writeFile(search,s);
let v2=await fs.readFile('src/FridgeFreedomV2.tsx','utf8');v2=v2.replace('function OpeningV2() {','export function OpeningV2() {');await fs.writeFile('src/FridgeFreedomV2.tsx',v2);

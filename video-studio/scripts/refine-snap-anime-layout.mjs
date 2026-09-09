import fs from 'node:fs/promises';
const p='src/mom-just-snap-it/SnapAnime.tsx';let s=await fs.readFile(p,'utf8');
s=s.replace('phoneH = v ? 1090 : 870','phoneH = v ? 940 : 870').replace('phoneT = v ? 440 : 112','phoneT = v ? 695 : 112');
s=s.replaceAll('{ left: 0, top: 0, width: 1080, height: 445 }','{ left: 90, top: 180, width: 900, height: 506, borderRadius: 28 }');
s=s.replace('top: v ? 30 : 66','top: v ? 102 : 66').replace('background: v ? "#fff9efd9" : "transparent"','background: "transparent"');
s=s.replace('extract: "All the details.\\nOne digital event."','extract: "Paper becomes digital."');
s=s.replace('<Screenshot name="directions" />','<Screenshot name="directions" crop={v ? 180 : 0} />').replace('y={phoneW * 1.2}','y={phoneW * 1.2 - (v ? 180 : 0)}');
s=s.replace('crop={v ? 90 : 115}','crop={v ? 225 : 115}').replace('crop={v ? 110 : 145}','crop={v ? 350 : 145}').replace('crop={v ? 20 : 50}','crop={v ? 80 : 50}');
await fs.writeFile(p,s);

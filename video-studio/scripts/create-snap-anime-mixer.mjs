import fs from 'node:fs/promises';
let s=await fs.readFile('scripts/prepare-snap-anime-edit.mjs','utf8');const imports=s.slice(0,s.indexOf('// Remove exactly'));const mix=s.slice(s.indexOf('const sr=48000'));await fs.writeFile('scripts/mix-snap-anime.mjs',imports+mix);

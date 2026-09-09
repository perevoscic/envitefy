import fs from 'node:fs/promises';
let s=await fs.readFile('scripts/prepare-small-shower.mjs','utf8');const start=s.indexOf("ff(['-ss','0.15'");await fs.writeFile('scripts/mix-small-shower.mjs',s.slice(0,s.indexOf('function clip'))+s.slice(start));

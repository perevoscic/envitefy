import fs from 'node:fs/promises';
let c=JSON.parse(await fs.readFile('src/mom-just-snap-it/captions.json','utf8'));c[c.length-1].startMs=27950;await fs.writeFile('src/mom-just-snap-it/captions.json',JSON.stringify(c,null,2));

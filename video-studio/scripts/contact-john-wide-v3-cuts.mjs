import fs from 'node:fs';
const code=fs.readFileSync('scripts/contact-john-wide-cuts.mjs','utf8').replaceAll('wide-final-','wide-v3-final-');
await import('data:text/javascript;base64,'+Buffer.from(code.replace("'../../node_modules/sharp/lib/index.js'",JSON.stringify(new URL('../../node_modules/sharp/lib/index.js',import.meta.url).href))).toString('base64'));

import fs from 'node:fs/promises';
const p='projects/small-shower';let verify=await fs.readFile('scripts/verify-small-shower-final.mjs','utf8');verify=verify.replace("const inherited={...process.env};", "if(process.argv.includes('--technical-only'))process.exit(0);\nconst inherited={...process.env};");await fs.writeFile('scripts/verify-small-shower-final.mjs',verify);
const notes=await fs.readFile('out/small-shower/final-loudness.txt','utf8');const match=notes.match(/\{\s*"input_i"[\s\S]*?\}/);if(match)await fs.writeFile(p+'/audio-loudness.json',match[0]);

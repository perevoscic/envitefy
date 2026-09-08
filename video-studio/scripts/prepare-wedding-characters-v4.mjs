import fs from 'node:fs';
for(const [p,from,to] of [
 ['src/wedding-characters/EndCard.tsx','envitefy.com/weddings','weddings'],
 ['src/Root.tsx','wedding-characters/wedding-characters-9x16-v3','wedding-characters/wedding-characters-9x16-v4'],
]){
 const original=fs.readFileSync(p,'utf8');if(!original.includes(from))throw new Error('Expected source missing: '+p);
 fs.writeFileSync(p,original.replace(from,to));
}
const bpath='projects/wedding-characters/brief.json';const b=JSON.parse(fs.readFileSync(bpath,'utf8'));
b.revisions.push({version:4,date:'2026-09-08',request:'Keep the supplied envitefy.com wordmark and replace the separate URL below it with the lowercase word weddings on a second row.',status:'in-production'});
b.callToAction.display={wordmark:'public/brand/envitefy-com.png',secondRow:'weddings'};
fs.writeFileSync(bpath,JSON.stringify(b,null,2));
fs.appendFileSync('projects/wedding-characters/feedback.md','\n- 2026-09-08 revision 4: Keep the existing supplied wordmark; show lowercase “weddings” alone on the centered row beneath it, replacing the duplicate URL. In production.\n');
const packaging=fs.readFileSync('scripts/package-wedding-characters-v3.mjs','utf8').replaceAll('wedding-characters-9x16-v3','wedding-characters-9x16-v4').replaceAll('v3-technical-review','v4-technical-review');
fs.writeFileSync('scripts/package-wedding-characters-v4.mjs',packaging);
console.log('V4 wordmark row and export setup ready.');

import fs from 'node:fs';
const path='projects/fridge-freedom/brief.json';
const brief=JSON.parse(fs.readFileSync(path,'utf8'));
brief.revisions=brief.revisions.filter(r=>r.version!==4);
brief.revisions.push({version:4,date:'2026-09-08',request:'The photo is taken before the finger presses the shutter in both photo appearances.',approach:'Use the visible thumb contact as the shared timing reference for button depression, flash, shutter sound and new thumbnail. Re-trim cleanup photo to show approach, contact and response.',composition:'EnvitefyFridgeFreedomV4',export:'out/fridge-freedom/fridge-freedom-9x16-v4.mp4'});
fs.writeFileSync(path,JSON.stringify(brief,null,2)+'\n');
fs.unlinkSync('scripts/create-fridge-v4.mjs');
console.log('Recorded the shutter-sync request.');

import fs from 'node:fs';
const file='scripts/package-john-wide-audio.mjs';
let source=fs.readFileSync(file,'utf8');
source=source.replace("import {ENVITEFY_IPA,ENVITEFY_SSML,ENVITEFY_SPOKEN_NAME,toDisplayText} from './brand-pronunciation.mjs';",'// Archive the exact submitted pronunciation so later shared-default edits cannot change this export.');
const anchor="const request=JSON.parse(fs.readFileSync(p+'voice-create-wide-'+version+'-request.json','utf8'));";
source=source.replace(anchor,anchor+String.raw`
const phoneme=request.body.text.match(/<phoneme alphabet="ipa" ph="([^"]+)">Envitefy<\/phoneme>/);
if(!phoneme)throw Error('Completed request must contain an explicit IPA tag');
const ENVITEFY_IPA=phoneme[1],ENVITEFY_SSML=phoneme[0],ENVITEFY_SPOKEN_NAME='Inviteefy';`);
source=source.replace('writtenBrand:toDisplayText(ENVITEFY_SSML)',"writtenBrand:'Envitefy'");
fs.writeFileSync(file,source);

import fs from 'node:fs';
const helper='scripts/brand-pronunciation.mjs';
let source=fs.readFileSync(helper,'utf8');
// IPA synthesis can return zero-stress normalized alignment labels even when the request has stress marks.
source=source.replace('@ay[12]@t@iy[01]@f@ay[02]','@ay[012]@t@iy[01]@f@ay[02]');
fs.writeFileSync(helper,source);
const setup='scripts/update-envitefy-ipa.mjs';
let updater=fs.readFileSync(setup,'utf8');
if(!updater.includes('Shared exact IPA is already current'))updater='import * as currentSpeech from "./brand-pronunciation.mjs";\nif(currentSpeech.ENVITEFY_IPA === "ɪnˈvaɪtiˌfaɪ" && currentSpeech.resolveSpeechModel && currentSpeech.withBrandPronunciationDirection){console.log("Shared exact IPA is already current; preserve the integrated helper.");process.exit(0);}\n'+updater;
fs.writeFileSync(setup,updater);
const {toDisplayText,ENVITEFY_SSML,ENVITEFY_IPA}=await import('./brand-pronunciation.mjs');
const record=JSON.parse(fs.readFileSync('projects/john-space-disco/voice-create-wide-v5-request.json','utf8'));
const alignment=JSON.parse(fs.readFileSync('projects/john-space-disco/voice-create-wide-v5-alignment.json','utf8'));
if(ENVITEFY_IPA!=='ɪnˈvaɪtiˌfaɪ'||!record.body.text.includes(ENVITEFY_SSML))throw Error('Exact IPA mismatch');
if(!toDisplayText(alignment.characters.join('')).includes('with Envitefy Concierge'))throw Error('Provider alignment did not restore official caption spelling');
console.log('Exact IPA request and actual provider-alignment caption normalization pass.');

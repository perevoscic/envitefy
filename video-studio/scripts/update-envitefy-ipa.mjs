import * as currentSpeech from "./brand-pronunciation.mjs";
if(currentSpeech.ENVITEFY_IPA === "ɪnˈvaɪtiˌfaɪ" && currentSpeech.resolveSpeechModel && currentSpeech.withBrandPronunciationDirection){console.log("Shared exact IPA is already current; preserve the integrated helper.");process.exit(0);}
import fs from 'node:fs/promises';
const ipa='ɪnˈvaɪtiˌfaɪ';
const tag='<phoneme alphabet="ipa" ph="'+ipa+'">Envitefy</phoneme>';
const helper=String.raw`/** User-specified pronunciation is authoritative for every newly generated Envitefy voice. */
export const ENVITEFY_SPOKEN_NAME = "Inviteefy";
export const ENVITEFY_IPA = "ɪnˈvaɪtiˌfaɪ";
export const ENVITEFY_SSML = '<phoneme alphabet="ipa" ph="ɪnˈvaɪtiˌfaɪ">Envitefy</phoneme>';
export const ENVITEFY_CMU_PHONEMES = "IH0 N V AY1 T IY0 F AY2";
export const ENVITEFY_PRONUNCIATION_NOTE = 'For all Envitefy speech use the exact user IPA /ɪnˈvaɪtiˌfaɪ/ and SSML <phoneme alphabet="ipa" ph="ɪnˈvaɪtiˌfaɪ">Envitefy</phoneme>. Preserve primary stress on VY and secondary stress on the final fy. The user’s spoken spelling is Inviteefy. Keep Envitefy in written branding, captions, URLs and artwork.';
const brandPattern = /\b(?:envitefy|inviteefy)\b/gi;
export function toDisplayText(text) {
  let result = text
    .replace(/<phoneme\b[^>]*>\s*(?:Envitefy|Inviteefy)\s*<\/phoneme>/gi, "Envitefy")
    .replace(/@ih0@n@v@ay[12]@t@iy[01]@f@ay[02]/gi, "Envitefy")
    .replace(/\bin[-‐‑– ]?vy[-‐‑– ]?tee[-‐‑– ]?fy\b/gi, "Envitefy")
    .replace(/\binvitee[-‐‑– ]?fy\b/gi, "Envitefy");
  for (const ipa of [ENVITEFY_IPA, "ɪnˌvaɪˈtiːfaɪ", "ɪnˈvaɪtiːfaɪ"])
    result = result.replaceAll('"/' + ipa + '/"', "Envitefy").replaceAll('/' + ipa + '/', "Envitefy");
  return result;
}
export function speechModelForText(text, requestedModel) {
  if (!/\b(?:envitefy|inviteefy)\b/i.test(toDisplayText(text))) return requestedModel;
  return requestedModel === "eleven_v3" ? "eleven_v3" : "eleven_flash_v2";
}
export function toSpeechText(text, modelId) {
  const plain = toDisplayText(text);
  const model = speechModelForText(plain, modelId);
  const spoken = model === "eleven_v3" ? '"/' + ENVITEFY_IPA + '/"' : ENVITEFY_SSML;
  return plain.replace(brandPattern, spoken);
}
`;
await fs.writeFile('scripts/brand-pronunciation.mjs',helper);
const tests=String.raw`import test from "node:test";
import assert from "node:assert/strict";
import {ENVITEFY_IPA,ENVITEFY_SSML,speechModelForText,toSpeechText,toDisplayText} from "./brand-pronunciation.mjs";
test("the user's exact IPA tag is preserved, including secondary stress",()=>{
 assert.equal(ENVITEFY_IPA,"ɪnˈvaɪtiˌfaɪ");
 assert.equal(ENVITEFY_SSML,'<phoneme alphabet="ipa" ph="ɪnˈvaɪtiˌfaɪ">Envitefy</phoneme>');
 for(const word of ["Envitefy","ENVITEFY","Inviteefy"])
   assert.equal(toSpeechText(word,"eleven_flash_v2"),ENVITEFY_SSML);
 assert.equal(toSpeechText("with Envitefy Concierge"),"with "+ENVITEFY_SSML+" Concierge");
});
test("brand speech selects a model that understands its pronunciation syntax",()=>{
 assert.equal(speechModelForText("Envitefy Concierge","eleven_multilingual_v2"),"eleven_flash_v2");
 assert.equal(speechModelForText("Envitefy","eleven_v3"),"eleven_v3");
 assert.equal(toSpeechText("Envitefy","eleven_v3"),'"/ɪnˈvaɪtiˌfaɪ/"');
 assert.equal(speechModelForText("Your live card updates.","eleven_multilingual_v2"),"eleven_multilingual_v2");
 assert.equal(toSpeechText("Your live card updates."),"Your live card updates.");
});
test("speech normalization is idempotent and captions keep official branding",()=>{
 const text="Create with Envitefy Concierge. Visit envitefy.com!";
 assert.equal(toSpeechText(toSpeechText(text)),toSpeechText(text));
 assert.equal(toDisplayText(toSpeechText(text)),"Create with Envitefy Concierge. Visit Envitefy.com!");
 assert.equal(toDisplayText(toSpeechText(text,"eleven_v3")),"Create with Envitefy Concierge. Visit Envitefy.com!");
});
test("old and current saved provider alignments remain readable",()=>{
 for(const token of ["@ih0@n@v@ay1@t@iy0@f@ay2","@ih0@n@v@ay1@t@iy0@f@ay0","@ih0@n@v@ay2@t@iy1@f@ay0","invitee-fy","Inviteefy","in-VY-tee-fy",'"/ɪnˈvaɪtiːfaɪ/"'])
   assert.equal(toDisplayText(token),"Envitefy");
});
`;
await fs.writeFile('scripts/brand-pronunciation.test.mjs',tests);
let source=await fs.readFile('scripts/generate-narration.mjs','utf8');
source=source.replace('toSpeechText, toDisplayText }','toSpeechText, toDisplayText, speechModelForText }');
source=source.replace('    const request = {\n      text: toSpeechText(scene.narration, brief.modelId),\n      model_id: brief.modelId,','    const modelId = speechModelForText(scene.narration, brief.modelId);\n    const request = {\n      text: toSpeechText(scene.narration, modelId),\n      model_id: modelId,');
await fs.writeFile('scripts/generate-narration.mjs',source);
for(const name of ['scripts/john-voice.mjs','scripts/john-wide-voice.mjs']){
 source=await fs.readFile(name,'utf8');
 source=source.replace('import { toSpeechText }','import { toSpeechText, speechModelForText }');
 source=source.replace("const model='eleven_flash_v2';","const model=speechModelForText(texts[mode],'eleven_flash_v2');");
 await fs.writeFile(name,source);
}
const note='For **all Envitefy audio**, use the exact user pronunciation **Inviteefy**, IPA **/'+ipa+'/**. The authoritative SSML is `'+tag+'`. Preserve primary stress on VY and secondary stress on the final fy exactly as supplied. Use `scripts/brand-pronunciation.mjs` for every speech request: Flash v2 receives the exact IPA tag; Eleven v3 receives the same IPA in its native syntax. The shared generator selects a compatible model for brand-bearing speech. Keep **Envitefy** in written copy, captions, URLs and artwork. Include the exact IPA in generated-dialogue prompts. Audition the spoken name; automatic transcription alone is not proof of pronunciation. This supersedes all earlier aliases and phoneme strings.';
let guide=await fs.readFile('STUDIO-GUIDE.md','utf8');
guide=guide.replace(/^- Standing pronunciation.*$/m,'- Standing pronunciation (September 8, 2026, exact IPA correction): '+note);
guide+='\n- 2026-09-08: User supplied exact IPA `'+ipa+'` and the IPA phoneme tag, asking that it govern all Envitefy audio. Saved verbatim, including secondary stress on final fy, and applied to all reusable speech-generation paths.\n';
await fs.writeFile('STUDIO-GUIDE.md',guide);
const skill='.agents/skills/envitefy-video-producer/SKILL.md';
source=await fs.readFile(skill,'utf8');
source=source.replace(/4\. [^\n]*?(?=Generate\/select assets)/,'4. '+note+' ');
await fs.writeFile(skill,source);
const reference='.agents/skills/envitefy-video-producer/references/production.md';
source=await fs.readFile(reference,'utf8');
source=source.replace(/(## Spoken brand name\r?\n)[\s\S]*?(?=\r?\n## )/,'$1\n'+note+' See [STUDIO-GUIDE.md](../../../../STUDIO-GUIDE.md).\n');
await fs.writeFile(reference,source);
const brand='../.agents/skills/brand/SKILL.md';
source=await fs.readFile(brand,'utf8');
source=source.replace(/## Envitefy spoken name[\s\S]*?(?=\n## )/,'## Envitefy spoken name\n\n'+note.replaceAll('`scripts/brand-pronunciation.mjs`','`video-studio/scripts/brand-pronunciation.mjs`')+' See [the studio guide](../../../video-studio/STUDIO-GUIDE.md).\n');
await fs.writeFile(brand,source);
console.log('Exact IPA saved for all speech paths: '+ipa);

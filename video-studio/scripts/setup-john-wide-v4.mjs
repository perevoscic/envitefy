import {ENVITEFY_IPA as CURRENT_ENVITEFY_IPA} from "./brand-pronunciation.mjs";
if(CURRENT_ENVITEFY_IPA !== "ɪnˈvaɪtiːfaɪ"){console.log("Historical setup skipped: preserve the newer shared pronunciation.");process.exit(0);}
import fs from 'node:fs/promises';
const note='Pronounce Envitefy as in-VY-tee-fy: four connected syllables, short in, primary stress on VY (rhymes with eye), then unstressed tee and fy (rhymes with eye). Say it smoothly as one word. Keep Envitefy in written copy, captions, URLs and artwork.';
const phoneme='CMU `IH0 N V AY1 T IY0 F AY0`; IPA `/ɪnˈvaɪtiːfaɪ/`';
const helper=`/** Spoken forms are audio-only; keep the official spelling in captions and artwork. */
export const ENVITEFY_SPOKEN_NAME = "in-VY-tee-fy";
export const ENVITEFY_PRONUNCIATION_NOTE = ${JSON.stringify(note)};
export const ENVITEFY_CMU_PHONEMES = "IH0 N V AY1 T IY0 F AY0";
export const ENVITEFY_IPA = "ɪnˈvaɪtiːfaɪ";
export function toSpeechText(text, modelId) {
  const spoken = modelId === "eleven_flash_v2"
    ? '<phoneme alphabet="cmu-arpabet" ph="' + ENVITEFY_CMU_PHONEMES + '">Envitefy</phoneme>'
    : modelId === "eleven_v3" ? '\"/' + ENVITEFY_IPA + '/\"' : ENVITEFY_SPOKEN_NAME;
  return text.replace(/\\benvitefy\\b/gi, spoken);
}
export function toDisplayText(text) {
  return text
    .replace(/<phoneme\\b[^>]*>Envitefy<\\/phoneme>/gi, "Envitefy")
    .replace(/@ih0@n@v@ay[12]@t@iy[01]@f@ay0/gi, "Envitefy")
    .replace(/"?\\/(?:ɪnˌvaɪˈtiːfaɪ|ɪnˈvaɪtiːfaɪ)\\/"?/g, "Envitefy")
    .replace(/\\bin[-‐‑– ]?vy[-‐‑– ]?tee[-‐‑– ]?fy\\b/gi, "Envitefy")
    .replace(/\\binvitee[-‐‑– ]?fy\\b/gi, "Envitefy");
}
`;
await fs.writeFile('scripts/brand-pronunciation.mjs',helper);
let tests=await fs.readFile('scripts/brand-pronunciation.test.mjs','utf8');
tests=tests.replaceAll('invitee-fy','in-VY-tee-fy').replaceAll('IH0 N V AY2 T IY1 F AY0','IH0 N V AY1 T IY0 F AY0').replaceAll('ɪnˌvaɪˈtiːfaɪ','ɪnˈvaɪtiːfaɪ').replaceAll('@ih0@n@v@ay2@t@iy1@f@ay0','@ih0@n@v@ay1@t@iy0@f@ay0');
tests+='\ntest("new stress instruction preserves displayed branding and old saved alignment",()=>{\n assert.equal(toDisplayText(toSpeechText("Envitefy Concierge", "eleven_flash_v2")),"Envitefy Concierge");\n assert.equal(toDisplayText("invitee-fy and @ih0@n@v@ay2@t@iy1@f@ay0"),"Envitefy and Envitefy");\n});\n';
await fs.writeFile('scripts/brand-pronunciation.test.mjs',tests);
let guide=await fs.readFile('STUDIO-GUIDE.md','utf8');
guide=guide.replace(/^- Standing pronunciation.*$/m,'- Standing pronunciation (September 8, 2026, latest correction): **in-VY-tee-fy**. '+note+' Use the audio-only helper `scripts/brand-pronunciation.mjs`: '+phoneme+'. The VY syllable carries primary stress; tee is unstressed. Use the phoneme-capable speech path for name corrections. Audition the name; automatic transcription alone does not establish the correct stress. This supersedes invitee-fy / 1nvitee-fy and earlier variants.');
guide+='\n- 2026-09-08: User updated the pronunciation to **in-VY-tee-fy**, moving primary stress to VY. Updated the standing studio/brand instructions and shared phoneme helper; written Envitefy branding remains unchanged.\n';
await fs.writeFile('STUDIO-GUIDE.md',guide);
const skill='.agents/skills/envitefy-video-producer/SKILL.md';
let text=await fs.readFile(skill,'utf8');
text=text.replace(/4\. Pronounce Envitefy[\s\S]*?(?=Generate\/select assets)/,'4. **'+note+'** Apply the shared helper `scripts/brand-pronunciation.mjs` to TTS and generated-dialogue prompts, using '+phoneme+' for explicit stress control. This supersedes invitee-fy and 1nvitee-fy. Audition the name; automatic transcription alone does not prove pronunciation. ');
await fs.writeFile(skill,text);
const reference='.agents/skills/envitefy-video-producer/references/production.md';
text=await fs.readFile(reference,'utf8');
text=text.replace(/Envitefy is pronounced[^\n]*/,note+' Use `scripts/brand-pronunciation.mjs` with '+phoneme+'. This supersedes invitee-fy / 1nvitee-fy. Audition the name; automatic transcription alone does not verify syllable stress. See [STUDIO-GUIDE.md](../../../../STUDIO-GUIDE.md).');
await fs.writeFile(reference,text);
const brand='../.agents/skills/brand/SKILL.md';
text=await fs.readFile(brand,'utf8');
text=text.replace(/## Envitefy spoken name[\s\S]*?(?=\n## )/,'## Envitefy spoken name\n\n**Latest user pronunciation (September 8, 2026): in-VY-tee-fy.** '+note+'\n\nUse the phoneme-capable speech path in `video-studio/scripts/brand-pronunciation.mjs`: '+phoneme+'. This supersedes invitee-fy / 1nvitee-fy and prior variants. Audition the name; automatic transcription alone does not verify syllable stress. See [the studio guide](../../../video-studio/STUDIO-GUIDE.md).\n');
await fs.writeFile(brand,text);
let voice=await fs.readFile('scripts/john-voice.mjs','utf8');
voice=voice.replace("||'v5'","||'v4'").replaceAll('vo-${mode}-${version}','vo-${mode}-wide-${version}').replaceAll('voice-${mode}-${version}','voice-${mode}-wide-${version}');
await fs.writeFile('scripts/john-wide-voice.mjs',voice);
await fs.writeFile('projects/john-space-disco/revision-16x9-v4.md','# Horizontal V4 — pronunciation correction\n\nUser: update pronunciation to **in-VY-tee-fy**.\n\n'+note+'\n\nThe requested syllable stress is '+phoneme+'. The existing Jessica voice uses the supported SSML phoneme path. Reference: https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices\n\nReplace only the creation narration. Preserve all V3 video frames, including corrected Mom/dinosaur continuity, laptop cover and Live Cards closing label. Write a separate V4 export and update current production defaults after review.\n');
console.log('in-VY-tee-fy saved in the shared speech helper and standing studio/brand instructions.');

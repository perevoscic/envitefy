import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ENVITEFY_SSML, ENVITEFY_IPA, ENVITEFY_IPA_SSML, ENVITEFY_SPOKEN_NAME, ENVITEFY_PRONUNCIATION_NOTE, toSpeechText, toDisplayText, resolveSpeechModel, speechModelForText, withBrandPronunciationDirection} from './brand-pronunciation.mjs';
const exact='<phoneme alphabet="cmu-arpabet" ph="EH1 N">En</phoneme><phoneme alphabet="cmu-arpabet" ph="V AY1 T">vite</phoneme><phoneme alphabet="cmu-arpabet" ph="F AY0">fy</phoneme>';
test('speech controls agree with the mandatory brand document',()=>{
 const standard=fs.readFileSync(new URL('../../ENVITEFY_BRAND.md',import.meta.url),'utf8');
 assert.ok(standard.includes('**Target: '+ENVITEFY_SPOKEN_NAME+'**'));
 assert.ok(standard.includes('/'+ENVITEFY_IPA+'/'));
 assert.ok(standard.includes(ENVITEFY_PRONUNCIATION_NOTE));
});
test('every mention uses compatible continuous three-syllable pronunciation',()=>{
 assert.equal(ENVITEFY_SSML,exact);
 assert.equal(toSpeechText('Envitefy Concierge. envitefy.com. ENVITEFY.'),exact+' Concierge. '+exact+'.com. '+exact+'.');
 for(const old of ['Inviteefy','in-VY-tee-fy','en-VITE-fy',ENVITEFY_IPA_SSML,exact])assert.equal(toSpeechText(old),exact);
});
test('unsupported speech models route to phoneme support',()=>{
 assert.equal(resolveSpeechModel('Envitefy','eleven_multilingual_v2'),'eleven_flash_v2');
 assert.equal(speechModelForText('Envitefy','eleven_multilingual_v2'),'eleven_flash_v2');
 assert.equal(resolveSpeechModel('No brand name.','eleven_multilingual_v2'),'eleven_multilingual_v2');
 assert.equal(toSpeechText('Envitefy','eleven_v3'),'"/'+ENVITEFY_IPA+'/"');
 assert.equal(toSpeechText('Your live card updates.'),'Your live card updates.');
});
test('current and archived alignment retain official caption spelling',()=>{
 for(const sample of [exact,ENVITEFY_IPA_SSML,'@eh1@n@v@ay1@t@f@ay0','@eh0@n@v@ay1@t@f@ay0','@eh0@n@v@ay0@t@f@ay0','@ih0@n@v@ay1@t@iy0@f@ay2','@ih0@n@v@ay2@t@iy1@f@ay0','"/ɛnˈvaɪtfaɪ/"','"/ɪnˈvaɪtiˌfaɪ/"','"/ɪnˈvaɪtiːfaɪ/"','Inviteefy','in-VY-tee-fy'])assert.equal(toDisplayText(sample),'Envitefy');
});
test('native direction is idempotent and does not add dialogue',()=>{
 const p='John dances beside a dinosaur.';assert.equal(withBrandPronunciationDirection(p),p);
 const branded=withBrandPronunciationDirection('An Envitefy advertisement.');
 assert.ok(branded.includes(ENVITEFY_PRONUNCIATION_NOTE));assert.ok(branded.includes('do not add dialogue'));
 assert.equal(withBrandPronunciationDirection(branded),branded);
});

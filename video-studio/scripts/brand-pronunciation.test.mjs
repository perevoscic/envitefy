import test from 'node:test';
import assert from 'node:assert/strict';
import {ENVITEFY_SSML,ENVITEFY_IPA,toSpeechText,toDisplayText,resolveSpeechModel,speechModelForText,withBrandPronunciationDirection} from './brand-pronunciation.mjs';
const exact='<phoneme alphabet="ipa" ph="ɪnˈvaɪtiˌfaɪ">Envitefy</phoneme>';
test('all name mentions use the exact user IPA tag',()=>{
 assert.equal(ENVITEFY_SSML,exact);
 assert.equal(toSpeechText('Envitefy Concierge. envitefy.com. ENVITEFY.'),exact+' Concierge. '+exact+'.com. '+exact+'.');
 assert.equal(toSpeechText('Inviteefy'),exact);assert.equal(toSpeechText(exact),exact);
});
test('model compatibility retains the exact IPA',()=>{
 assert.equal(resolveSpeechModel('Envitefy','eleven_multilingual_v2'),'eleven_flash_v2');
 assert.equal(speechModelForText('Envitefy','eleven_multilingual_v2'),'eleven_flash_v2');
 assert.equal(resolveSpeechModel('No brand name.','eleven_multilingual_v2'),'eleven_multilingual_v2');
 assert.equal(toSpeechText('Envitefy','eleven_v3'),'"/'+ENVITEFY_IPA+'/"');
 assert.equal(toSpeechText('Your live card updates.'),'Your live card updates.');
});
test('current and archived alignment preserve written branding',()=>{
 for(const sample of [exact,'@ih0@n@v@ay1@t@iy0@f@ay2','@ih0@n@v@ay2@t@iy1@f@ay0','"/ɪnˈvaɪtiˌfaɪ/"','"/ɪnˈvaɪtiːfaɪ/"','Inviteefy','in-VY-tee-fy'])assert.equal(toDisplayText(sample),'Envitefy');
});
test('native direction controls pronunciation without adding dialogue',()=>{
 const p='John dances beside a dinosaur.';assert.equal(withBrandPronunciationDirection(p),p);
 const branded=withBrandPronunciationDirection('An Envitefy advertisement.');
 assert.ok(branded.includes('/ɪnˈvaɪtiˌfaɪ/'));assert.ok(branded.includes('do not add dialogue'));
 assert.equal(withBrandPronunciationDirection(branded),branded);
});

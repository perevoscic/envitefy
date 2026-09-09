import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
const inherited={...process.env};
dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});Object.assign(process.env,inherited);
const source='public/projects/john-space-disco/vo-create-sapi-reference.wav';
const resultPath='projects/john-space-disco/brand-sapi-reference-audio-review.json';
const requestPath='projects/john-space-disco/brand-sapi-reference-audio-review-request.json';
if(await fs.stat(resultPath).catch(()=>null)){console.log(await fs.readFile(resultPath,'utf8'));process.exit(0);}
if(await fs.stat(requestPath).catch(()=>null))throw Error('Prior audit submission exists; inspect its state before retrying.');
const bytes=await fs.readFile(source);
const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
if(sha256!=='998b6971ccaef3506fa9e1d1229575e9e86201dc92157635a2d08e08e25201a0')throw Error('The verified synthetic stock-voice file changed.');
const tts=JSON.parse(await fs.readFile('projects/john-space-disco/voice-sapi-reference-request.json','utf8'));
if(tts.status!=='completed'||tts.voice!=='Microsoft Zira Desktop'||tts.body.text!=='Bring their birthday ideas to life with <phoneme alphabet="ipa" ph="ɛnˈvaɪtfaɪ">Envitefy</phoneme> Concierge.')throw Error('Synthetic narration provenance mismatch.');
const model='gemini-3.5-flash';
const destination='https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent';
const prompt='Listen to the attached short synthetic adult narrator audio. First transcribe the words you actually hear and report the audible pronunciation of the brand before Concierge in IPA and plain syllables. Then judge whether it matches this written standard: en-VITE-fy, /ɛnˈvaɪtfaɪ/, short en as in enter, stressed VITE rhyming with bite, final fy rhyming with fly. It must be a continuous THREE-syllable word; there must be no extra ee/ih/tee syllable between VITE and fy and no unnatural pause. Do not assume the sound matches the target. Report initial vowel, syllable count, strongest syllable, extra vowel or pause if any, complete intelligible sentence, natural delivery, any defect or uncertainty, and matchesStandard as a boolean. Base your judgment on the audio, not on the expected spelling. Return concise JSON.';
const provenance={source,sha256,bytes:bytes.length,scope:'Only a freshly generated stock Microsoft Zira Desktop adult TTS voice saying the user-provided promotional sentence. No personal recordings, child/parent dialogue, soundtrack, customer data or video included.',model,destination,prompt};
await fs.writeFile(requestPath,JSON.stringify({...provenance,status:'submitting'},null,2)+'\n');
const response=await fetch(destination,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts:[{inlineData:{mimeType:'audio/wav',data:bytes.toString('base64')}},{text:prompt}]}],generationConfig:{temperature:0,responseMimeType:'application/json'}}),signal:AbortSignal.timeout(60000)});
if(!response.ok){await fs.writeFile(requestPath,JSON.stringify({...provenance,status:'failed',httpStatus:response.status},null,2));throw Error('Audio review HTTP '+response.status);}
const result=await response.json();const content=result.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('\n');
if(!content)throw Error('Audio review returned no content');
const review=JSON.parse(content.replace(/^```json\s*|```$/g,''));
await fs.writeFile(resultPath,JSON.stringify({...provenance,status:'completed',review,reviewedAt:new Date().toISOString()},null,2)+'\n');
await fs.writeFile(requestPath,JSON.stringify({...provenance,status:'completed'},null,2)+'\n');
console.log(JSON.stringify(review,null,2));

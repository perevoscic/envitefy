import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
const inherited={...process.env};
dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});Object.assign(process.env,inherited);
const resultPath='projects/mom-just-snap-it/audio-review-v3.json';
const requestPath=resultPath.replace('.json','-request.json');
if(await fs.stat(resultPath).catch(()=>null)){console.log(await fs.readFile(resultPath,'utf8'));process.exit(0);}
if(await fs.stat(requestPath).catch(()=>null))throw Error('Prior submission exists; inspect before retrying.');
const reference='assets/brand/audio/envitefy-approved-jessica-concierge.mp3';
const candidate='public/projects/mom-just-snap-it/final-mix-v2.wav';
const ref=await fs.readFile(reference),voice=await fs.readFile(candidate);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
if(hash(ref)!=='998e444775b292b467c75607e44750f5ae482d4a430632f50986480dd5ce7edc')throw Error('Approved synthetic reference changed');
const prompt=`You are an exacting commercial audio and English phonetics reviewer. Two audio files follow. REFERENCE is an explicitly user-approved SYNTHETIC stock Jessica narrator saying 'Bring their birthday ideas to life with Envitefy Concierge.' It is the approved acoustic brand-pronunciation target. CANDIDATE is the generated fictional anime family commercial final mix, exactly 35 seconds. No real parent or child recording is included. Compare what you can HEAR, not the expected script or spelling. Ignore difference in character/voice identity. At around 7–10 seconds the daughter says the brand. Compare audible initial vowel, syllable count, stress and especially the short unstressed tih between VY and fy against the approved synthetic reference. Approximate target /ɪnˈvaɪtɪfaɪ/, in-VY-tih-fy, one continuous four-syllable word with VY stress. Report referenceIPA, candidateIPA, syllables, phoneticMatch, audibleDifferences, uncertainty. Also transcribe every audible spoken line with approximate start/end seconds. Listen particularly to Mom's line around 28–31 seconds: Is the full sentence 'Finally—room for the important stuff!' clearly audible and naturally delivered? Any repeated words, extra dialogue, clipped sentence, distracting audio edit, robotic delivery, music masking, audible clipping, or unexplained silent talking? Expected script is Girl 'Mom! Can I go?', Girl 'Mom, I learned about Envitefy at school! Snap the invite, make it digital, and save it to your calendar!', Girl 'Directions, RSVP—and you can share it with Dad!', Mom 'Finally—room for the important stuff!' Use the expected script only as a comparison after independent listening. Return JSON with phoneticMatch boolean, motherAudible boolean, fullScriptIntact boolean, naturalDelivery boolean, defects array, detailed phonetics and timed transcript. Do not approve doubtful audio.`;
const model='gemini-3.1-pro-preview',destination=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const provenance={reference,referenceSha256:hash(ref),candidate,candidateSha256:hash(voice),model,destination,prompt,scope:'Only two generated advertising audio assets. The private user pronunciation recording is not read or uploaded.'};
await fs.writeFile(requestPath,JSON.stringify({...provenance,status:'submitting'},null,2));
try{
 const response=await fetch(destination,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts:[{text:'APPROVED SYNTHETIC REFERENCE'},{inlineData:{mimeType:'audio/mpeg',data:ref.toString('base64')}},{text:'CANDIDATE FINAL MIX'},{inlineData:{mimeType:'audio/wav',data:voice.toString('base64')}},{text:prompt}]}],generationConfig:{temperature:0,responseMimeType:'application/json'}}),signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw Error('Audio audit HTTP '+response.status);
 const data=await response.json();const raw=data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('\n');if(!raw)throw Error('No audit content');const review=JSON.parse(raw);
 await fs.writeFile(resultPath,JSON.stringify({...provenance,status:'completed',review,reviewedAt:new Date().toISOString()},null,2));
 await fs.writeFile(requestPath,JSON.stringify({...provenance,status:'completed'},null,2));
 console.log(JSON.stringify(review,null,2));
}catch(error){await fs.writeFile(requestPath,JSON.stringify({...provenance,status:'failed',error:error.message},null,2));throw error;}

import fs from 'node:fs/promises';import crypto from 'node:crypto';import dotenv from 'dotenv';
const inherited={...process.env};dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});Object.assign(process.env,inherited);
const p='projects/john-space-disco/',resultPath=p+'user-reference-final-mixes-audio-review.json',requestPath=p+'user-reference-final-mixes-audio-review-request.json';
if(await fs.stat(resultPath).catch(()=>null)){console.log(await fs.readFile(resultPath,'utf8'));process.exit(0);}
if(await fs.stat(requestPath).catch(()=>null))throw Error('Prior submission exists; inspect before retrying');
const original='C:/Users/rjosan/Downloads/envitefy.wav',originalHash=crypto.createHash('sha256').update(await fs.readFile(original)).digest('hex');
if(originalHash!=='04655c5247cf95d075555868e6213b1f12f0772f94ab64ef7933f7661d6a31f6')throw Error('Reference changed');
const reference='out/john-space-disco/user-envitefy-pronunciation-reference.wav',ref=await fs.readFile(reference);
const parts=[{text:'AUTHORITATIVE USER PRONUNCIATION REFERENCE:'},{inlineData:{mimeType:'audio/wav',data:ref.toString('base64')}}],clips=[];
const revision=JSON.parse(await fs.readFile(p+'user-reference-revision.json','utf8'));
for(const r of revision.records){
 if(r.voice!=='public/projects/john-space-disco/vo-create-jessica-user-reference-v1.mp3'||r.start<5.3||r.start+r.voiceDurationSeconds+.25>12)throw Error('Unexpected final sample scope');
 const label=r.prefix==='vertical'?'vertical':'horizontal',source='out/john-space-disco/'+r.prefix+'-v'+r.version+'-final-voice-review.wav',bytes=await fs.readFile(source);
 clips.push({label,source,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
 parts.push({text:'FINAL '+label.toUpperCase()+' NARRATION MIX:'},{inlineData:{mimeType:'audio/wav',data:bytes.toString('base64')}});
}
const prompt='Use the first recording as the authoritative pronunciation. Compare the brand name spoken before Concierge in EACH of the two final narrator/music clips directly against that recording. Ignore voice identity differences. Judge audible vowel/consonant sounds, all syllables, primary stress, and continuous delivery from the actual audio, not brand spelling. Also check intelligibility over music and complete sentence endings. Return JSON with referenceIPA and clips array; each clip must have label (vertical or horizontal), transcript, brandIPA, syllableCount, stressMatchesReference, pronunciationMatchesReference, intelligible, naturalDelivery, issues. If a mismatch is audible, describe it clearly. Do not assume a previous written standard.';
parts.push({text:prompt});
const provenance={reference,originalHash,clips,model:'gemini-3.1-pro-preview',prompt,scope:'User explicitly approved the reference upload to Gemini. Final clips contain only newly generated stock adult narrator speech, instrumental music and effects; no native character dialogue or full videos.'};
await fs.writeFile(requestPath,JSON.stringify({...provenance,status:'submitting'},null,2)+'\n');
const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts}],generationConfig:{temperature:0,responseMimeType:'application/json'}}),signal:AbortSignal.timeout(60000)});
if(!response.ok)throw Error('Audio comparison HTTP '+response.status);const data=await response.json(),raw=data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('\n');if(!raw)throw Error('No audio comparison response');
const review=JSON.parse(raw);await fs.writeFile(resultPath,JSON.stringify({...provenance,status:'completed',review},null,2)+'\n');console.log(JSON.stringify(review,null,2));

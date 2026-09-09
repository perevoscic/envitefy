
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
const inherited={...process.env};dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});Object.assign(process.env,inherited);
const p='projects/john-space-disco/',resultPath=p+'share-narration-audio-review.json',requestPath=p+'share-narration-audio-review-request.json';
if(await fs.stat(resultPath).catch(()=>null)){console.log(await fs.readFile(resultPath,'utf8'));process.exit(0);}
if(await fs.stat(requestPath).catch(()=>null))throw Error('Prior request exists: inspect before retrying');
const revision=JSON.parse(await fs.readFile(p+'share-narration-revision.json','utf8'));
const parts=[],clips=[];
for(const r of revision.records){
 const path='out/john-space-disco/'+r.prefix+'-v'+r.version+'-share-review.wav',bytes=await fs.readFile(path);
 if(r.shareVoice!=='public/projects/john-space-disco/vo-share-v1.mp3'||r.shareStartSeconds!==12.25)throw Error('Unexpected sample scope');
 clips.push({label:r.aspectRatio,path,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),scope:'Only seconds 12–17 of this commercial: newly generated stock adult Jessica promotional narration, instrumental music, and interface effects. No character dialogue or user recording.'});
 parts.push({text:'AUDIO CLIP '+r.aspectRatio},{inlineData:{mimeType:'audio/wav',data:bytes.toString('base64')}});
}
const prompt='Review the two finished sharing-scene audio clips by listening to the supplied audio. For each, transcribe every spoken word and assess whether the narration is clearly intelligible over the instrumental music, naturally paced and delivered, and complete without cut-off words. Check transitions and distracting clicks or distortion. Return JSON with clips array; each entry has label (9:16 or 16:9), transcript, intelligible, naturalDelivery, completeSentence, cleanTransitions, and issues (array). Judge the actual sound, not any prior expected text.';
parts.push({text:prompt});
const provenance={model:'gemini-3.5-flash',clips,prompt};
await fs.writeFile(requestPath,JSON.stringify({...provenance,status:'submitting'},null,2)+'\n');
const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts}],generationConfig:{temperature:0,responseMimeType:'application/json'}}),signal:AbortSignal.timeout(60000)});
if(!response.ok)throw Error('Audio review HTTP '+response.status);
const data=await response.json(),raw=data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('\n');
if(!raw)throw Error('No audio review response');
const review=JSON.parse(raw);
await fs.writeFile(resultPath,JSON.stringify({...provenance,status:'completed',review},null,2)+'\n');
console.log(JSON.stringify(review,null,2));


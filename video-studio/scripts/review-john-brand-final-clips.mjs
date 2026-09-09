import fs from 'node:fs/promises';import crypto from 'node:crypto';import dotenv from 'dotenv';
const inherited={...process.env};dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});Object.assign(process.env,inherited);
const statePath='projects/john-space-disco/brand-standard-final-clips-review-request.json',resultPath='projects/john-space-disco/brand-standard-final-clips-audio-review.json';
if(await fs.stat(resultPath).catch(()=>null)){console.log(await fs.readFile(resultPath,'utf8'));process.exit(0);}
if(await fs.stat(statePath).catch(()=>null))throw Error('Review previously submitted; inspect before retrying.');
const revisions=JSON.parse(await fs.readFile('projects/john-space-disco/brand-standard-revision.json','utf8'));
const parts=[],clips=[];
for(const r of revisions.records){
 if(r.voice!=='public/projects/john-space-disco/vo-create-v12.mp3'||r.start<5.3||r.start+r.voiceDurationSeconds+.25>9.7)throw Error('Unexpected review clip source');
 const source='out/john-space-disco/'+r.prefix+'-v'+r.version+'-final-voice-review.wav';
 const bytes=await fs.readFile(source);const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
 clips.push({label:r.aspectRatio,source,sha256,bytes:bytes.length,start:r.start,duration:r.voiceDurationSeconds+.25});
 parts.push({text:'Clip '+r.aspectRatio+':'},{inlineData:{mimeType:'audio/wav',data:bytes.toString('base64')}});
}
const prompt='Listen to both supplied short final narration clips. They contain the same stock narrator line over instrumental music. For EACH labeled clip separately, report the words actually heard, the brand name pronunciation in IPA, syllable count, stress, any inserted vowel or unnatural pause, intelligibility over music, and any audible clipping or unnatural edit. The pronunciation standard to check is en-VITE-fy /ɛnˈvaɪtfaɪ/: short en as in enter, stressed VITE rhyming with bite, fy rhyming with fly, three syllables joined continuously, no extra ih or tee syllable. Do not infer what is spoken from the spelling. Return JSON with clips array, each with label,transcript,brandIPA,syllables,stress,continuous,intelligible,issues,matchesStandard.';
parts.push({text:prompt});
const provenance={model:'gemini-3.5-flash',clips,prompt,scope:'Only the newly generated stock Jessica adult promotional sentence, previously generated instrumental music and effects. Clips cover 5.35/5.5 to about 8.7 seconds. Native animated character dialogue occurs outside these intervals and is not uploaded.'};
await fs.writeFile(statePath,JSON.stringify({...provenance,status:'submitting'},null,2)+'\n');
const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts}],generationConfig:{temperature:0,responseMimeType:'application/json'}}),signal:AbortSignal.timeout(60000)});
if(!response.ok){await fs.writeFile(statePath,JSON.stringify({...provenance,status:'failed',httpStatus:response.status},null,2));throw Error('Review HTTP '+response.status);}
const data=await response.json(),raw=data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('\n');if(!raw)throw Error('No review output');
const review=JSON.parse(raw);
await fs.writeFile(resultPath,JSON.stringify({...provenance,status:'completed',review,reviewedAt:new Date().toISOString()},null,2)+'\n');await fs.writeFile(statePath,JSON.stringify({...provenance,status:'completed'},null,2)+'\n');console.log(JSON.stringify(review,null,2));

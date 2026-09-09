import fs from 'node:fs/promises';import crypto from 'node:crypto';import dotenv from 'dotenv';
const inherited={...process.env};dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});Object.assign(process.env,inherited);
const source='public/projects/john-space-disco/vo-create-sapi-reference.wav',output='public/projects/john-space-disco/vo-create-jessica-reference-v1.mp3',record='projects/john-space-disco/voice-jessica-reference-v1-request.json';
if(await fs.stat(output).catch(()=>null)){console.log('Reusing voice-converted take');process.exit(0);}
if(await fs.stat(record).catch(()=>null))throw Error('Prior request exists; inspect before retrying');
const bytes=await fs.readFile(source),sha256=crypto.createHash('sha256').update(bytes).digest('hex');
if(sha256!=='998b6971ccaef3506fa9e1d1229575e9e86201dc92157635a2d08e08e25201a0')throw Error('Local synthetic reference changed');
const review=JSON.parse(await fs.readFile('projects/john-space-disco/brand-sapi-reference-audio-review.json','utf8'));if(!review.review.matchesStandard)throw Error('Reference pronunciation failed');
const voice='Jessica',model='eleven_multilingual_sts_v2',voiceSettings={stability:.5,similarity_boost:.75,style:.2,use_speaker_boost:true};
const provenance={source,sourceSha256:sha256,sourceBytes:bytes.length,sourceType:'Locally generated Microsoft Zira stock speech with exact IPA /ɛnˈvaɪtfaɪ/. Not a human recording.',voice,model,voiceSettings,script:'Bring their birthday ideas to life with Envitefy Concierge.',pronunciation:'en-VITE-fy',output};
await fs.writeFile(record,JSON.stringify({...provenance,status:'submitting'},null,2)+'\n');
const body=new FormData();body.append('audio',new Blob([bytes],{type:'audio/wav'}),'synthetic-reference.wav');body.append('model_id',model);body.append('voice_settings',JSON.stringify(voiceSettings));
const response=await fetch('https://api.elevenlabs.io/v1/speech-to-speech/cgSgspJ2msm6clMCkdW9?output_format=mp3_44100_128',{method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY},body,signal:AbortSignal.timeout(60000)});
if(!response.ok){await fs.writeFile(record,JSON.stringify({...provenance,status:'failed',httpStatus:response.status},null,2));throw Error('Voice conversion HTTP '+response.status);}
const audio=Buffer.from(await response.arrayBuffer());await fs.writeFile(output,audio);await fs.writeFile(record,JSON.stringify({...provenance,status:'completed',outputSha256:crypto.createHash('sha256').update(audio).digest('hex'),outputBytes:audio.length},null,2)+'\n');console.log(JSON.stringify({output,bytes:audio.length,sha256:crypto.createHash('sha256').update(audio).digest('hex')}));

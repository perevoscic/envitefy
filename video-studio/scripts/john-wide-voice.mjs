import { toSpeechText, speechModelForText, ENVITEFY_PRONUNCIATION_NOTE } from "./brand-pronunciation.mjs";
import fs from 'node:fs/promises';
import dotenv from 'dotenv';
const inherited={...process.env};
dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});Object.assign(process.env,inherited);
const mode=process.argv[2]||'sample';
const version=process.argv[3]||'v6';
if(!/^v[0-9]+$/.test(version))throw Error('Invalid voice version');
const texts={sample:'Bring their birthday ideas to life.',create:'Bring their birthday ideas to life with Envitefy Concierge.',update:'Change the plans. Your live card updates. No resending needed.'};
const file=`public/projects/john-space-disco/vo-${mode}-wide-${version}.mp3`,record=`projects/john-space-disco/voice-${mode}-wide-${version}-request.json`;
if(await fs.stat(file).catch(()=>null)){console.log('Saved voice reused');process.exit(0);}
if(await fs.stat(record).catch(()=>null))throw Error('Prior request exists: inspect before resubmitting');
const model=speechModelForText(texts[mode],'eleven_flash_v2');
const body={text:toSpeechText(texts[mode],model),model_id:model,voice_settings:{stability:0.40,similarity_boost:0.75,style:0.22,use_speaker_boost:true,speed:1.08}};
await fs.writeFile(record,JSON.stringify({status:'submitting',voice:'Jessica - Playful, Bright, Warm',pronunciationDirection:ENVITEFY_PRONUNCIATION_NOTE,body},null,2));
const r=await fetch('https://api.elevenlabs.io/v1/text-to-speech/cgSgspJ2msm6clMCkdW9/with-timestamps?output_format=mp3_44100_128',{method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
if(!r.ok){await fs.writeFile(record,JSON.stringify({status:'failed',httpStatus:r.status}));throw Error(`TTS HTTP ${r.status}`);}
const result=await r.json();await fs.writeFile(file,Buffer.from(result.audio_base64,'base64'));await fs.writeFile(`projects/john-space-disco/voice-${mode}-wide-${version}-alignment.json`,JSON.stringify(result.normalized_alignment||result.alignment,null,2));await fs.writeFile(record,JSON.stringify({status:'completed',voice:'Jessica',pronunciationDirection:ENVITEFY_PRONUNCIATION_NOTE,body},null,2));console.log(`Generated ${mode}`);

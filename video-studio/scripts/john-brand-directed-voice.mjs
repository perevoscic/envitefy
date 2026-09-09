import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import {ENVITEFY_PRONUNCIATION_NOTE} from './brand-pronunciation.mjs';
const inherited={...process.env};dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});Object.assign(process.env,inherited);
const mode=process.argv[2]||'create';
if(!['create','update'].includes(mode))throw Error('Invalid narration line');
const version='brand-standard-v1',name='vo-'+mode+'-'+version;
const file='public/projects/john-space-disco/'+name+'.wav',record='projects/john-space-disco/'+name+'-request.json';
if(await fs.stat(file).catch(()=>null)){console.log('Reusing generated stock voice');process.exit(0);}
if(await fs.stat(record).catch(()=>null))throw Error('Prior request exists; inspect before retrying.');
const line=mode==='create'?'Bring their birthday ideas to life with Envitefy Concierge.':'Change the plans. Your live card updates. No resending needed.';
const prompt='You are a warm, bright, natural adult female narrator in an American English family animation commercial. Speak conversationally with a gentle smile, clear articulation and brisk upbeat timing. No music, no effects, no other voices. '+(mode==='create'?ENVITEFY_PRONUNCIATION_NOTE+' Pronounce exactly three joined syllables: en, VITE, fy. Transition directly from the T consonant to the F consonant with no vowel inserted. The opening vowel is EH, like enter, not IH as in pin. ':'')+'Read only the following line, naturally in about '+(mode==='create'?'3.6':'3.1')+' seconds. Do not read any of these instructions. SCRIPT: '+line;
const body={contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Aoede'}}}}};
const model='gemini-2.5-pro-preview-tts';
await fs.writeFile(record,JSON.stringify({status:'submitting',model,voice:'Aoede',line,body},null,2)+'\n');
const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
if(!response.ok){await fs.writeFile(record,JSON.stringify({status:'failed',model,voice:'Aoede',line,body,httpStatus:response.status},null,2));throw Error('TTS HTTP '+response.status);}
const result=await response.json(),data=result.candidates?.[0]?.content?.parts?.find(p=>p.inlineData)?.inlineData;
if(!data)throw Error('No generated audio');
const pcm=Buffer.from(data.data,'base64'),rate=Number(data.mimeType.match(/rate=(\d+)/)?.[1]||24000);
const head=Buffer.alloc(44);head.write('RIFF',0);head.writeUInt32LE(36+pcm.length,4);head.write('WAVEfmt ',8);head.writeUInt32LE(16,16);head.writeUInt16LE(1,20);head.writeUInt16LE(1,22);head.writeUInt32LE(rate,24);head.writeUInt32LE(rate*2,28);head.writeUInt16LE(2,32);head.writeUInt16LE(16,34);head.write('data',36);head.writeUInt32LE(pcm.length,40);
await fs.writeFile(file,Buffer.concat([head,pcm]));
await fs.writeFile(record,JSON.stringify({status:'completed',model,voice:'Aoede',line,body,mimeType:data.mimeType,durationSeconds:pcm.length/(rate*2)},null,2)+'\n');
console.log(JSON.stringify({file,voice:'Aoede',duration:pcm.length/(rate*2)}));

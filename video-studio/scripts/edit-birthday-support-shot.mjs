import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
const inherited={...process.env};dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});Object.assign(process.env,inherited);
const project='projects/birthday-support',out='public/projects/birthday-support';
const api='https://generativelanguage.googleapis.com/v1beta';
const headers={'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json','Api-Revision':'2026-05-20'};
async function read(file){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function request(url,options={}){const r=await fetch(url,{...options,signal:AbortSignal.timeout(60000)});const d=await r.json();if(!r.ok)throw new Error('Provider HTTP '+r.status+': '+JSON.stringify(d).slice(0,800));return d;}
const prompts={
  "chaos-clean": "Edit this supplied 10-second video ONLY to fix the repeated Please hold sentence. Preserve the EXACT same mother identity, mustard yellow sweatshirt, kitchen, balloons, all camera shots, same audio voices and movement. At 0-3 seconds keep three offscreen caller questions: What time? What's the address? Did you count us? At 3.6-6.5 seconds the mother says EXACTLY ONCE in a slow exhausted deadpan: Birthday support. Please hold. There are exactly FIVE words in her line: Birthday / support / Please / hold (four words). Do not repeat Please hold. Her lips stay closed after the single line. Around 6.5-7 seconds she gives a tired silent stare. At 7-8.3 seconds she removes the headset and places it on the counter, then at 8.3-10 seconds she picks up her phone and taps it with a small relieved smile. Native clean synchronized natural American English dialogue. Remove repeated words rather than adding extra speech. Maintain full 10-second duration and vertical 9:16 composition. Output ONLY the corrected shot, do not append or prepend input footage. No captions, logos, music or text."
};
async function work(mode){
 if(!prompts[mode])throw new Error('Invalid edit');
 const file=path.join(out,mode+'.mp4');if(await fs.stat(file).catch(()=>null)){console.log(mode+': saved');return;}
 const job=path.join(project,mode+'-job.json');let state=await read(job);
 if(!state){
  const source=mode==='chaos-clean'?path.join(out,'chaos.mp4'):path.join(project,'payoff-edit-source.mp4');
  const body={model:'gemini-omni-1.1-flash',input:[{type:'user_input',content:[{type:'video',mime_type:'video/mp4',data:(await fs.readFile(source)).toString('base64')},{type:'text',text:prompts[mode]}]}],background:true,store:true,response_format:{type:'video',aspect_ratio:'9:16',resolution:'720p',delivery:'uri'}};
  await fs.writeFile(path.join(project,mode+'-request.json'),JSON.stringify({source,prompt:prompts[mode],model:body.model},null,2));
  await fs.writeFile(job,JSON.stringify({status:'submitting'},null,2));
  state=await request(api+'/interactions',{method:'POST',headers,body:JSON.stringify(body)});await fs.writeFile(job,JSON.stringify(state,null,2));
 }
 if(!state.id)throw new Error('Ambiguous submission: inspect job, do not resubmit');
 if(state.status!=='completed'){state=await request(api+'/interactions/'+encodeURIComponent(state.id),{headers});await fs.writeFile(job,JSON.stringify(state,null,2));}
 console.log(mode+': '+state.status);if(state.status==='failed')throw new Error(JSON.stringify(state.error).slice(0,800));if(state.status!=='completed')return;
 const content=state.steps?.filter(s=>s.type==='model_output').flatMap(s=>s.content||[])||[];
 const media=content.findLast(c=>c.type==='video')||state.output_video;
 if(media.data)await fs.writeFile(file,Buffer.from(media.data,'base64'));
 else{
  const id=media.uri?.match(/files\/([A-Za-z0-9_-]+)/)?.[1];if(!id)throw new Error('Missing video output');
  const info=await request(api+'/files/'+id,{headers});const status=typeof info.state==='string'?info.state:info.state?.name;
  if(status!=='ACTIVE'){console.log(mode+': file '+status);return;}
  let url=api+'/files/'+id+':download?alt=media';let r;
  for(let i=0;i<5;i++){const host=new URL(url).hostname,google=host==='generativelanguage.googleapis.com';if(!google&&!host.endsWith('.googleusercontent.com')&&!host.endsWith('.googleapis.com'))throw new Error('Unexpected host');r=await fetch(url,{headers:google?{'x-goog-api-key':process.env.GEMINI_API_KEY}:{},redirect:'manual',signal:AbortSignal.timeout(60000)});if(r.status>=300&&r.status<400){url=new URL(r.headers.get('location'),url).href;continue;}break;}
  if(!r.ok)throw new Error('Download HTTP '+r.status);await fs.writeFile(file,Buffer.from(await r.arrayBuffer()));
 }
 console.log(mode+': downloaded');
}
for(const result of await Promise.allSettled(process.argv.slice(2).map(work)))if(result.status==='rejected'){console.error(result.reason.message);process.exitCode=1;}



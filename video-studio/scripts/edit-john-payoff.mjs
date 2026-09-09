import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
const inherited={...process.env};dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});Object.assign(process.env,inherited);
const project='projects/john-space-disco',out='public/projects/john-space-disco';
const api='https://generativelanguage.googleapis.com/v1beta';
const headers={'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json','Api-Revision':'2026-05-20'};
async function read(file){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function request(url,options={}){const r=await fetch(url,{...options,signal:AbortSignal.timeout(60000)});const d=await r.json();if(!r.ok)throw new Error('Provider HTTP '+r.status+': '+JSON.stringify(d).slice(0,800));return d;}
const prompts={"payoff-fixed-v3":"Edit this supplied FOUR-SECOND 9:16 premium 3D cartoon video ONLY to fix the characters changing screen positions midway. Lock the composition to the FIRST FRAME: friendly mint-teal dinosaur stays on SCREEN LEFT for all four seconds; John stays on SCREEN RIGHT for all four seconds. They never switch sides, cross each other, teleport, morph, or change identity. Remove the later reverse-position camera cut. Keep one continuous stable camera angle matching the beginning, same cosmic bedroom, rug, stars, planets, spinning disco ball, warm blue-violet light, exact boy face/hair/blue shirt/orange shorts and exact dinosaur with tiny violet birthday hat. Preserve the first two seconds as closely as possible, including John's existing mouth motion and native voice timing. John says exactly once: 'That's MY kind of birthday!' from approximately 0.25 to 2.05 seconds. Preserve this complete natural child dialogue without changing words. After his line John remains on the RIGHT, smiles at the dinosaur and gently bounces in place with lips closed. The dinosaur remains on the LEFT doing an amusing very serious little disco shoulder shimmy and pointing a tiny arm up. Keep their feet planted on their own side, only local dance motion. Stable anatomy, no swapped identities or positions at 2–4 seconds. Preserve overall full-body framing and character scale. Output only the corrected four-second video, with no input prefix, append, extra shot, text, logo, caption, overlay, or border. Do not change anything outside the requested continuity fix."};
async function work(mode){
 if(!prompts[mode])throw new Error('Invalid edit');
 const file=path.join(out,mode+'.mp4');if(await fs.stat(file).catch(()=>null)){console.log(mode+': saved');return;}
 const job=path.join(project,mode+'-job.json');let state=await read(job);
 if(!state){
  const source=path.join('out/john-space-disco','payoff-edit-source-v3.mp4');
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



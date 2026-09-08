import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';
const studio=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const inherited={...process.env};
dotenv.config({path:path.join(studio,'../.env'),quiet:true});
dotenv.config({path:path.join(studio,'../.env.local'),override:true,quiet:true});
Object.assign(process.env,inherited);
const project=path.join(studio,'projects/fridge-freedom');
const out=path.join(studio,'public/projects/fridge-freedom');
await fs.mkdir(out,{recursive:true});
const brief=JSON.parse(await fs.readFile(path.join(project,'brief.json'),'utf8'));
const api='https://generativelanguage.googleapis.com/v1beta';
const headers={'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json','Api-Revision':'2026-05-20'};
async function readJson(file){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function request(url,options={}){const r=await fetch(url,{...options,signal:AbortSignal.timeout(600000)});const data=await r.json();if(!r.ok)throw new Error(`HTTP ${r.status}: ${JSON.stringify(data).slice(0,900)}`);return data;}
async function generate(mode){
 if(!['opening','phone','cleanup','music'].includes(mode))throw new Error('Invalid shot');
 if(!process.env.GEMINI_API_KEY)throw new Error('Missing GEMINI_API_KEY');
 const music=mode==='music';
 const file=path.join(out,`${mode}.${music?'mp3':'mp4'}`);
 if(await fs.stat(file).catch(()=>null)){console.log(`${mode}: saved`);return;}
 const stateFile=path.join(project,`${mode}-job.json`);
 let state=await readJson(stateFile);
 if(!state){
  const body={model:music?'lyria-3-clip-preview':'gemini-omni-1.1-flash',input:music?brief.musicPrompt:brief.shots[mode],store:true};
  if(!music)body.response_format={type:'video',aspect_ratio:'9:16',resolution:'720p',delivery:'uri'};
  if(mode==='phone'||mode==='cleanup'){const prev=await readJson(path.join(project,'opening-job.json'));if(prev?.status!=='completed'){console.log('continuation: waiting for opening reference');return;}body.previous_interaction_id=prev.id;}
  await fs.writeFile(stateFile,JSON.stringify({status:'submitting',body},null,2));
  state=await request(`${api}/interactions`,{method:'POST',headers,body:JSON.stringify(body)});
  await fs.writeFile(stateFile,JSON.stringify(state,null,2));
 }
 if(!state.id)throw new Error(`${mode}: inspect ambiguous submission; do not resubmit`);
 if(state.status!=='completed'){state=await request(`${api}/interactions/${encodeURIComponent(state.id)}`,{headers});await fs.writeFile(stateFile,JSON.stringify(state,null,2));}
 console.log(`${mode}: ${state.status}`);
 if(state.status==='failed')throw new Error(JSON.stringify(state.error||state).slice(0,900));
 if(state.status!=='completed')return;
 const content=state.steps?.filter(s=>s.type==='model_output').flatMap(s=>s.content||[])||[];
 const media=content.findLast(c=>c.type===(music?'audio':'video'))||(music?state.output_audio:state.output_video);
 if(!media)throw new Error('No output media');
 if(media.data){await fs.writeFile(file,Buffer.from(media.data,'base64'));}
 else if(media.uri){
  const fileId=media.uri.match(/files\/([A-Za-z0-9_-]+)/)?.[1];if(!fileId)throw new Error('Expected provider file URI');
  const info=await request(`${api}/files/${fileId}`,{headers});const status=typeof info.state==='string'?info.state:info.state?.name;
  if(status!=='ACTIVE'){console.log(`${mode}: file ${status}`);return;}
  let url=`${api}/files/${fileId}:download?alt=media`;let response;
  for(let n=0;n<5;n++){const host=new URL(url).hostname;const provider=host==='generativelanguage.googleapis.com';if(!provider&&!host.endsWith('.googleusercontent.com')&&!host.endsWith('.googleapis.com'))throw new Error('Unexpected host');response=await fetch(url,{headers:provider?{'x-goog-api-key':process.env.GEMINI_API_KEY}:{},redirect:'manual',signal:AbortSignal.timeout(600000)});if(response.status>=300&&response.status<400){url=new URL(response.headers.get('location'),url).href;continue;}break;}
  if(!response.ok)throw new Error(`Download HTTP ${response.status}`);await fs.writeFile(file,Buffer.from(await response.arrayBuffer()));
 }else throw new Error('No media data');
 console.log(`${mode}: downloaded`);
}
// Independent scenes can run together; payoff waits for its saved reference.
const results=await Promise.allSettled(process.argv.slice(2).map(generate));
for(const result of results)if(result.status==='rejected'){console.error(result.reason.message);process.exitCode=1;}







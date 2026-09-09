import fs from 'node:fs/promises';
import dotenv from 'dotenv';

const inherited = {...process.env};
dotenv.config({path:'../.env', quiet:true});
dotenv.config({path:'../.env.local', override:true, quiet:true});
Object.assign(process.env, inherited);
const project = 'projects/mom-just-snap-it/';
const assets = 'public/projects/mom-just-snap-it/';
const api = 'https://generativelanguage.googleapis.com/v1beta';
const headers = {'x-goog-api-key':process.env.GEMINI_API_KEY, 'Content-Type':'application/json', 'Api-Revision':'2026-05-20'};
const prompt = "Edit the previously generated TEN SECOND anime digital-event demonstration video. Keep the exact original character faces, hair, skin tones, animation, hand movement, dark phone, background, framing, shot timing, native dialogue and lip sync. Make one wardrobe correction only: mother wears her solid teal knit top and an ivory WAIST APRON below her waist. Remove the ivory apron BIB and shoulder/neck straps throughout, revealing teal fabric on her chest and shoulders. Keep the waist apron. Do not change or add speech, redo the scene, change its duration, introduce text, or change anything else. Preserve the original 10 seconds and all original camera angles.";

async function read(file) { return fs.readFile(file,'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT') return null; throw e;}); }
async function request(url, options={}) {
  const r=await fetch(url,{...options,signal:AbortSignal.timeout(600000)});
  const j=await r.json();
  if(!r.ok) throw Error(`Provider HTTP ${r.status}: ${JSON.stringify(j).slice(0,500)}`);
  return j;
}
const name='digital-v3';
const dest=assets+name+'.mp4';
if(await fs.stat(dest).catch(()=>null)) {console.log('Digital V3 already downloaded.');process.exit(0);}
if(!process.env.GEMINI_API_KEY) throw Error('Missing configured video provider credential');
let state=await read(project+name+'-job.json');
if(!state) {
  const previous=await read(project+'digital-job.json');
  if(!previous?.id) throw Error('Missing original provider lineage; no new upload attempted');
  const body={model:'gemini-omni-1.1-flash',previous_interaction_id:previous.id,input:prompt,store:true,response_format:{type:'video',aspect_ratio:'16:9',resolution:'1080p',delivery:'uri'}};
  await fs.writeFile(project+name+'-request.json',JSON.stringify({model:body.model,source:'Existing provider-hosted original digital scene; text-only correction; no local artwork or audio uploads',prompt,response_format:body.response_format},null,2));
  await fs.writeFile(project+name+'-job.json',JSON.stringify({status:'submitting',at:new Date().toISOString()},null,2));
  try {state=await request(api+'/interactions',{method:'POST',headers,body:JSON.stringify(body)});await fs.writeFile(project+name+'-job.json',JSON.stringify(state,null,2));}
  catch(error) {await fs.writeFile(project+name+'-submission-error.json',JSON.stringify({message:error.message,at:new Date().toISOString()},null,2));throw error;}
}
if(state.id&&state.status!=='completed') {state=await request(api+'/interactions/'+encodeURIComponent(state.id),{headers});await fs.writeFile(project+name+'-job.json',JSON.stringify(state,null,2));}
console.log('Digital V3: '+state.status);
if(state.status==='failed') throw Error('Opening revision failed');
if(!state.id&&state.status!=='completed') throw Error('Ambiguous submission; do not resubmit');
const media=state.steps?.filter(s=>s.type==='model_output').flatMap(s=>s.content||[]).findLast(c=>c.type==='video');
if(!media) process.exit(0);
if(media.data) await fs.writeFile(dest,Buffer.from(media.data,'base64'));
else {
  const id=media.uri?.match(/files\/([A-Za-z0-9_-]+)/)?.[1];
  if(!id) throw Error('No provider media id');
  const info=await request(api+'/files/'+id,{headers});
  const active=typeof info.state==='string'?info.state:info.state?.name;
  if(active!=='ACTIVE') {console.log('Provider media: '+active);process.exit(0);}
  let url=api+'/files/'+id+':download?alt=media',response;
  for(let n=0;n<5;n++) {
    const host=new URL(url).hostname,provider=host==='generativelanguage.googleapis.com';
    if(!provider&&!host.endsWith('.googleusercontent.com')&&!host.endsWith('.googleapis.com'))throw Error('Unexpected download host');
    response=await fetch(url,{headers:provider?{'x-goog-api-key':process.env.GEMINI_API_KEY}:{},redirect:'manual',signal:AbortSignal.timeout(600000)});
    if(response.status>=300&&response.status<400){url=new URL(response.headers.get('location'),url).href;continue;}break;
  }
  if(!response?.ok)throw Error('Download failed');
  await fs.writeFile(dest,Buffer.from(await response.arrayBuffer()));
}
console.log('Digital V3 downloaded for local review.');

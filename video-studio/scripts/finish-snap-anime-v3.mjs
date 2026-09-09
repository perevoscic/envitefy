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
const prompt = `Revise this previously generated opening anime video, retaining the SAME scene, continuous camera, character positions, girl handoff, all original timing and the original invitation paper motion. Maintain exact original duration. This is a correction of the existing film, not a new story or an extension. Make these precise fixes:
1. Match the polished painterly premium anime treatment throughout. Mother has warm medium-brown skin, chestnut shoulder-length WAVY hair, a solid teal knit long-sleeve top and a cream WAIST APRON tied at her waist. No apron bib or shoulder straps. Girl has high brown ponytail, coral cardigan, white shirt, navy skirt, lavender backpack. Keep stable natural medium golden exposure and rich colors, no pale washed-out skin. Same kitchen.
2. Preserve girl's single opening line 'Mom! Can I go?' at 0–1.8 seconds. After that mother makes NO words or speaking mouth movements. She may have a brief wide-eyed surprised open mouth at the paper avalanche, a tiny nonverbal gasp, then closed-mouth affectionate embarrassed smile. No other dialogue, no music.
3. The ONE green round magnet is a solid magnet attached to refrigerator METAL. Mom moves it onto a bare metal spot ABOVE the papers and releases it there. It STAYS firmly fixed there afterward. Only PAPER sheets flutter downward. The magnet never flies, moves with papers, floats, or sticks to the invitation after release. Her fingers visibly touch the magnet while moving it.
4. Birthday invitation keeps its coral-and-aqua balloon frame. Its cream center contains neatly printed ink lines for an invitation. Clearly print exactly: Mia's 8th Birthday; SAT OCT 17, 2026; 2–4 PM; MAPLE PARK; 820 W 7th Street; Austin, TX. Keep lettering attached to the paper plane, preserve hands in front. No captions, logos, watermark or interface graphics. The rainbow family drawing remains high on the fridge under ONE RED magnet.
Keep both complete faces, paper, hands and refrigerator action clustered in the central 45 percent of 1920x1080 landscape frame for the shared portrait reframe. Maintain smooth real character acting, paper physics, original motion continuity. Do not replay a reference still, freeze, add extra hands, restage the scene or introduce extra cuts.`;

async function read(file) { return fs.readFile(file,'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT') return null; throw e;}); }
async function request(url, options={}) {
  const r=await fetch(url,{...options,signal:AbortSignal.timeout(600000)});
  const j=await r.json();
  if(!r.ok) throw Error(`Provider HTTP ${r.status}: ${JSON.stringify(j).slice(0,500)}`);
  return j;
}
const name='opening-v3';
const dest=assets+name+'.mp4';
if(await fs.stat(dest).catch(()=>null)) {console.log('Opening V3 already downloaded.');process.exit(0);}
if(!process.env.GEMINI_API_KEY) throw Error('Missing configured video provider credential');
let state=await read(project+name+'-job.json');
if(!state) {
  const previous=await read(project+'opening-job.json');
  if(!previous?.id) throw Error('Missing original provider lineage; no new upload attempted');
  const body={model:'gemini-omni-1.1-flash',previous_interaction_id:previous.id,input:prompt,store:true,response_format:{type:'video',aspect_ratio:'16:9',resolution:'1080p',delivery:'uri'}};
  await fs.writeFile(project+name+'-request.json',JSON.stringify({model:body.model,source:'Existing provider-hosted original opening; text-only correction; no local artwork or audio uploads',prompt,response_format:body.response_format},null,2));
  await fs.writeFile(project+name+'-job.json',JSON.stringify({status:'submitting',at:new Date().toISOString()},null,2));
  try {state=await request(api+'/interactions',{method:'POST',headers,body:JSON.stringify(body)});await fs.writeFile(project+name+'-job.json',JSON.stringify(state,null,2));}
  catch(error) {await fs.writeFile(project+name+'-submission-error.json',JSON.stringify({message:error.message,at:new Date().toISOString()},null,2));throw error;}
}
if(state.id&&state.status!=='completed') {state=await request(api+'/interactions/'+encodeURIComponent(state.id),{headers});await fs.writeFile(project+name+'-job.json',JSON.stringify(state,null,2));}
console.log('Opening V3: '+state.status);
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
console.log('Opening V3 downloaded for local review.');

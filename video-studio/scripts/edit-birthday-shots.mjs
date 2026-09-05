import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
const inherited={...process.env};dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});Object.assign(process.env,inherited);
const project='projects/birthday-second-job',out='public/projects/birthday-second-job';
const api='https://generativelanguage.googleapis.com/v1beta';
const headers={'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json','Api-Revision':'2026-05-20'};
async function read(file){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function request(url,options={}){const r=await fetch(url,{...options,signal:AbortSignal.timeout(60000)});const d=await r.json();if(!r.ok)throw new Error('Provider HTTP '+r.status+': '+JSON.stringify(d).slice(0,800));return d;}
const prompts={
'chaos-wide':"Edit this supplied 10-second video. Replace its camera framing with one continuous locked-off medium-wide waist-up shot of the SAME dad behind the SAME kitchen table. Preserve his identity exactly, rust-orange tee, dinosaur decorations, lighting, phone, streamers, original story and 10-second duration. Keep the entire head and torso and working hands visible with comfortable headroom; no cuts, zooms, closeups or camera pushes. [0-3.9 seconds] Dad struggles with decorations and receives phone buzzes. [3.9-7.5] Dad looks directly into the lens and clearly says in the same natural voice, verbatim: 'It's a birthday party, not a second job.' [7.5-10] Dad looks down, smiles, taps phone with free hand. Preserve natural synchronized dialogue and ambience with identical speech timing where possible. This is a camera correction of the existing performance. Output ONLY the revised 10-second shot, do not prepend or append the reference. Full vertical 9:16 moving live action to every edge. Remove all existing subtitles. No captions, text, graphic overlays, music, borders or blank margins. Natural hands and intact props.",
'payoff-wide':"Edit this supplied 10-second video. Fix the two camera jumps: at about 3 seconds before the child speaks, and about 6.4 seconds when it cuts into Dad's face. The ENTIRE revised shot must be ONE continuous stable locked-off medium-wide two-shot in the same kitchen, same dad and daughter identities, same clothing, same lighting, same table and cup. Keep both heads, torsos and working hands visible throughout; no zooms, no closeups, no cuts, no camera or framing changes. [0-2] Dad sits in his chair and relaxes with the mug, relieved sigh. [2-3] Daughter enters naturally from the right and stands next to him. [3-5.7] Daughter says exactly, in her same natural voice: 'Actually, I want a different theme.' [5.7-10] Dad slowly looks directly at the lens with a dry deadpan stare, then lifts the mug and gives a small resigned half-smile while daughter stays beside him. Preserve clear synchronized dialogue, exact words, the original scene's sound and natural timing. The child is the ONLY speaker. Normal real-time motion, realistic fingers and stable props. Output ONLY this revised 10-second shot, do not prepend/append the reference. Full vertical 9:16. No text, subtitles, overlays, music, white borders or blank margins."
};
async function work(mode){
 if(!prompts[mode])throw new Error('Invalid edit');
 const file=path.join(out,mode+'.mp4');if(await fs.stat(file).catch(()=>null)){console.log(mode+': saved');return;}
 const job=path.join(project,mode+'-job.json');let state=await read(job);
 if(!state){
  const source=mode==='chaos-wide'?path.join(out,'chaos.mp4'):path.join(project,'payoff-edit-source.mp4');
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


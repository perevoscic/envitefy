import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const studio = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(studio, '..');
const inherited = {...process.env};
dotenv.config({path:path.join(root,'.env'),quiet:true});
dotenv.config({path:path.join(root,'.env.local'),override:true,quiet:true});
Object.assign(process.env,inherited);
const project = path.join(studio,'projects/host-mode');
const out = path.join(studio,'public/projects/host-mode');
await fs.mkdir(out,{recursive:true});
const brief = JSON.parse(await fs.readFile(path.join(project,'brief.json'),'utf8'));
const mode = process.argv[2];
const api = 'https://generativelanguage.googleapis.com/v1beta';
const googleHeaders = {'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json','Api-Revision':'2026-05-20'};
async function readJson(file) {try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function jsonRequest(url,options={}) {
  const response = await fetch(url,{...options,signal:AbortSignal.timeout(60000)});
  const data = await response.json();
  if(!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(data).slice(0,1500)}`);
  return data;
}
if(mode==='lyria') {
  if(!process.env.GEMINI_API_KEY)throw new Error('Missing GEMINI_API_KEY');
  const stateFile=path.join(project,'lyria-job.json');
  let state=await readJson(stateFile);
  if(!state){
    const body={model:'lyria-3-clip-preview',input:'Original instrumental funky house / indie dance groove, 120 BPM in A minor, playful, confident, warm and genuinely cool for a social TikTok about hosting a dinner party. Start IMMEDIATELY with the full groove on beat one: a warm syncopated real electric bass, punchy dry kick, crisp clap, swinging shaker and hi hats, rhythmic muted funk guitar, rich Rhodes piano chords, tiny bright ear-candy fills. Simple memorable riff, infectious head nodding rhythm, natural musician performance, modern full polished mix with clear low end and bright stereo percussion. Sustain the groove throughout 30 seconds with subtle playful variations every four bars. No buildup or ambient intro. Entirely instrumental. Absolutely no vocals, vocal chops, singing, humming, speech or lyrics. No ukulele, corporate stock music, chiptune or artist imitation.',background:true,store:true};
    await fs.writeFile(stateFile,JSON.stringify({status:'submitting',body},null,2));
    state=await jsonRequest(`${api}/interactions`,{method:'POST',headers:googleHeaders,body:JSON.stringify(body)});
    await fs.writeFile(stateFile,JSON.stringify(state,null,2));
  }
  if(!state.id)throw new Error('Inspect music submission state before another paid call.');
  if(state.status!=='completed'){
    state=await jsonRequest(`${api}/interactions/${encodeURIComponent(state.id)}`,{headers:googleHeaders});
    await fs.writeFile(stateFile,JSON.stringify(state,null,2));
  }
  console.log(`Lyria: ${state.status}`);
  if(state.status!=='completed')process.exit(state.status==='failed'?1:0);
  const contents=state.steps?.filter(s=>s.type==='model_output').flatMap(s=>s.content||[])||[];
  const audio=contents.find(c=>c.type==='audio');
  if(!audio?.data)throw new Error('No audio data in completed music response.');
  await fs.writeFile(path.join(out,'lyria-groove.mp3'),Buffer.from(audio.data,'base64'));
  const notes=contents.filter(c=>c.type==='text').map(c=>c.text).join('\n');
  await fs.writeFile(path.join(project,'music-structure.txt'),notes);
  console.log('Saved original Lyria instrumental.');
}else if(mode==='music') {
  if(!process.env.ELEVENLABS_API_KEY)throw new Error('Missing ELEVENLABS_API_KEY');
  const file=path.join(out,'music.mp3');
  if(await fs.stat(file).catch(()=>null)){console.log('Music already saved.');process.exit(0);}
  const marker=path.join(project,'music-request.json');
  if(await readJson(marker))throw new Error('Music already submitted. Inspect request state before another paid call.');
  const body={prompt:brief.music,music_length_ms:24000,model_id:'music_v1',force_instrumental:true};
  await fs.writeFile(marker,JSON.stringify({status:'submitting',body},null,2));
  const response=await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128',{method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(240000)});
  if(!response.ok){const error=await response.text();await fs.writeFile(marker,JSON.stringify({status:'failed',httpStatus:response.status,error},null,2));throw new Error(`Music HTTP ${response.status}: ${error.slice(0,1200)}`);}
  await fs.writeFile(file,Buffer.from(await response.arrayBuffer()));
  await fs.writeFile(marker,JSON.stringify({status:'completed',songId:response.headers.get('song-id'),body},null,2));
  console.log('Saved original 24-second instrumental.');
} else if(mode==='chaos'||mode==='party'||mode==='party-single-hand'||mode==='bowl-single-hand') {
  if(!process.env.GEMINI_API_KEY)throw new Error('Missing GEMINI_API_KEY');
  const stateFile=path.join(project,`${mode}-job.json`);
  let state=await readJson(stateFile);
  if(!state){
    const body={model:'gemini-omni-1.1-flash',input:brief.shots[mode],background:true,store:true,response_format:{type:'video',aspect_ratio:'9:16',resolution:'720p',delivery:'uri'}};
    if(mode==='bowl-single-hand'){
      const edit=await readJson(path.join(project,'bowl-single-hand-edit.json'));
      const data=(await fs.readFile(path.join(out,edit.sourceVideo))).toString('base64');
      body.input=[{type:'user_input',content:[{type:'video',mime_type:'video/mp4',data},{type:'text',text:edit.prompt}]}];
    }
    if(mode==='party-single-hand'){
      const edit=await readJson(path.join(project,'party-single-hand-edit.json'));
      const previous=await readJson(path.join(project,edit.source));
      if(previous?.status!=='completed')throw new Error('Complete the party clip before editing it.');
      body.input=edit.prompt;
      body.previous_interaction_id=previous.id;
    }
    if(mode==='party'){
      const previous=await readJson(path.join(project,'chaos-job.json'));
      if(previous?.status!=='completed')throw new Error('Complete chaos clip first for character continuity.');
      body.previous_interaction_id=previous.id;
    }
    await fs.writeFile(stateFile,JSON.stringify({status:'submitting',body},null,2));
    state=await jsonRequest(`${api}/interactions`,{method:'POST',headers:googleHeaders,body:JSON.stringify(body)});
    await fs.writeFile(stateFile,JSON.stringify(state,null,2));
    console.log(`${mode}: submitted; status=${state.status}; id=${state.id}`);
  }
  if(!state.id)throw new Error('Submission outcome needs inspection; not resubmitting.');
  if(state.status!=='completed'){
    state=await jsonRequest(`${api}/interactions/${encodeURIComponent(state.id)}`,{headers:googleHeaders});
    await fs.writeFile(stateFile,JSON.stringify(state,null,2));
  }
  console.log(`${mode}: ${state.status}`);
  if(state.status!=='completed')process.exit(state.status==='failed'?1:0);
  const file=path.join(out,`${mode}.mp4`);
  if(await fs.stat(file).catch(()=>null)){console.log('Video already saved.');process.exit(0);}
  const video=state.steps?.filter(s=>s.type==='model_output').flatMap(s=>s.content||[]).find(c=>c.type==='video')||state.output_video;
  if(!video)throw new Error('Completed without video output.');
  if(video.data){await fs.writeFile(file,Buffer.from(video.data,'base64'));}
  else if(video.uri){
    const fileId=video.uri.match(/files\/([A-Za-z0-9_-]+)/)?.[1];
    if(!fileId)throw new Error('Expected Google file URI.');
    const info=await jsonRequest(`${api}/files/${fileId}`,{headers:googleHeaders});
    const fileState=typeof info.state==='string'?info.state:info.state?.name;
    if(fileState!=='ACTIVE'){console.log(`Video file processing: ${fileState}. Run again to download.`);process.exit(0);}
    let url=`${api}/files/${fileId}:download?alt=media`;
    let response;
    for(let n=0;n<5;n++){
      const host=new URL(url).hostname;
      const google=host==='generativelanguage.googleapis.com';
      if(!google&&!host.endsWith('.googleusercontent.com')&&!host.endsWith('.googleapis.com'))throw new Error('Unexpected download host');
      response=await fetch(url,{headers:google?{'x-goog-api-key':process.env.GEMINI_API_KEY}:{},redirect:'manual',signal:AbortSignal.timeout(60000)});
      if(response.status>=300&&response.status<400){url=new URL(response.headers.get('location'),url).href;continue;}
      break;
    }
    if(!response.ok)throw new Error(`Download HTTP ${response.status}`);
    await fs.writeFile(file,Buffer.from(await response.arrayBuffer()));
  }else throw new Error('No downloadable video.');
  console.log(`Saved ${mode}.mp4`);
}else throw new Error('Choose chaos, party, party-single-hand, lyria or music. Each video invocation submits once or checks the existing job.');

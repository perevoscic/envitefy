import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
const inherited={...process.env};
dotenv.config({path:'../.env',quiet:true});
dotenv.config({path:'../.env.local',override:true,quiet:true});
Object.assign(process.env,inherited);
const project='projects/john-space-disco',out='public/projects/john-space-disco';
const api='https://generativelanguage.googleapis.com/v1beta';
const headers={'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json','Api-Revision':'2026-05-20'};
const edits={
  hook:{source:out+'/hook-wide.mp4',prompt:"Edit this supplied SIX-SECOND 1920x1080 16:9 premium 3D animated cartoon video to correct continuity. Preserve the exact original boy John (brown hair, blue planet T-shirt, orange shorts), mother (brown wavy hair, violet cardigan), friendly teal dinosaur, room, colorful planets, disco ball, animation quality, native child dialogue and timing. Keep the first four seconds as close to the original as possible. For ALL SIX SECONDS the mother must stay visible on SCREEN RIGHT of John, at the same stable size, standing beside him, smiling and reacting; she must not disappear at the end. The dinosaur appears on SCREEN LEFT of John (John's anatomical RIGHT), and remains on SCREEN LEFT for the ENTIRE rest of this shot, dancing a comically very serious disco move. Never move or cut the dinosaur to screen right. Keep John center, dinosaur left, mother right. Remove the later reverse-angle cut, teleport, or character swapping. One continuous camera composition with only a gentle push, no major camera move or widening that loses Mom. Preserve the ordinary bedroom turning into a cosmic disco room as John says exactly the existing line: My birthday needs dinosaurs… in space… with a DISCO! Preserve synchronized original child voice and phrase timing. Once speaking finishes John smiles and bounces slightly while the dinosaur dances and Mom laughs warmly with lips closed. All three remain visible in their own positions through the final frame. No added words. Retain all natural motion; no still images. Remove burned-in subtitles, any generated writing, and logos. Output ONLY the corrected SIX-SECOND video, no input prefix, append, montage, extra shot, border, or on-screen text."},
  create:{source:out+'/wide-edit-create.mp4',prompt:"Edit this supplied SEVEN-SECOND 1920x1080 horizontal 16:9 premium 3D animated cartoon shot. Make ONE precise prop correction: the laptop in front of John and his mother must have its SCREEN FACING THEM, AWAY from the audience. The camera sees the opaque matte lavender outer BACK/COVER of the open laptop lid, with subtle realistic surface shading and a thin hinge at the table. Absolutely no bright blank white screen, glowing rectangle, camera-facing display, visible screen contents, or screen glow on the back. Keep the lid as a consistent solid lavender laptop back for all seven seconds, including the opening and final frame. Mother can rest her hand near the keyboard behind the lid naturally. Preserve exactly the existing boy, mother, friendly dinosaur, their faces, clothes, screen positions, affectionate expressions, hand gestures, cosmic bedroom and desk setting, lighting, framing and shot duration. Preserve the gentle continuous animated acting and camera. Keep the people in the left half, and the clean right side available for the separately composited product demonstration. No new object, hand, finger, face, text, logo, subtitle or dialogue. Do not redesign or reframe this shot. Output ONLY the corrected seven-second video, with no prefix, appended footage, montage or extra shot."}
};
async function read(file){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function request(url,options={}){const r=await fetch(url,{...options,signal:AbortSignal.timeout(60000)});const d=await r.json();if(!r.ok)throw new Error('Provider HTTP '+r.status+': '+JSON.stringify(d).slice(0,800));return d;}
async function work(mode){
  const edit=edits[mode];if(!edit)throw Error('Expected hook or create');
  const name='wide-'+mode+'-fixed-v3',file=path.join(out,name+'.mp4'),job=path.join(project,name+'-job.json');
  if(await fs.stat(file).catch(()=>null)){console.log(mode+': saved');return;}
  let state=await read(job);
  if(!state){
    const body={model:'gemini-omni-1.1-flash',input:[{type:'user_input',content:[{type:'video',mime_type:'video/mp4',data:(await fs.readFile(edit.source)).toString('base64')},{type:'text',text:edit.prompt}]}],background:true,store:true,response_format:{type:'video',aspect_ratio:'16:9',resolution:'1080p',delivery:'uri'}};
    await fs.writeFile(path.join(project,name+'-request.json'),JSON.stringify({...edit,model:body.model},null,2));
    await fs.writeFile(job,JSON.stringify({status:'submitting'},null,2));
    state=await request(api+'/interactions',{method:'POST',headers,body:JSON.stringify(body)});
    await fs.writeFile(job,JSON.stringify(state,null,2));
  }
  if(!state.id)throw Error('Ambiguous submission: inspect saved job; do not resubmit');
  if(state.status!=='completed'){state=await request(api+'/interactions/'+encodeURIComponent(state.id),{headers});await fs.writeFile(job,JSON.stringify(state,null,2));}
  console.log(mode+': '+state.status);
  if(state.status==='failed')throw Error(JSON.stringify(state.error).slice(0,800));
  if(state.status!=='completed')return;
  const content=state.steps?.filter(s=>s.type==='model_output').flatMap(s=>s.content||[])||[];
  const media=content.findLast(c=>c.type==='video')||state.output_video;
  if(media?.data)await fs.writeFile(file,Buffer.from(media.data,'base64'));
  else{
    const id=media?.uri?.match(/files\/([A-Za-z0-9_-]+)/)?.[1];if(!id)throw Error('Missing video output');
    const info=await request(api+'/files/'+id,{headers});const status=typeof info.state==='string'?info.state:info.state?.name;
    if(status!=='ACTIVE'){console.log(mode+': file '+status);return;}
    let url=api+'/files/'+id+':download?alt=media',r;
    for(let i=0;i<5;i++){
      const host=new URL(url).hostname,google=host==='generativelanguage.googleapis.com';
      if(!google&&!host.endsWith('.googleusercontent.com')&&!host.endsWith('.googleapis.com'))throw Error('Unexpected download host');
      r=await fetch(url,{headers:google?{'x-goog-api-key':process.env.GEMINI_API_KEY}:{},redirect:'manual',signal:AbortSignal.timeout(60000)});
      if(r.status>=300&&r.status<400){url=new URL(r.headers.get('location'),url).href;continue;}break;
    }
    if(!r?.ok)throw Error('Download HTTP '+r?.status);
    await fs.writeFile(file,Buffer.from(await r.arrayBuffer()));
  }
  console.log(mode+': downloaded '+file);
}
for(const mode of process.argv.slice(2))await work(mode);

import fs from 'node:fs/promises';import dotenv from 'dotenv';
dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});
const api='https://generativelanguage.googleapis.com/v1beta',project='projects/wedding-200-texts',name='payoff-toast';
const headers={'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json','Api-Revision':'2026-05-20'};
const file=project+'/'+name+'-job.json';
async function req(url,opts={}){const r=await fetch(url,{...opts,signal:AbortSignal.timeout(60000)});const j=await r.json();if(!r.ok)throw new Error('HTTP '+r.status+': '+JSON.stringify(j).slice(0,400));return j;}
let state=await fs.readFile(file,'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
if(!state){
 const prompt='Using this image as a reference for the same two fictional adults, clothes and restaurant, create a NEW six-second vertical 9:16 realistic moving dinner-date video. Start with both smiling warmly and looking at each other, each holding one glass of pale golden wine. They gently clink their two glasses once in the first second. Man then says EXACTLY ONCE with dry natural conversational delivery: Now… the seating chart. Speech begins at 1.0 seconds and finishes by 2.7 seconds. Both stop smiling and slowly lower their glasses to the table over seconds 2.7 to 4.5, then look silently defeated until six seconds. One uninterrupted medium two-shot. Consistent natural faces, hands, two glasses and physical object contact. Keep the shot completely clean with no captions or lettering anywhere. Quiet restaurant ambience, a gentle clink and the mans native lip-synced dialogue only. No music, narrator, additional speech or repeated sentence. Camera does not move. Same frame composition, no zoom. Begin directly in the new moment; do not reconstruct any earlier footage.';
 const body={model:'gemini-omni-1.1-flash',input:[{type:'user_input',content:[{type:'image',mime_type:'image/png',data:(await fs.readFile(project+'/toast-reference.png')).toString('base64')},{type:'text',text:prompt}]}],background:true,store:true,response_format:{type:'video',aspect_ratio:'9:16',resolution:'720p',delivery:'uri'}};
 await fs.writeFile(file,JSON.stringify({status:'submitting'},null,2));await fs.writeFile(project+'/'+name+'-request.json',JSON.stringify({prompt,source:'toast-reference.png'},null,2));
 state=await req(api+'/interactions',{method:'POST',headers,body:JSON.stringify(body)});await fs.writeFile(file,JSON.stringify(state,null,2));
}
if(!state.id)throw new Error('Ambiguous submission; inspect saved state');
if(state.status!=='completed'){state=await req(api+'/interactions/'+encodeURIComponent(state.id),{headers});await fs.writeFile(file,JSON.stringify(state,null,2));}
console.log(name+': '+state.status);

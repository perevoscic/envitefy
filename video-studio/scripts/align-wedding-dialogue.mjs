import fs from 'node:fs/promises';import dotenv from 'dotenv';
dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});
const name=process.argv[2]||'opening';
const file=`projects/wedding-200-texts/${name}-alignment.json`;
if(await fs.stat(file).catch(()=>null)){console.log(await fs.readFile(file,'utf8'));process.exit(0);}
const form=new FormData();form.set('file',new Blob([await fs.readFile(`projects/wedding-200-texts/${name}-audio.mp3`)],{type:'audio/mpeg'}),name+'.mp3');
form.set('text',name==='opening'?"We said I do, not I'll answer two hundred texts.":'Now, the seating chart.');
const response=await fetch('https://api.elevenlabs.io/v1/forced-alignment',{method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY},body:form,signal:AbortSignal.timeout(60000)});
if(!response.ok)throw new Error('Alignment HTTP '+response.status+': '+(await response.text()).slice(0,300));
const result=await response.json();await fs.writeFile(file,JSON.stringify(result,null,2));console.log(result.words);

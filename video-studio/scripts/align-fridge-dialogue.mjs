import fs from 'node:fs/promises';import dotenv from 'dotenv';
dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});
const file='projects/fridge-freedom/dialogue-alignment.json';
if(await fs.stat(file).catch(()=>null)){console.log(JSON.parse(await fs.readFile(file,'utf8')).words);process.exit(0);}
const form=new FormData();form.set('file',new Blob([await fs.readFile('out/fridge-freedom/opening-audio.mp3')],{type:'audio/mpeg'}),'opening.mp3');form.set('text','Can I go? There has to be a better way.');
const response=await fetch('https://api.elevenlabs.io/v1/forced-alignment',{method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY},body:form,signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('Alignment HTTP '+response.status);const result=await response.json();await fs.writeFile(file,JSON.stringify(result,null,2));console.log(result.words);

import fs from 'node:fs/promises';import dotenv from 'dotenv';
dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});
for(const name of process.argv.slice(2)){
 const b=await fs.readFile(`projects/wedding-200-texts/${name}-audio.mp3`);
 const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts:[{inlineData:{mimeType:'audio/mpeg',data:b.toString('base64')}},{text:'Listen carefully to this audio alone. Transcribe every audible word VERBATIM with start/end timestamps in seconds to nearest 0.1, preferably word by word. Do not infer words from any script. Also identify phone vibration and glass clink times. JSON only.'}]}],generationConfig:{temperature:0}}),signal:AbortSignal.timeout(60000)});
 if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();const t=j.candidates[0].content.parts.map(p=>p.text||'').join('\n');await fs.writeFile(`projects/wedding-200-texts/${name}-audio-review.json`,t);console.log(name,t);
}

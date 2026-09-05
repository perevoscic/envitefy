import fs from 'node:fs/promises';
import dotenv from 'dotenv';
dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});
for(const name of process.argv.slice(2)){
 const data=await fs.readFile(`public/projects/birthday-support/${name}.mp4`);
 const prompt='Review this video precisely. Transcribe EVERY audible spoken word verbatim with approximate start/end seconds. Do not substitute what you think was intended. Describe each camera cut with times. Flag visible garbled text, white borders, malformed hands, identity inconsistencies. Does speech sound natural and intelligible? Return concise JSON with dialogue, cuts, issues, audioQuality. No markdown.';
 const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`,{method:'POST',headers:{'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{inlineData:{mimeType:'video/mp4',data:data.toString('base64')}},{text:prompt}]}],generationConfig:{temperature:0.1}}),signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw new Error(`Review HTTP ${response.status}`);
 const result=await response.json();const text=result.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('\n');
 await fs.writeFile(`projects/birthday-support/${name}-media-review.json`,text);console.log(name,text);
}



import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';import sharp from 'sharp';
const file='src/mom-just-snap-it/SnapAnime.tsx';let s=await fs.readFile(file,'utf8');
let a=s.indexOf('function CalendarView'),b=s.indexOf('function Extraction');let part=s.slice(a,b);
part=part.replace('padding: "38px 32px"','padding: "25px 25px"').replace('paddingBottom: 30','paddingBottom: 20').replace('fontSize: 51','fontSize: 45').replace('marginTop: 38','marginTop: 28').replace('marginTop: 30','marginTop: 20').replace('marginTop: 40','marginTop: 28').replace('padding: "25px 22px"','padding: "19px 20px"').replace('fontSize: 37','fontSize: 33').replace('fontSize: 29, lineHeight: 1.7, marginTop: saved ? 22 : 0','fontSize: 25, lineHeight: 1.4, marginTop: saved ? 15 : 0').replace('marginTop: 35, fontSize: 27','marginTop: 20, fontSize: 23');s=s.slice(0,a)+part+s.slice(b);
s=s.replace('crop={v ? 225 : 115}','crop={v ? 355 : 240}').replace('y={phoneH * 0.78}','y={v ? 650 : 560}').replace('height: 990','height: 940');
s=s.replace('A + `ui-${name}.png`','`${A}ui-${name}.png`').replaceAll('A + "flyer.webp"','`${A}flyer.webp`').replace('A + "final-mix.wav"','`${A}final-mix.wav`');await fs.writeFile(file,s);
const out='out/mom-just-snap-it';const input='public/projects/mom-just-snap-it/camera-edit.mp4';const times=[0,.5,1,1.2,1.5,2,2.5];let imgs=[];
for(let i=0;i<times.length;i++){const p=out+`/camera-track-${i}.jpg`;spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-ss',String(times[i]),'-i',input,'-frames:v','1','-vf','scale=768:-1',p]);imgs.push({input:p,left:(i%3)*768,top:Math.floor(i/3)*432});}
await sharp({create:{width:2304,height:1296,channels:3,background:'#eee'}}).composite(imgs).jpeg({quality:86}).toFile(out+'/camera-track-contact.jpg');

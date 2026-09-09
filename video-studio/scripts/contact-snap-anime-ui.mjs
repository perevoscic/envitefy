import sharp from 'sharp';import fs from 'node:fs/promises';
const p='public/projects/mom-just-snap-it',out='out/mom-just-snap-it';const names=['snap','event','details','directions','rsvp','calendar','share-before','share'];
const items=await Promise.all(names.map(async(n,i)=>({input:await sharp(`${p}/ui-${n}.png`).resize(300).toBuffer(),left:(i%4)*300,top:Math.floor(i/4)*468})));
await sharp({create:{width:1200,height:936,channels:3,background:'white'}}).composite(items).jpeg({quality:86}).toFile(out+'/ui-contact.jpg');

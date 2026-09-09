import fs from 'node:fs/promises';import sharp from '../../node_modules/sharp/lib/index.js';
const names=['chat','card','details','share','rsvp','confirmed','calendar','directions'];
const tiles=await Promise.all(names.map(async(n,i)=>({input:await sharp('public/projects/small-shower/demo-'+n+'.png').resize(323,600).jpeg({quality:78}).toBuffer(),left:(i%4)*323,top:Math.floor(i/4)*600})));
await sharp({create:{width:1292,height:1200,channels:3,background:'#ffffff'}}).composite(tiles).jpeg({quality:80}).toFile('out/small-shower/ui-contact.jpg');

import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
const p='projects/john-space-disco',out='out/john-space-disco';
await build({entryPoints:[p+'/demo.jsx'],outfile:out+'/fixture.js',bundle:true,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env':'{}','process.env.NODE_ENV':'"production"'},alias:{'@':path.resolve('../src'),'react':path.resolve('node_modules/react'),'react-dom':path.resolve('node_modules/react-dom'),'next/navigation':path.resolve(p+'/navigation.jsx'),'next/image':path.resolve(p+'/image.jsx')},loader:{'.css':'local-css'},logLevel:'warning'});
const html=await (await fetch('http://localhost:3000/envitefy-concierge')).text();
const css=[...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map(m=>m[0]).join('');
if(!css)throw Error('No application CSS');
const data=JSON.parse(await fs.readFile(p+'/demo-data.json','utf8'));
data.invitationData.artworkTextMode='headline_only';
await fs.writeFile(out+'/fixture.html',`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/>${css}<link rel="stylesheet" href="/__john.css"/><style>body{margin:0;font-family:Arial,sans-serif}*{box-sizing:border-box}nextjs-portal{display:none!important}</style></head><body><div id="root"></div><script>window.__JOHN_DATA__=${JSON.stringify(data)}</script><script src="/__john.js"></script></body></html>`);
console.log('Actual full Concierge and Live Card components bundled.');const cssPaths=[...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map(m=>m[0].match(/href="([^"]+)"/)[1]);
const css=await Promise.all(cssPaths.map(async url=>await (await fetch(new URL(url,'http://localhost:3000'))).text()));await fs.writeFile(out+'/app.css',css.join('\n'));
const doc='<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/john-app.css"><style>body{margin:0;font-family:Arial,sans-serif}</style></head><body><div id="root"></div><script>window.__JOHN_DATA__='+JSON.stringify({draft,invitationData})+'</script><script src="/john-demo.js"></script></body></html>';await fs.writeFile(out+'/demo.html',doc);


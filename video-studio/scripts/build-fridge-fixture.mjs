import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import sharp from '../../node_modules/sharp/lib/index.js';
import {spawnSync} from 'node:child_process';
const p='projects/fridge-freedom',out='out/fridge-freedom',assets='public/projects/fridge-freedom';
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="#fff9ed"/><rect x="28" y="28" width="844" height="1144" rx="30" fill="none" stroke="#dcaa81" stroke-width="3"/>
<g stroke="#b0a18f" stroke-width="3" fill="none"><path d="M150 230Q170 350 120 440"/><path d="M743 250Q695 370 760 460"/><path d="M240 160Q220 270 265 310"/></g><ellipse cx="150" cy="170" rx="80" ry="102" fill="#e99485"/><ellipse cx="743" cy="190" rx="75" ry="98" fill="#70a9a2"/><ellipse cx="245" cy="125" rx="52" ry="69" fill="#edcc7b"/>
<g font-family="Georgia,serif" text-anchor="middle" fill="#3f4c47"><text x="450" y="350" font-size="32" letter-spacing="6">YOU'RE INVITED!</text><text x="450" y="485" font-size="92">Mia's 8th</text><text x="450" y="589" font-size="84">Birthday</text><path d="M235 652H665" stroke="#e99485" stroke-width="4"/><text x="450" y="738" font-size="44">Saturday, October 17</text><text x="450" y="810" font-size="48">2:00 – 4:00 PM</text><text x="450" y="909" font-size="48">Maple Park</text><text x="450" y="962" font-size="31">Austin, TX</text><text x="450" y="1070" font-size="28" fill="#9d6455">Cake, games &amp; birthday fun!</text></g><g fill="#e99485"><circle cx="100" cy="650" r="7"/><circle cx="778" cy="570" r="8"/><circle cx="748" cy="1060" r="6"/></g><g fill="#70a9a2"><circle cx="110" cy="980" r="7"/><circle cx="798" cy="850" r="8"/></g></svg>`;
await fs.writeFile(p+'/flyer.svg',svg);
await sharp(Buffer.from(svg)).png().toFile(out+'/flyer-original.png');
const ff=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',out+'/flyer-original.png','-c:v','libwebp','-quality','85','-compression_level','6',assets+'/flyer.webp'],{encoding:'utf8'});if(ff.status)throw Error(ff.stderr);
const meta=await sharp(assets+'/flyer.webp').metadata();if(meta.format!=='webp'||meta.width!==900||meta.height!==1200)throw Error('WebP verification failed');await sharp(assets+'/flyer.webp').raw().toBuffer();await fs.unlink(out+'/flyer-original.png');
await build({entryPoints:[p+'/demo.jsx'],outfile:out+'/fixture.js',bundle:true,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env':'{}','process.env.NODE_ENV':'"production"'},alias:{'@':path.resolve('../src'),'react':path.resolve('node_modules/react'),'react-dom':path.resolve('node_modules/react-dom')},loader:{'.css':'local-css'},logLevel:'warning'});
const snap=await fs.readFile(p+'/snap-inspect.html','utf8');
const css=[...snap.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map(m=>m[0]).join('');
await fs.writeFile(out+'/fixture.html',`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/>${css}<link rel="stylesheet" href="/__fixture.css"/><style>body{margin:0;font-family:Arial,sans-serif}.serif{font-family:Georgia,serif}button,a{-webkit-tap-highlight-color:transparent}</style></head><body><div id="root"></div><script src="/__fixture.js"></script></body></html>`);
console.log('Real BirthdaySkin and EventGuestActions bundled; flyer WebP verified; temporary PNG removed.');


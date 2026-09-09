import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import sharp from 'sharp';
import {spawnSync} from 'node:child_process';
const p='projects/mom-just-snap-it',out='out/mom-just-snap-it',assets='public/projects/mom-just-snap-it';
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100"><rect width="900" height="1100" rx="30" fill="#f5b49e"/><rect x="46" y="46" width="808" height="1008" rx="12" fill="#fff9ed"/>
<g stroke="#b98365" stroke-width="3" fill="none"><path d="M128 195Q175 280 122 370"/><path d="M781 240Q735 310 780 400"/></g><ellipse cx="130" cy="147" rx="68" ry="86" fill="#6ab9b8"/><ellipse cx="772" cy="175" rx="65" ry="87" fill="#ed8a7f"/>
<g fill="#f0cf72"><path d="m300 75 14 32 36 4-27 23 7 35-30-19-31 19 8-35-27-23 36-4Z"/><path d="m635 87 11 26 29 3-22 19 6 28-24-15-24 15 6-28-22-19 28-3Z"/></g>
<g font-family="Georgia,serif" text-anchor="middle" fill="#304f50"><text x="450" y="268" font-size="27" letter-spacing="5">YOU’RE INVITED!</text><text x="450" y="391" font-size="89">Mia’s 8th</text><text x="450" y="491" font-size="80">Birthday</text><path d="M260 547H640" stroke="#ed8a7f" stroke-width="4"/><text x="450" y="621" font-size="38">Saturday, October 17, 2026</text><text x="450" y="687" font-size="44">2:00–4:00 PM</text><text x="450" y="779" font-size="45">Maple Park</text><text x="450" y="831" font-size="29">820 W 7th Street, Austin, TX</text><text x="450" y="917" font-size="25">RSVP to Mia’s mom</text><text x="450" y="956" font-size="24">birthday-demo@envitefy.com</text></g></svg>`;
await fs.writeFile(p+'/flyer.svg',svg);
await sharp(Buffer.from(svg)).png().toFile(out+'/flyer-original.png');
const ff=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',out+'/flyer-original.png','-c:v','libwebp','-quality','85','-compression_level','6',assets+'/flyer.webp'],{encoding:'utf8'});if(ff.status)throw Error(ff.stderr);
const meta=await sharp(assets+'/flyer.webp').metadata();if(meta.format!=='webp'||meta.width!==900||meta.height!==1100)throw Error('WebP verification failed');await sharp(assets+'/flyer.webp').raw().toBuffer();await fs.unlink(out+'/flyer-original.png');
await build({entryPoints:[p+'/demo.jsx'],outfile:out+'/fixture.js',bundle:true,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env':'{}','process.env.NODE_ENV':'"production"'},alias:{'@':path.resolve('../src'),'react':path.resolve('node_modules/react'),'react-dom':path.resolve('node_modules/react-dom'),'next/navigation':path.resolve(p+'/navigation.jsx')},loader:{'.css':'local-css'},logLevel:'warning'});
const html='<link rel="stylesheet" href="/__snap_app.css"/>'; await fs.copyFile('out/john-space-disco/vertical-app.css',out+'/app.css');
const css=[...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map(m=>m[0]).join('');
await fs.writeFile(out+'/fixture.html',`<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>${css}<link rel="stylesheet" href="/__snap_fixture.css"/><style>body{margin:0;font-family:Arial,sans-serif}.serif{font-family:Georgia,serif}button,a{-webkit-tap-highlight-color:transparent}</style></head><body><div id="root"></div><script src="/__snap_fixture.js"></script></body></html>`);
console.log('Actual BirthdaySkin and EventGuestActions bundled with fictional birthday; flyer WebP verified.');

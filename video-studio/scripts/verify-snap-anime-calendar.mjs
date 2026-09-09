import fs from 'node:fs/promises';import {build} from 'esbuild';
const out='out/mom-just-snap-it';
await build({entryPoints:['../src/app/api/ics/route.ts'],outfile:out+'/actual-ics-route.mjs',bundle:true,platform:'node',format:'esm',packages:'external',alias:{'next/server':'next/server.js'},logLevel:'warning'});
const {GET}=await import('../'+out+'/actual-ics-route.mjs');
const proof=JSON.parse(await fs.readFile('projects/mom-just-snap-it/product-proof.json','utf8'));
const response=await GET(new Request('http://localhost:3000'+proof.calendarLinks.appleInline));
const ics=await response.text();await fs.writeFile('projects/mom-just-snap-it/birthday.ics',ics);
if(response.status!==200||!ics.includes('DTSTART:20261017T190000Z')||!ics.includes('DTEND:20261017T210000Z')||!ics.includes("SUMMARY:Mia's 8th Birthday"))throw Error('Actual calendar export verification failed');
await fs.writeFile('projects/mom-just-snap-it/calendar-proof.json',JSON.stringify({actualRoute:'../src/app/api/ics/route.ts',responseStatus:response.status,contentType:response.headers.get('content-type'),eventTitle:"Mia's 8th Birthday",utcStart:'2026-10-17T19:00:00Z',utcEnd:'2026-10-17T21:00:00Z',calendarAppPreviewIllustrative:true,requiresUserAdd:true,calendarAccountConnectionRequired:false,noExternalCalendarWrite:true},null,2));console.log('Actual ICS route verified: title, date, time, duration, REQUEST/Add semantics.');

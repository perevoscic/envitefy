import {connectScanDatabase} from '../scripts/scan-diagnostics-db.mjs';import {writeFile} from 'node:fs/promises';
const client=await connectScanDatabase();
try {
 const uid='943aeded-ad90-44e9-b48f-6517e8b9b3f3';
 const result=(await client.query(`select e.title,e.data->>'startISO' as start,e.data->>'endISO' as end,e.data->>'timezone' as timezone,s.status,s.event_id=e.id as linked,s.preview_bytes is not null as has_preview,u.scans_total,(select count(*)::int from scan_diagnostic_jobs j where j.scan_id=s.id) as remaining_jobs from users u join event_history e on e.user_id=u.id join scan_attempts s on s.user_id=u.id where u.id=$1`,[uid])).rows;
 await writeFile('artifacts/snap-saved-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
} finally {await client.end();}

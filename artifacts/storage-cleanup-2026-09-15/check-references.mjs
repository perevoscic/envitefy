import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import pg from 'pg';
import {createPoolFromEnv} from '../../scripts/lib/pg-from-env.mjs';
const directory='artifacts/storage-cleanup-2026-09-15';
const plan=JSON.parse(fs.readFileSync(directory+'/replacement-plan.json'));
const files=execFileSync('rg',['-l','--hidden','event-media|studio-generated-image|event-card-edit','src','public','templates','scripts','-g','!*.map'],{encoding:'utf8',maxBuffer:10000000}).trim().split('\n').filter(Boolean);
const matches=[];
for(const file of files){const content=fs.readFileSync(file,'utf8');for(const r of plan.replacements){if([r.oldPath,r.oldUrl,r.oldProxyPath,encodeURIComponent(r.oldPath),r.oldPath.replaceAll('/','\\/')].some(p=>p&&content.includes(p)))matches.push({file,oldPath:r.oldPath,newPath:r.newPath})}}
const repository={checkedAt:new Date().toISOString(),filesChecked:files.length,matches};
fs.writeFileSync(directory+'/repository-reference-check.json',JSON.stringify(repository,null,2));
const unused=createPoolFromEnv();const c=new pg.Client({...unused.options,connectionTimeoutMillis:10000,query_timeout:20000});await unused.end();
try{await c.connect();await c.query('BEGIN READ ONLY');await c.query("SET LOCAL statement_timeout='15s'");const {rows:tables}=await c.query("select schemaname,relname from pg_stat_user_tables where schemaname='public' order by relname");const results=[];
for(const {schemaname,relname} of tables){const ident='"'+schemaname.replaceAll('"','""')+'"."'+relname.replaceAll('"','""')+'"';const {rows}=await c.query(`select count(*)::int as count from ${ident} as t where to_jsonb(t)::text like any($1::text[])`,[['%studio-generated-image.png%','%event-card-edit.png%','%studio-generated-image%2Epng%','%event-card-edit%2Epng%']]);results.push({table:relname,matchingRows:rows[0].count});}
await c.query('ROLLBACK');const database={checkedAt:new Date().toISOString(),mode:'read-only',tablesChecked:results.length,totalMatchingRows:results.reduce((s,r)=>s+r.matchingRows,0),tables:results};fs.writeFileSync(directory+'/database-reference-check.json',JSON.stringify(database,null,2));console.log(JSON.stringify({databaseTables:results.length,databaseMatchingRows:database.totalMatchingRows,repositoryFiles:files.length,repositoryMatches:matches.length}));if(database.totalMatchingRows||matches.length)process.exitCode=2;
}finally{await c.end()}

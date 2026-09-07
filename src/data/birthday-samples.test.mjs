import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const source=readFileSync(new URL('./birthday-samples.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {BIRTHDAY_SAMPLES,birthdaySampleHeadline}=await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const ids=[...new Set(['birthday-original-art.ts','birthday-kids-art.ts','birthday-adult-art.ts'].flatMap(file=>[...readFileSync(new URL(file,import.meta.url),'utf8').matchAll(/^  "([^"]+)":/gm)].map(m=>m[1])))].filter(id=>!id.endsWith('-anniversary'));
ids.push(...[...readFileSync(new URL('./birthday-next26-designs.ts',import.meta.url),'utf8').matchAll(/id: "([^"]+)"/g)].map(m=>m[1]));
test('all 120 birthday templates have unique sample names, headlines, venues and notes',()=>{
  assert.equal(ids.length,120);
  for(const id of ids) assert.ok(BIRTHDAY_SAMPLES[id],id);
  for(const field of ['name','venue','notes']) assert.equal(new Set(ids.map(id=>BIRTHDAY_SAMPLES[id][field])).size,120,field);
  const titles=ids.map(id=>birthdaySampleHeadline(id));
  assert.equal(new Set(titles).size,120);
  assert.ok(titles.every(title=>!title.includes('{')&&!title.includes('Emma is turning 5')));
});
test('headlines follow the edited name and age, including ordinal suffixes',()=>{
  assert.equal(birthdaySampleHeadline('woodland-camping-night','Taylor',10),'Camp Taylor: adventure awaits');
  assert.equal(birthdaySampleHeadline('candy-dreams','Ari',1),'Sweet dreams for Ari’s 1st');
  assert.equal(birthdaySampleHeadline('candy-dreams','Ari',12),'Sweet dreams for Ari’s 12th');
});

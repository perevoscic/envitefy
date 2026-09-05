const fs=require('node:fs');function e(p,f){fs.writeFileSync(p,f(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n')));}function r(s,a,b){if(!s.includes(a))throw Error('Missing '+a);return s.replace(a,b);}
e('src/lib/concierge/fallback.test.ts',s=>r(s,'/past|product and time corrections/.test(context.name)','/\\bpast\\b|product and time corrections/.test(context.name)'));
for(const p of ['src/app/studio/StudioWorkspace.prompt-guardrails.test.mjs','src/app/studio/studio-workspace-live-card.source.test.mjs'])e(p,s=>r(s,'/return \\{\\s*mode,\\s*surface,\\s*event:/s','/return \\{\\s*mode,\\s*surface,\\s*product,\\s*event:/s'));
e('src/app/studio/studio-workspace-date-year.source.test.mjs',s=>r(s,'/date: formatStudioPromptDate\\(details\\) \\|\\| null,/','/date: product === "live_card" \\? formatStudioPromptDate\\(details\\) \\|\\| null : getStudioEventDate\\(details\\) \\|\\| null,/'));
e('src/app/studio/studio-workspace-image-finish.source.test.mjs',s=>r(s,'/style:\\s*\\[\\s*visualDirection,\\s*categoryGuardrails,\\s*imageFinishPresetDirection,\\s*internalInstructions,\\s*refinement,\\s*studioGuardrails,\\s*\\]/s','/style:\\s*\\[\\s*visualDirection,\\s*guestPhotoHint,[\\s\\S]*?imageFinishPresetDirection,\\s*internalInstructions,\\s*refinement,[\\s\\S]*?product === "live_card" \\? studioGuardrails/s'));
e('src/app/studio/StudioWorkspace.prompt-guardrails.test.mjs',s=>{
const a=s.indexOf('test("studio prompt sources require'),b=s.indexOf('\ntest(',a+1);if(a<0)throw Error('test start');
const replacement=`test("studio product contracts separate live-card title art from typeset flyers and website heroes", () => {
  const prompts = readSource("src/lib/studio/product-prompts.ts");
  const contracts = readSource("src/lib/studio/product-contract.ts");
  assert.match(prompts, /complete visible-text whitelist/);
  assert.match(prompts, /No visible words, letters, numbers/);
  assert.match(contracts, /bottom 30% free/);
  assert.match(contracts, /5 × 7 inch printable flyer/);
  assert.match(contracts, /Text-free website hero/);
});\n`;
return s.slice(0,a)+replacement+(b<0?'':s.slice(b));
});

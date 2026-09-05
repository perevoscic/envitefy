const fs=require('node:fs');function e(p,f){fs.writeFileSync(p,f(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n')));}function r(s,a,b){if(!s.includes(a))throw Error('Missing '+a);return s.replace(a,b);}
e('src/lib/concierge/event-actions.ts',s=>{s=s.replace('  isEventAssetType,\n','');for(const [first,last] of [['function normalizeAssetType(', 'function normalizePatch('],['function normalizeActions(', 'function inferAssetTypeFromMessage(']]){const a=s.indexOf(first),b=s.indexOf(last,a);if(a<0||b<a)throw Error('function bounds');s=s.slice(0,a)+s.slice(b);}return s;});
e('src/lib/ocr/openai.ts',s=>r(s,'    } catch (parseErr) {\n      console.error(">>> Invalid structured OCR response");','    } catch {\n      console.error(">>> Invalid structured OCR response");'));
e('src/lib/studio/generate.ts',s=>r(s,'  const wantsText = mode === "text" || mode === "both";','  const wantsText = mode === "text" || mode === "both" || (mode === "image" && !request.imageEdit);'));
e('src/lib/studio/generate.reference-images.source.test.mjs',s=>{
const a=s.indexOf('  assert.match(\n    source,\n    /const imagePrompt'),b=s.indexOf('  assert.match(source, /mode === "both"/);',a);
if(a<0||b<a)throw Error('guard bounds');s=s.slice(0,a)+`  assert.match(source, /buildProductArtworkPrompt\\(normalizedRequest\\.event, normalizedRequest\\.guidance, liveCard, product, referenceImages\\.length\\)/);
  assert.match(source, /buildExistingInvitationImageEditPrompt\\(normalizedRequest\\.imageEdit\\?\\.editInstruction\\)/);
  assert.match(source, /resolveStudioProduct\\(request\\.product, surface\\)/);
`+s.slice(b);
s=s.replaceAll('buildLiveCardPrompt\\(normalizedRequest\\.event, normalizedRequest\\.guidance\\)','buildProductCopyPrompt\\(normalizedRequest\\.event, normalizedRequest\\.guidance, product\\)').replaceAll('buildInvitationImagePrompt\\(','buildProductArtworkPrompt\\(');
return s;
});
e('src/lib/concierge/event-actions.test.mjs',s=>r(s,'  assert.match(source, /"status"/);','  assert.doesNotMatch(source.match(/const ALLOWED_EVENT_PATCH_FIELDS = new Set\\(\\[([\\s\\S]*?)\\]\\)/)?.[1] || "", /"status"|"ownership"|"user_id"/);'));

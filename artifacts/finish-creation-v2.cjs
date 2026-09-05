const fs=require('node:fs');
function edit(p,fn){fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n')));}
function r(s,a,b){if(!s.includes(a))throw Error('Missing '+a.slice(0,100));return s.replace(a,b);}
edit('src/lib/concierge/conversation-state.ts',s=>'import { getCreationReadiness } from "./readiness.ts";\n'+r(s,'readyToGenerate: args.draft.canPersist && !args.draft.currentQuestion && !args.draft.missingFields.length,','readyToGenerate: getCreationReadiness(args.draft).canPreview,'));
edit('src/app/studio/studio-workspace-sanitize.ts',s=>{
  s='import { resolveStudioProduct } from "@/lib/studio/product-contract";\n'+s;
  s=r(s,'  const stringKeys: Array<keyof EventDetails> = [','  details.product = value.product ? resolveStudioProduct(value.product) : undefined;\n  details.rsvpEnabled = typeof value.rsvpEnabled === "boolean" ? value.rsvpEnabled : undefined;\n  const stringKeys: Array<keyof EventDetails> = [\n    "approvedWording",\n    "timezone",');
  const a=s.indexOf('export function sanitizeStudioGenerateResponse');
  s=s.slice(0,a)+r(s.slice(a),'    ok: true,\n    mode,','    ok: true,\n    mode,\n    product: resolveStudioProduct(value.product),\n    qualityCheck: value.qualityCheck === "passed" || value.qualityCheck === "failed" ? value.qualityCheck : "unavailable",');
  return s;
});
edit('src/app/studio/studio-workspace-types.ts',s=>r(s,'export type InvitationData = {','export type InvitationData = {\n  creativePlan?: import("@/lib/studio/product-contract").StudioCreativePlan;'));
edit('src/app/studio/studio-workspace-builders.ts',s=>{
  s=r(s,'  return refreshLiveCardInvitationData(details, {','  return refreshLiveCardInvitationData(details, {\n    creativePlan: liveCard?.creativePlan,');
  return s;
});
edit('src/app/chat/ConciergeChatClient.tsx',s=>r(s,'product: resolveStudioProduct(draftToGenerate.requestedOutputs[0]),','product: resolveStudioProduct(draftToGenerate.requestedOutputs.find((output) => ["live_card", "digital_flyer", "printable_flyer", "event_page", "invitation"].includes(output))),'));
edit('src/lib/concierge/event-actions.ts',s=>{
  s='import { EVENT_ACTION_SCHEMA, parseEventActionContract } from "./action-contract.ts";\nimport { creationModelBudget, creationTimeoutMs, recordCreationModelRun } from "../creation/openai-workloads.ts";\n'+s;
  s=s.replace('  openAiChatTemperatureParam,\n','');
  // State transitions remain exclusively in explicit application actions.
  s=r(s,'  "status",\n','');
  s=r(s,'    status: cleanString(patch.status) || undefined,\n','');
  s=r(s,'  const response = await runWithConciergeOpenAiTimeout','  const startedAt = Date.now();\n  const response = await runWithConciergeOpenAiTimeout');
  s=r(s,'        ...openAiChatTemperatureParam(model, 0.1),\n        response_format: { type: "json_object" },\n        max_completion_tokens: 650,','        ...creationModelBudget(model, "correction"),\n        response_format: { type: "json_schema", json_schema: { name: "event_actions_v2", strict: true, schema: EVENT_ACTION_SCHEMA } },');
  s=r(s,'"Only patch event fields relevant to event details, RSVP, copy, status, and design tone.",','"Propose update_event edits using field, operation set or clear, typed value and an exact sourceText span of the latest message. Never edit status, ownership, permission, publishing or arbitrary JSON. Preserve unrelated fields. clear requires an explicit retraction and null value. startISO/endISO require an explicit ISO timestamp; otherwise return dateText/timeText for application parsing. Asset creation and editing also require a quoted sourceText; updates may change only title or guest body copy.",');
  s=r(s,'      { signal } as any,\n    ),\n  );','      { signal } as any,\n    ), creationTimeoutMs("correction"),\n  );');
  s=r(s,'  const parsed = asRecord(parseAiJson(response.choices?.[0]?.message?.content));\n  const actions = normalizeActions(parsed.actions);','  const choice = response.choices?.[0];\n  const outcome = choice?.message?.refusal ? "refused" : choice?.finish_reason !== "stop" ? "incomplete" : "success";\n  recordCreationModelRun({ model, workload: "correction", startedAt, outcome, usage: response.usage });\n  if (outcome !== "success") return null;\n  const parsed = asRecord(parseAiJson(choice?.message?.content));\n  const actions = parseEventActionContract(parsed, params.message, params.assets);');
  s=r(s,'If the user asks for an event page, prefer create_asset with assetType event_page or patch eventPageBlueprint with supported sections and safe theme tokens.','If the user asks for an event page, use create_asset with assetType event_page and a brief referencing supported sections.');
  return s;
});
edit('src/lib/ocr/skin.ts',s=>{
  s=r(s,'type OcrSkinPromptInput = {','type OcrSkinPromptInput = {\n  signal?: AbortSignal;');
  const a=s.indexOf('async function inferWithOpenAi');const b=s.indexOf('async function inferWithGemini',a);
  let chunk=s.slice(a,b);chunk=r(chunk,'    });\n    const raw = completion.choices','    }, { signal: input.signal, maxRetries: 0 });\n    const raw = completion.choices');
  s=s.slice(0,a)+chunk+s.slice(b);
  s=r(s,'      config: {\n        responseMimeType:','      config: {\n        abortSignal: input.signal,\n        responseMimeType:');
  return s;
});
edit('src/lib/ocr/pipeline.ts',s=>r(s,'        inferOcrSkinSelection({\n          category:','        inferOcrSkinSelection({\n          signal: AbortSignal.timeout(skinTimeoutMs),\n          category:'));
edit('src/lib/studio/generate.ts',s=>r(s,'"Targeted quality repair: " + checked.issues.join(", ") + ". Fix only these observed defects, retaining the approved facts, subject and design."','`Targeted quality repair: ${checked.issues.join(", ")}. Fix only these observed defects, retaining the approved facts, subject and design.`'));
edit('src/lib/studio/openai.source.test.mjs',s=>r(s,'/openAiChatCompatibilityParams\\(model, \\{ temperature: 0\\.6 \\}\\)/','/creationModelBudget\\(model, "creative_plan"\\)/'));

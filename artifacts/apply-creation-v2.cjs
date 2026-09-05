const fs = require('node:fs');
function edit(path, fn) { const before = fs.readFileSync(path, 'utf8'); const after = fn(before.replace(/\r\n/g, '\n')); if (after === before) throw Error('No change '+path); fs.writeFileSync(path, after); }
function replace(s, from, to) { if (!s.includes(from)) throw Error('Missing anchor: '+from.slice(0,100)); return s.replace(from,to); }
edit('src/lib/ocr/types.ts', s => 'import type { SourceEvidence } from "../creation/source-evidence.ts";\n'+replace(s,'export type EventOcrLlmResult = {','export type EventOcrLlmResult = {\n  sourceEvidence?: SourceEvidence;'));
edit('src/lib/ocr/extraction-contract.ts', s => replace(s,'strictObject({ x: number, y: number, width: number, height: number, confidence: number })','strictObject({ target: { type: "string", enum: ["face", "title", "center"] }, x: { type: "number" }, y: { type: "number" }, confidence: { type: "number" } })'));
edit('src/lib/ocr/openai.ts', s => {
  s = 'import { EVENT_EXTRACTION_SCHEMA, EXTRACTION_EVIDENCE_INSTRUCTION, parseEventExtraction } from "./extraction-contract.ts";\nimport { creationModelBudget, recordCreationModelRun } from "../creation/openai-workloads.ts";\n'+s;
  s = replace(s,'const todayIso = new Date().toISOString().slice(0, 10);','const startedAt = Date.now();\n  const todayIso = new Date().toISOString().slice(0, 10);');
  s = replace(s,'responseFormat: { type: "json_object" },','responseFormat: { type: "json_schema", json_schema: { name: "event_source_v2", strict: true, schema: EVENT_EXTRACTION_SCHEMA } },');
  s = replace(s,'{ role: "system", content: prompt.system },','{ role: "system", content: `${prompt.system}\\n${EXTRACTION_EVIDENCE_INSTRUCTION}` },');
  s = replace(s,'...(responseFormat ? { response_format: responseFormat } : {}),','...(responseFormat ? { response_format: responseFormat } : {}),\n    ...(responseFormat?.type === "json_schema" ? creationModelBudget(model, "extraction") : {}),');
  s = replace(s,'const text = j?.choices?.[0]?.message?.content || "";',`const choice = j?.choices?.[0];
    const outcome = choice?.message?.refusal ? "refused" : choice?.finish_reason !== "stop" ? "incomplete" : "success";
    recordCreationModelRun({ workload: "extraction", model, startedAt, outcome, usage: j?.usage });
    if (outcome !== "success") return null;
    const text = choice?.message?.content || "";`);
  s = replace(s,'const parsed = JSON.parse(text) as EventOcrLlmResult;','const parsed = parseEventExtraction(JSON.parse(text));\n      if (!parsed) return null;');
  s = s.replace(/      log\(">>> OpenAI extracted data:", parsed\);\n      log\(">>> OpenAI title:", parsed.title\);\n      log\(">>> OpenAI description:", parsed.description\);\n/,'');
  s = replace(s,'console.error(">>> Failed to parse OpenAI JSON:", parseErr, "Raw:", text);','console.error(">>> Invalid structured OCR response");');
  s = replace(s,'const errorBody = await res.text();\n      console.error(">>> OpenAI API error:", { status: res.status, body: errorBody });','console.error(">>> OpenAI API error:", { status: res.status });');
  return s;
});
edit('src/lib/ocr/pipeline.ts', s => {
  s = replace(s,'const rawText = llmEventToRawText(llm);','const rawText = llm?.sourceEvidence?.sourceText ?? llmEventToRawText(llm);');
  const pos=s.lastIndexOf('      ocrText: raw,'); if(pos<0) throw Error('ocr response anchor');
  s=s.slice(0,pos)+s.slice(pos).replace('      ocrText: raw,','      ocrText: raw,\n      sourceEvidence: llmImage?.sourceEvidence || null,');
  return s;
});
edit('src/lib/concierge/types.ts', s => 'import type { SourceEvidence } from "../creation/source-evidence.ts";\n'+s.replaceAll('  ocrText?: string | null;','  ocrText?: string | null;\n  sourceEvidence?: SourceEvidence | null;'));
edit('src/lib/snap-upload-pipeline.ts', s => {
  s=replace(s,'import { prepareOcrUploadFile }','import { normalizeSourceEvidence, type SourceEvidence } from "./creation/source-evidence.ts";\nimport { prepareOcrUploadFile }');
  s=replace(s,'  ocrText?: string | null;','  ocrText?: string | null;\n  sourceEvidence?: SourceEvidence | null;');
  return replace(s,'    fieldsGuess: asRecord(record.fieldsGuess),','    sourceEvidence: normalizeSourceEvidence(record.sourceEvidence),\n    fieldsGuess: asRecord(record.fieldsGuess),');
});
edit('src/lib/concierge/fallback.ts',s => {
  s='import { getCreationReadiness } from "./readiness.ts";\n'+s;
  s=replace(s,'        ocrText: args.ocrContext.ocrText || null,','        ocrText: args.ocrContext.ocrText || null,\n        sourceEvidence: args.ocrContext.sourceEvidence || null,');
  return replace(s,'return Boolean(draft.canPersist && !draft.currentQuestion && draft.missingFields.length === 0);','return getCreationReadiness(draft).canPublish;');
});
edit('src/lib/concierge/extract.ts',s=>{
  s='import { CONCIERGE_EXTRACTION_SCHEMA, CONCIERGE_EXTRACTION_INSTRUCTION, parseConciergeEdits } from "./extraction-contract.ts";\nimport { creationModelBudget, creationTimeoutMs, recordCreationModelRun } from "../creation/openai-workloads.ts";\n'+s;
  const a=s.indexOf('            content: [',s.indexOf('async function extractWithOpenAi'));
  const b=s.indexOf('            ].join(" "),',a)+'            ].join(" "),'.length;
  if(a<0||b<a) throw Error('prompt anchor'); s=s.slice(0,a)+'            content: CONCIERGE_EXTRACTION_INSTRUCTION,'+s.slice(b);
  s=replace(s,'  const response = await runWithConciergeOpenAiTimeout','  const startedAt = Date.now();\n  const response = await runWithConciergeOpenAiTimeout');
  s=replace(s,'        ...openAiChatTemperatureParam(model, 0.1),\n        response_format: { type: "json_object" },\n        max_completion_tokens: /\\b(?:write|wording|bilingual|translate|invitation text)\\b/i.test(request.message || "") ? 1400 : 850,','        ...creationModelBudget(model, "correction"),\n        response_format: { type: "json_schema", json_schema: { name: "creation_edits_v2", strict: true, schema: CONCIERGE_EXTRACTION_SCHEMA } },');
  s=replace(s,'  const content = response.choices?.[0]?.message?.content;','  const choice = response.choices?.[0];\n  const outcome = choice?.message?.refusal ? "refused" : choice?.finish_reason !== "stop" ? "incomplete" : "success";\n  recordCreationModelRun({ workload: "correction", model, startedAt, outcome, usage: response.usage });\n  if (outcome !== "success") return null;\n  const content = choice?.message?.content;');
  s=replace(s,'      { signal } as any,\n    ),\n  );','      { signal } as any,\n    ), creationTimeoutMs("correction"),\n  );');
  s=replace(s,'  const parsedDraft = asRecord(parsed.draft || parsed);','  const edits = parseConciergeEdits(parsed, request);\n  if (!edits) return null;\n  const parsedDraft = edits.patch;');
  s=replace(s,'  return normalizeConciergeDraft(request.retryReply ?', '  const normalized = normalizeConciergeDraft(request.retryReply ?');
  const anchor='    previousDraft: request.draft,\n  });\n}\n\nfunction shouldUsePremiumExtractionModel';
  s=replace(s,anchor,`    previousDraft: request.draft,
  });
  if (!request.retryReply) {
    for (const field of edits.cleared) Object.assign(normalized, { [field]: field === "additionalLocations" ? [] : null });
    if (edits.cleared.includes("dateText")) Object.assign(normalized, { startISO: null, endISO: null });
    if (edits.cleared.includes("location") || edits.cleared.includes("venue")) Object.assign(normalized, { location: null, venue: null });
    const fields = normalized.sourceMaterial?.sourceEvidence?.fields;
    if (fields) {
      const aliases: Record<string, string> = { dateText: "start", timeText: "start", location: "address", venue: "venueName", ageOrMilestone: "birthdayAge", honoreeName: "birthdayName" };
      const nextFields = { ...fields };
      for (const field of edits.accepted) delete nextFields[aliases[field] || field];
      normalized.sourceMaterial = { ...normalized.sourceMaterial, sourceEvidence: { ...normalized.sourceMaterial!.sourceEvidence!, fields: nextFields } };
    }
    Object.assign(normalized, deriveCreationStatus(normalized));
  }
  return applyHostPrivacy(normalized, request.draft);
}

function shouldUsePremiumExtractionModel`);
  s=replace(s,'  if (request.ocrContext) return true;',`  const fields = request.ocrContext?.sourceEvidence?.fields || request.draft?.sourceMaterial?.sourceEvidence?.fields;
  if (fields && Object.values(fields).some((field) => field.status === "conflicting" || field.status === "inferred")) return true;
  if (request.ocrContext && !fields) return true;
  if (request.draft?.conversationState?.lowConfidenceFields?.length) return true;
  if (/\\b(?:actually|instead|correction|bilingual|translate|both languages)\\b/i.test(request.message || "")) return true;`);
  s=s.replace('  openAiChatTemperatureParam,\n','');
  return s;
});

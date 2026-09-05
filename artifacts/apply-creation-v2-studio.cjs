const fs=require('node:fs');
function edit(path,fn){const s=fs.readFileSync(path,'utf8').replace(/\r\n/g,'\n');fs.writeFileSync(path,fn(s));}
function r(s,a,b){if(!s.includes(a))throw Error('Missing '+a.slice(0,90));return s.replace(a,b);}
edit('src/lib/studio/types.ts',s=>{
  s='import { CREATIVE_PLAN_SCHEMA, resolveStudioProduct, type StudioProduct, type StudioCreativePlan } from "./product-contract.ts";\nimport { matchesSchema } from "../creation/source-evidence.ts";\n'+s;
  s=r(s,'export type StudioEventDetails = {','export type StudioEventDetails = {\n  approvedWording?: string | null;\n  rsvpEnabled?: boolean | null;\n  additionalLocations?: Array<{ label?: string | null; venue?: string | null; location?: string | null; address?: string | null; timeText?: string | null; description?: string | null }>;');
  s=r(s,'export type StudioGenerateRequest = {','export type StudioGenerateRequest = {\n  product?: StudioProduct;');
  s=r(s,'export type StudioLiveCardMetadata = {','export type StudioLiveCardMetadata = {\n  creativePlan?: StudioCreativePlan;');
  s=r(s,'export type StudioGenerateResponse = {','export type StudioGenerateResponse = {\n  product?: StudioProduct;\n  qualityCheck?: "passed" | "failed" | "unavailable";');
  s=r(s,'    category: safeNullableString((value as any).category),','    approvedWording: safeNullableString((value as any).approvedWording),\n    rsvpEnabled: typeof (value as any).rsvpEnabled === "boolean" ? (value as any).rsvpEnabled : null,\n    additionalLocations: normalizeAdditionalEventLocations((value as any).additionalLocations),\n    category: safeNullableString((value as any).category),');
  s=r(s,'      mode,\n      surface,\n      event,','      mode,\n      surface,\n      product: resolveStudioProduct((input as Record<string, unknown>).product, surface),\n      event,');
  s=r(s,'  if (\n    !title ||\n    !subtitle ||\n    !openingLine ||\n    !scheduleLine ||\n    !locationLine ||\n    !detailsLine ||\n    !callToAction ||\n    !socialCaption\n  ) {','  if (!title) {');
  s=r(s,'    !interactiveMetadata.rsvpMessage ||\n    !interactiveMetadata.ctaLabel ||\n    !interactiveMetadata.shareNote','    !interactiveMetadata.ctaLabel');
  const idx=s.indexOf('export function normalizeLiveCardMetadata');
  let sub=s.slice(idx);
  sub=r(sub,'    title,\n    description,','    creativePlan: matchesSchema((value as Record<string, unknown>).creativePlan, CREATIVE_PLAN_SCHEMA) ? (value as { creativePlan: StudioCreativePlan }).creativePlan : undefined,\n    title,\n    description,');
  s=s.slice(0,idx)+sub;
  s+=`\nfunction normalizeAdditionalEventLocations(value: unknown): NonNullable<StudioEventDetails["additionalLocations"]> {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object" && !Array.isArray(item)).slice(0, 12).map((item) => ({
    label: safeNullableString(item.label), venue: safeNullableString(item.venue), location: safeNullableString(item.location), address: safeNullableString(item.address), timeText: safeNullableString(item.timeText), description: safeNullableString(item.description),
  }));
}\n`;
  return s;
});
edit('src/lib/studio/live-card-schema.ts',s=>'import { CREATIVE_PLAN_SCHEMA } from "./product-contract.ts";\n'+r(r(s,'required: ["title",','required: ["creativePlan", "title",'),'  properties: {','  properties: {\n    creativePlan: CREATIVE_PLAN_SCHEMA,'));
edit('src/lib/studio/openai.ts',s=>{
  s='import { creationModelBudget, creationTimeoutMs, recordCreationModelRun } from "../creation/openai-workloads.ts";\n'+s;
  s=r(s,'    const completion = await client.chat.completions.create({','    const startedAt = Date.now();\n    const completion = await client.chat.completions.create({');
  s=r(s,'      ...openAiChatCompatibilityParams(model, { temperature: 0.6 }),','      ...creationModelBudget(model, "creative_plan"),');
  s=r(s,'    });\n    const raw = completion.choices?.[0]?.message?.content || "";',`    }, { signal: AbortSignal.timeout(creationTimeoutMs("creative_plan")), maxRetries: 0 });
    const choice = completion.choices?.[0];
    const outcome = choice?.message?.refusal ? "refused" : choice?.finish_reason !== "stop" ? "incomplete" : "success";
    recordCreationModelRun({ model, workload: "creative_plan", startedAt, outcome, usage: completion.usage });
    if (outcome !== "success") return { ok: false, error: buildError(outcome, "Invitation planning did not complete. Please try again."), warnings: [] };
    const raw = choice?.message?.content || "";`);
  if(!s.slice(s.indexOf('\n')).includes('openAiChatCompatibilityParams(')) s=s.replace('import { openAiChatCompatibilityParams } from "../openai-chat-params.ts";\n','');
  return s;
});
edit('src/lib/studio/generate.ts',s=>{
  s='import { composeFlyerExport } from "./flyer-export.ts";\nimport { applyVerifiedCopy, verifyStudioArtwork, type ArtworkCheck } from "./output-checks.ts";\nimport { buildProductCopyPrompt, buildProductArtworkPrompt } from "./product-prompts.ts";\nimport { defaultCreativePlan, resolveStudioProduct } from "./product-contract.ts";\n'+s;
  s=s.replace('  buildInvitationImagePrompt,\n','').replace('  buildLiveCardPrompt,\n','');
  s=r(s,'export const studioGenerationDeps = {','export const studioGenerationDeps = {\n  composeFlyerExport,\n  verifyStudioArtwork,');
  s=r(s,'  const themeNormalization = await','  const product = resolveStudioProduct(request.product, surface);\n  let qualityCheck: ArtworkCheck["status"] = "unavailable";\n  const themeNormalization = await');
  s=r(s,'    const textPrompt = buildLiveCardPrompt(normalizedRequest.event, normalizedRequest.guidance);','    const textPrompt = buildProductCopyPrompt(normalizedRequest.event, normalizedRequest.guidance, product);');
  s=r(s,'      liveCard = sanitizeStudioLiveCardVisibleCopy(normalizedRequest.event, textResult.liveCard);','      liveCard = applyVerifiedCopy(normalizedRequest.event, sanitizeStudioLiveCardVisibleCopy(normalizedRequest.event, textResult.liveCard));\n      liveCard.creativePlan ||= defaultCreativePlan(normalizedRequest.event, product);');
  const a=s.indexOf('      const imagePrompt = editingExistingImage');
  const b=s.indexOf('      const imageResult =',a);
  if(a<0||b<a) throw Error('image prompt');
  s=s.slice(0,a)+`      const artworkPrompt = buildProductArtworkPrompt(normalizedRequest.event, normalizedRequest.guidance, liveCard, product, referenceImages.length);
      const imagePrompt = editingExistingImage
        ? product === "live_card"
          ? buildExistingInvitationImageEditPrompt(normalizedRequest.imageEdit?.editInstruction)
          : ["Edit the supplied artwork. Remove all existing typography so the application can typeset the current event facts. Preserve the visual subject and apply the requested changes.", normalizedRequest.imageEdit?.editInstruction, artworkPrompt].filter(Boolean).join("\\n")
        : artworkPrompt;
`+s.slice(b);
  s=r(s,'        imageDataUrl = imageResult.imageDataUrl;',`        let artwork = imageResult.imageDataUrl;
        let checked: ArtworkCheck = editingExistingImage && product === "live_card"
          ? { status: "unavailable", issues: [] }
          : await studioGenerationDeps.verifyStudioArtwork(artwork, normalizedRequest.event, product);
        if (checked.status === "failed") {
          const repairPrompt = [imagePrompt, "Targeted quality repair: " + checked.issues.join(", ") + ". Fix only these observed defects, retaining the approved facts, subject and design."].join("\\n");
          const repaired = provider === "openai"
            ? await studioGenerationDeps.editInvitationImageWithOpenAi(repairPrompt, artwork)
            : await studioGenerationDeps.editInvitationImageWithGemini(repairPrompt, artwork);
          if (repaired.ok) {
            artwork = repaired.imageDataUrl;
            checked = await studioGenerationDeps.verifyStudioArtwork(artwork, normalizedRequest.event, product);
            // A failed image cannot be accepted merely because the repair verifier timed out.
            if (checked.status === "unavailable") checked = { status: "failed", issues: ["repair_unverified"] };
          }
        }
        qualityCheck = checked.status;
        if (checked.status === "failed") {
          errors.image = { code: "image_quality_failed", message: "The artwork did not pass its text and layout checks after one repair. Please regenerate it.", provider, retryable: true };
        } else {
          if (checked.status === "unavailable") warnings.push("Automatic artwork verification was unavailable; review the preview before sharing.");
          try {
            imageDataUrl = await studioGenerationDeps.composeFlyerExport(artwork, normalizedRequest.event, liveCard, product);
          } catch (error) {
            errors.image = { code: "export_failed", message: error instanceof Error ? error.message : "Flyer export failed.", provider, retryable: false };
          }
        }`);
  s=r(s,'        : hasTextSuccess || hasImageSuccess;','        : hasTextSuccess && hasImageSuccess;');
  s=r(s,'  return {\n    ok,\n    mode,','  return {\n    ok,\n    mode,\n    product,\n    qualityCheck,');
  return s;
});
edit('src/app/studio/studio-workspace-types.ts',s=>r(s,'export type EventDetails = {','export type EventDetails = {\n  product?: import("@/lib/studio/product-contract").StudioProduct;\n  approvedWording?: string;\n  rsvpEnabled?: boolean;\n  timezone?: string;'));
edit('src/app/studio/studio-workspace-builders.ts',s=>{
  s='import { resolveStudioProduct } from "@/lib/studio/product-contract";\n'+s;
  s=r(s,'  const refinement = clean(editPrompt);','  const product = resolveStudioProduct(details.product, surface);\n  const refinement = clean(editPrompt);');
  s=r(s,'    mode,\n    surface,\n    event: {','    mode,\n    surface,\n    product,\n    event: {\n      approvedWording: details.approvedWording || null,\n      rsvpEnabled: details.rsvpEnabled ?? categorySupportsRsvp,\n      additionalLocations: details.additionalLocations || [],');
  s=r(s,'      description:\n        [baseDescription, refinement ? `Edit request: ${refinement}` : "", guestPhotoHint]\n          .filter(Boolean)\n          .join(" ") || null,','      description: baseDescription || null,');
  s=r(s,'      date: formatStudioPromptDate(details) || null,','      date: product === "live_card" ? formatStudioPromptDate(details) || null : getStudioEventDate(details) || null,');
  s=r(s,'      timezone:\n        typeof Intl !== "undefined"','      timezone: details.timezone || (\n        typeof Intl !== "undefined"');
  s=r(s,'          : "America/Chicago",\n      venueName:','          : "America/Chicago"),\n      venueName:');
  s=r(s,'          studioGuardrails,','          product === "live_card" ? studioGuardrails : "The product contract controls image text and safe zones. Event wording is typeset separately.",');
  // This hint is private art direction, never part of the description shown to guests.
  s=r(s,'          visualDirection,\n          categoryGuardrails,','          visualDirection,\n          guestPhotoHint,\n          categoryGuardrails,');
  return s;
});
edit('src/app/chat/ConciergeChatClient.tsx',s=>{
  const index=s.indexOf('import ');s=s.slice(0,index)+'import { getCreationReadiness } from "@/lib/concierge/readiness";\nimport { resolveStudioProduct } from "@/lib/studio/product-contract";\n'+s.slice(index);
  s=r(s,'    ocrText: result.ocrText || null,','    ocrText: result.ocrText || null,\n    sourceEvidence: result.sourceEvidence || null,');
  s=r(s,'    draft?.requestedOutputs.length &&\n      draft.draftStatus === "preview_ready" &&\n      !draft.currentQuestion &&\n      draft.missingFields.length === 0,','    getCreationReadiness(draft).canPreview,');
  s=r(s,'return isReceivedInviteDraft(draft) && isReadyCreationDraft(draft);','return isReceivedInviteDraft(draft) && getCreationReadiness(draft).canPublish;');
  s=r(s,'    const details = buildStudioDetailsFromDraft(draftToGenerate);','    const details = { ...buildStudioDetailsFromDraft(draftToGenerate),\n      product: resolveStudioProduct(draftToGenerate.requestedOutputs[0]),\n      approvedWording: draftToGenerate.copyStatus === "ready" ? draftToGenerate.previewCopy.body : undefined,\n      rsvpEnabled: draftToGenerate.rsvpEnabled === true,\n      timezone: draftToGenerate.timezone,\n    };');
  s=r(s,'      sourceImageUrl ? "image" : "both",\n      "page",','      sourceImageUrl ? "image" : "both",\n      details.product === "digital_flyer" || details.product === "printable_flyer" ? "image" : "page",');
  const a=s.indexOf('  async function publishGeneratedDraft()');
  s=s.slice(0,a)+r(s.slice(a),'    if (!isReadyProductDraft(productDraft)) {','    if (!getCreationReadiness(productDraft).canPublish) {');
  return s;
});
edit('src/app/api/studio/generate/route.ts',s=>{
  s=r(s,'imageUrl: uploaded.stored.display?.url || uploaded.stored.source?.url || null,','imageUrl: result.product === "digital_flyer" || result.product === "printable_flyer"\n            ? uploaded.stored.source?.url || null\n            : uploaded.stored.display?.url || uploaded.stored.source?.url || null,');
  return s;
});
edit('next.config.ts',s=>r(s,'      "./node_modules/@napi-rs/canvas/**/*",','      "./public/fonts/Josefin_Sans/static/JosefinSans-Regular.ttf",\n      "./node_modules/@napi-rs/canvas/**/*",'));
edit('src/lib/studio/prompts.ts',s=>r(s,'`funFacts` should contain 2-4 short, useful guest-facing notes.','`funFacts` should contain 0-4 short, useful guest-facing notes grounded in supplied facts; use an empty array when none are supplied.'));

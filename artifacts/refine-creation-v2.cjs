const fs=require('node:fs');function e(p,f){fs.writeFileSync(p,f(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n')));}function r(s,a,b){if(!s.includes(a))throw Error('Missing '+a);return s.replace(a,b);}
e('src/lib/studio/openai.ts',s=>{
  s='import type { StudioProduct } from "./product-contract.ts";\n'+s;
  const a=s.indexOf('async function postOpenAiImageGeneration('), b=s.indexOf('async function postOpenAiImageEdit(',a);
  let sub=s.slice(a,b);sub=r(sub,'  referenceImages?: StudioResolvedSourceImage[],','  referenceImages?: StudioResolvedSourceImage[],\n  product?: StudioProduct,');sub=sub.replaceAll('size: resolveImageSize(),','size: product === "event_page" ? "1536x1024" : resolveImageSize(),');s=s.slice(0,a)+sub+s.slice(b);
  s=r(s,'export async function generateInvitationImageWithOpenAi(\n  prompt: string,\n  referenceImages?: StudioResolvedSourceImage[],','export async function generateInvitationImageWithOpenAi(\n  prompt: string,\n  referenceImages?: StudioResolvedSourceImage[],\n  product?: StudioProduct,');
  return r(s,'return postOpenAiImageGeneration(resolveImageModel(), prompt, referenceImages);','return postOpenAiImageGeneration(resolveImageModel(), prompt, referenceImages, product);');
});
e('src/lib/studio/gemini.ts',s=>{
  s='import type { StudioProduct } from "./product-contract.ts";\n'+s;
  const a=s.indexOf('async function postGeminiImage('),b=s.indexOf('export async function generateStudioLiveCardWithGemini(',a);
  let sub=s.slice(a,b);sub=r(sub,'  referenceImages?: StudioResolvedSourceImage[],','  referenceImages?: StudioResolvedSourceImage[],\n  product?: StudioProduct,');sub=r(sub,'imageConfig: resolveInviteImageConfig(),','imageConfig: { ...resolveInviteImageConfig(), ...(product === "event_page" ? { aspectRatio: "3:2" } : {}) },');s=s.slice(0,a)+sub+s.slice(b);
  s=r(s,'export async function generateInvitationImageWithGemini(\n  prompt: string,\n  referenceImages?: StudioResolvedSourceImage[],','export async function generateInvitationImageWithGemini(\n  prompt: string,\n  referenceImages?: StudioResolvedSourceImage[],\n  product?: StudioProduct,');
  return r(s,'postGeminiImage(resolveImageModel(), prompt, undefined, referenceImages);','postGeminiImage(resolveImageModel(), prompt, undefined, referenceImages, product);');
});
e('src/lib/studio/generate.ts',s=>{
  s=s.replaceAll('referenceImages.length > 0 ? referenceImages : undefined,\n            );','referenceImages.length > 0 ? referenceImages : undefined,\n              product,\n            );');
  return r(s,'referenceImages.length > 0 ? referenceImages : undefined,\n            )','referenceImages.length > 0 ? referenceImages : undefined,\n              product,\n            )');
});
e('src/utils/media-upload-client.ts',s=>{
  const a=s.indexOf('export async function persistImageMediaValue('),b=s.indexOf('export function mergeUploadedEventMedia',a);let sub=s.slice(a,b);
  sub=r(sub,'  value?: string | null;','  value?: string | null;\n  preferOriginal?: boolean;');
  sub=sub.replaceAll('upload.stored.display?.url || upload.eventMedia.thumbnail || params.fallbackValue || null,','(params.preferOriginal ? upload.stored.source?.url : upload.stored.display?.url) || upload.eventMedia.thumbnail || params.fallbackValue || null,');
  return s.slice(0,a)+sub+s.slice(b);
});
e('src/app/chat/ConciergeChatClient.tsx',s=>r(s,'      value: rawImageUrl,\n      fileName,','      value: rawImageUrl,\n      preferOriginal: details.product === "digital_flyer" || details.product === "printable_flyer",\n      fileName,'));
e('src/app/studio/StudioWorkspace.tsx',s=>r(s,'      value: u,\n      fileName:','      value: u,\n      preferOriginal: item.type === "image" || item.details?.product === "digital_flyer" || item.details?.product === "printable_flyer",\n      fileName:'));
e('src/app/studio/studio-workspace-builders.ts',s=>{
  const a=s.indexOf('export function resolveStudioCallToAction'),b=s.indexOf('function buildGameDayContextNotes',a);let sub=s.slice(a,b);
  sub=r(sub,'): string {\n  const categorySupportsRsvp','): string {\n  if (details.rsvpEnabled === false) return "View details";\n  const categorySupportsRsvp');
  const c=sub.indexOf('export function resolveStudioRsvpMessage');sub=sub.slice(0,c)+r(sub.slice(c),'): string {\n  const categorySupportsRsvp','): string {\n  if (details.rsvpEnabled === false) return "";\n  const categorySupportsRsvp');
  return s.slice(0,a)+sub+s.slice(b);
});

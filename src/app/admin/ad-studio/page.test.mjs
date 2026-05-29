import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("admin ad hub exposes the production dashboard and required controls", () => {
  const page = readSource("src/app/admin/ad-studio/page.tsx");
  const client = readSource("src/app/admin/ad-studio/AdStudioClient.tsx");
  const input = readSource("src/app/admin/ad-studio/components/AdStudioInput.tsx");
  const preview = readSource("src/app/admin/ad-studio/components/VideoPreviewTab.tsx");
  const player = readSource("src/app/admin/ad-studio/components/DeterministicAdPlayer.tsx");
  const framesTab = readSource("src/app/admin/ad-studio/components/FramesTab.tsx");
  const pipeline = readSource("src/app/admin/ad-studio/components/PipelineProgress.tsx");

  assert.match(page, /title="Envitefy Ad Hub"/);
  assert.match(input, /Describe the promo video you want to create/);
  assert.match(input, /10 seconds/);
  assert.match(input, /15 seconds/);
  assert.match(input, /20 seconds/);
  assert.match(input, /Vertical 9:16/);
  assert.match(input, /Horizontal 16:9/);
  assert.match(input, /Square 1:1/);
  assert.match(input, /Generate all formats/);
  assert.match(input, /Baby shower/);
  assert.match(input, /Gymnastics meet/);
  assert.match(input, /Modern SaaS/);
  assert.match(input, /Generate Promo Video/);
  assert.match(client, /Campaign Brief/);
  assert.match(client, /Preview/);
  assert.match(client, /Veo Prompts/);
  assert.match(client, /Exports/);
  assert.match(client, /updatePipelineStep/);
  assert.match(client, /Image Generation Agent is creating realistic base scenes only/);
  assert.match(client, /markImageGenerationFailed/);
  assert.match(pipeline, /Start step 6/);
  assert.match(framesTab, /Continue from step 6/);
  assert.match(preview, /Vertical/);
  assert.match(preview, /9:16/);
  assert.match(preview, /Horizontal/);
  assert.match(preview, /16:9/);
  assert.match(preview, /Square/);
  assert.match(preview, /1:1/);
  assert.match(player, /backgroundFor/);
  assert.match(player, /uniqueBackgrounds/);
  assert.match(player, /transition-opacity/);
  assert.match(player, /campaign\.baseFrames/);
  assert.match(player, /PhoneHero/);
  assert.match(player, /InviteSourceCard/);
  assert.match(player, /rounded-full/);
  assert.match(player, /Download video/);
  assert.match(player, /getDisplayMedia/);
  assert.match(player, /MediaRecorder/);
});

test("ad hub is modular, provider-ready, and keeps server-side admin gates", () => {
  const route = readSource("src/app/api/admin/ad-studio/generate/route.ts");
  const imagesRoute = readSource("src/app/api/admin/ad-studio/images/route.ts");
  const videoRoute = readSource("src/app/api/admin/ad-studio/video/route.ts");
  const providers = readSource("src/lib/admin/ad-studio/providers.ts");
  const index = readSource("src/lib/admin/ad-studio/index.ts");

  assert.match(route, /requireAdminSession\(\)/);
  assert.match(imagesRoute, /requireAdminSession\(\)/);
  assert.match(videoRoute, /requireAdminSession\(\)/);
  assert.match(route, /generateAdminAdStudioConfig/);
  assert.match(imagesRoute, /generateAdminAdStudioImages/);
  assert.match(videoRoute, /generateAdminAdStudioVideo/);
  assert.match(providers, /ADMIN_AD_STUDIO_TEXT_PROVIDER/);
  assert.match(providers, /ADMIN_AD_STUDIO_OPENAI_TEXT_MODEL/);
  assert.match(providers, /ADMIN_AD_STUDIO_IMAGE_PROVIDER/);
  assert.match(providers, /ADMIN_AD_STUDIO_OPENAI_IMAGE_MODEL/);
  assert.match(providers, /STUDIO_PROVIDER/);
  assert.match(providers, /gpt-image-2/);
  assert.match(index, /providerModels/);
});

test("deterministic invitation and phone UI rendering are separate from image generation", () => {
  const invitationRenderer = readSource("src/lib/admin/ad-studio/renderers/invitation-renderer.ts");
  const phoneRenderer = readSource("src/lib/admin/ad-studio/renderers/phone-ui-renderer.ts");
  const imageAgent = readSource("src/lib/admin/ad-studio/agents/image-generation-agent.ts");
  const compositor = readSource("src/lib/admin/ad-studio/agents/compositing-agent.ts");

  assert.match(invitationRenderer, /renderInvitationSvg/);
  assert.match(invitationRenderer, /shortTheme/);
  assert.match(invitationRenderer, /fontSizeFor/);
  assert.match(invitationRenderer, /clipPath id="cardClip"/);
  assert.match(phoneRenderer, /renderPhoneUiSvg/);
  assert.match(imageAgent, /buildBaseFramePrompt/);
  assert.match(imageAgent, /blank paper, card, flyer, and phone screens/);
  assert.match(imageAgent, /vertical portrait phone/);
  assert.match(imageAgent, /background plate/);
  assert.match(imageAgent, /Do not generate readable flyer text/);
  assert.match(imageAgent, /Do not generate exact phone UI/);
  assert.match(imageAgent, /Do not render Envitefy product screens/);
  assert.doesNotMatch(imageAgent, /Ask the image model to generate readable flyer text/i);
  assert.match(compositor, /renderInvitationCompositeBuffer/);
  assert.match(compositor, /renderPhoneUiCompositeBuffer/);
});

test("identity continuity uses cropped host references, not full prior frames", () => {
  const imageAgent = readSource("src/lib/admin/ad-studio/agents/image-generation-agent.ts");
  const frameDirector = readSource("src/lib/admin/ad-studio/agents/frame-director-agent.ts");

  assert.match(imageAgent, /cropHostIdentityReference/);
  assert.match(imageAgent, /references\/host-identity\.png/);
  assert.match(frameDirector, /cropped_host_identity_reference/);
  assert.match(
    frameDirector,
    /Do not use whole prior frames as references unless absolutely necessary/,
  );
});

test("QA rejects bad compositing and blocks Veo prompt generation until frames are accepted", () => {
  const qa = readSource("src/lib/admin/ad-studio/qa/image-qa.ts");
  const veo = readSource("src/lib/admin/ad-studio/video/veo-prompts.ts");
  const index = readSource("src/lib/admin/ad-studio/index.ts");
  const exportAgent = readSource("src/lib/admin/ad-studio/agents/export-agent.ts");

  assert.match(qa, /image_qa_failed/);
  assert.match(qa, /Required deterministic invitation asset is missing/);
  assert.match(qa, /Required deterministic phone UI asset is missing/);
  assert.match(qa, /full prior frame appears to be used as a reference/i);
  assert.match(veo, /accepted composited frames are required before Veo prompts/);
  assert.match(veo, /background plates/);
  assert.match(veo, /deterministic overlays/);
  assert.match(index, /"image_qa_failed"/);
  assert.match(index, /"export",\s*"passed"/);
  assert.match(exportAgent, /campaignJsonSnapshot/);
});

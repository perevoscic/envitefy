import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("/chat is a signed-in concierge page, not an admin-only notFound page", () => {
  const page = readSource("src/app/chat/page.tsx");
  const client = readSource("src/app/chat/ConciergeChatClient.tsx");

  assert.match(page, /ConciergeChatClient/);
  assert.doesNotMatch(page, /isAdmin/);
  assert.doesNotMatch(page, /notFound\(/);
  assert.match(client, /What are we celebrating\?/);
  assert.match(client, /fetch\("\/api\/creation\/intake"/);
  assert.match(client, /CreationSessionResumeResponse/);
  assert.match(client, /useSearchParams/);
  assert.match(client, /const threadId = searchParams\.get\("thread"\)/);
  assert.match(client, /restoreThread/);
  assert.match(client, /\/api\/creation\/intake\?threadId=/);
  assert.match(client, /setDraft\(restoredDraft\)/);
  assert.match(client, /type ConciergePhase =/);
  assert.match(client, /"ready_to_generate"/);
  assert.match(client, /"generating_card"/);
  assert.match(client, /"card_ready"/);
  assert.match(client, /shouldShowWorkspacePanel/);
  assert.match(client, /shouldShowWorkspacePanel \? workspacePanel : null/);
  assert.match(client, /const \[liveCardEventId, setLiveCardEventId\]/);
  assert.match(client, /NEXT_PUBLIC_CONCIERGE_FAST_UPLOADS/);
  assert.match(client, /FAST_UPLOAD_OCR_URL = "\/api\/ocr\?fast=1&turbo=1&timing=1"/);
  assert.match(client, /DEFAULT_UPLOAD_OCR_URL = "\/api\/ocr\?fast=0"/);
  assert.match(client, /ENABLE_FAST_UPLOAD_OCR \? FAST_UPLOAD_OCR_URL : DEFAULT_UPLOAD_OCR_URL/);
  assert.match(client, /const activeContext: ConciergeActiveContext =/);
  assert.match(client, /activeContext,/);
  assert.match(client, /"Thinking"/);
  assert.match(client, /currentEventId: liveCardEventId/);
  assert.match(client, /const workspacePanel = \(/);
  assert.match(client, /generateProductForDraft/);
  assert.match(client, /Generated product/);
  assert.match(client, /Event Workspace/);
  assert.match(client, /Ready to generate/);
  assert.match(client, /Generate product/);
  assert.match(client, /View product/);
  assert.match(client, /Refine workspace/);
  assert.match(client, /sendGeneratedCardEdit/);
  assert.match(client, /fetch\(`\/api\/concierge\/events\/\$\{liveCardEventId\}\/message`/);
  assert.match(client, /What are we celebrating\?/);
  assert.match(client, /RSVP/);
  assert.match(client, /action: "save"/);
  assert.match(client, /persistSession: true/);
  assert.match(client, /Choose output/);
  assert.match(client, /aria-label="Product menu"/);
  assert.match(client, /<span className="hidden sm:inline">Product<\/span>/);
  assert.match(client, /Add source/);
  assert.match(client, /Choose a category and product to start/);
  assert.match(client, /const \[starterCategory, setStarterCategory\]/);
  assert.match(client, /useState<RequestedOutput \| null>\(null\)/);
  assert.match(client, /startStarterConversation/);
  assert.match(client, /setIsProductMenuOpen\(true\)/);
  assert.match(client, /document\.addEventListener\("pointerdown", handlePointerDown, true\)/);
  assert.match(client, /window\.addEventListener\("envitefy:chat:new", handleNewChatSession\)/);
  assert.match(client, /setInput\(""\)/);
  assert.match(client, /STUDIO_CATEGORY_TILES/);
  assert.match(client, /CHAT_STUDIO_GRID_COMPOSITION/);
  assert.match(client, /ChatStudioStarterGrid/);
  assert.match(client, /selectedCategory=\{starterCategory\}/);
  assert.match(client, /Upload Your Invite/);
  assert.match(client, /max-w-\[72rem\]/);
  assert.match(client, /text-center sm:px-6 sm:pb-60/);
  assert.match(client, /className="mx-auto max-w-xl/);
  assert.match(client, /className="mx-auto mt-3 max-w-lg/);
  assert.match(client, /grid-cols-6/);
  assert.match(client, /row-start-2/);
  assert.match(
    client,
    /Wedding: "col-start-1 row-start-3 sm:col-start-6 sm:row-span-2 sm:row-start-1"/,
  );
  assert.match(client, /"Custom Invite": "col-start-2 row-start-5 sm:col-start-5 sm:row-start-2"/);
  assert.match(client, /upload: "hidden sm:block sm:col-start-3 sm:row-start-1"/);
  assert.doesNotMatch(client, /"Custom Invite": "col-span-2/);
  assert.match(client, /onClick=\{\(\) => void onSelect\(category\.name\)\}/);
  assert.match(client, /setPhase\("collecting_details"\)/);
  assert.match(client, /action: "starter_category"/);
  assert.match(client, /aria-label="Upload file"/);
  assert.match(client, /aria-label="Use camera"/);
  assert.match(client, /w-fit max-w-\[86%\] self-start items-center gap-2 rounded-full/);
  assert.match(
    client,
    /grid-cols-\[auto_minmax\(0,1fr\)_auto\] sm:grid-cols-\[auto_minmax\(0,1fr\)_auto_auto\]/,
  );
  assert.match(
    client,
    /grid-cols-\[auto_minmax\(0,1fr\)_auto\] sm:grid-cols-\[auto_auto_auto_minmax\(0,1fr\)_auto_auto\]/,
  );
  assert.match(client, /shouldShowWorkspacePanel \? "max-w-\[26rem\]" : "max-w-3xl"/);
  assert.match(client, /flex min-h-\[calc\(100vh-5rem\)\] w-full flex-col justify-end gap-5/);
  assert.match(client, /pb-\[calc\(env\(safe-area-inset-bottom\)\+0\.75rem\)\]/);
  assert.doesNotMatch(client, /space-y-5/);
  assert.doesNotMatch(client, /type StarterChip/);
  assert.doesNotMatch(client, /const CHIPS/);
  assert.doesNotMatch(client, /setResumeDraft/);
  assert.doesNotMatch(client, /flex flex-wrap gap-2/);
  assert.doesNotMatch(client, /Building draft/);
  assert.doesNotMatch(client, /activeContextForCandidate/);
  assert.doesNotMatch(client, /draft\.sourceContext\.candidates\?\.length/);
  assert.doesNotMatch(client, /fetch\("\/api\/history"/);
  assert.doesNotMatch(client, /buildConciergeHistoryPayload\(draft\)/);
  assert.doesNotMatch(client, /suggestedReplies/);
  assert.doesNotMatch(client, /handleSuggestedReply/);
  assert.doesNotMatch(client, /shouldShowLiveCardPanel/);
  assert.doesNotMatch(client, /generateLiveCardForDraft/);
  assert.doesNotMatch(client, /draft && shouldShowWorkspacePreview \?/);
  assert.doesNotMatch(client, /const shouldShowWorkspacePreview = isReadyCreationDraft\(draft\)/);
  assert.doesNotMatch(client, /Recent draft/);
  assert.doesNotMatch(client, /Resume draft/);
  assert.doesNotMatch(client, /Start fresh/);
  assert.doesNotMatch(client, /I restored your latest live card draft/);
  assert.doesNotMatch(client, /Still needed:/);
  assert.doesNotMatch(client, /draft\.missingFields\.slice\(0, 3\)\.map\(missingFieldLabel\)/);
  assert.doesNotMatch(client, /Keep adding details/);
  assert.doesNotMatch(client, /Details to Fill/);
  assert.doesNotMatch(client, /Live Card Builder/);
  assert.doesNotMatch(client, /Details checklist/);
  assert.doesNotMatch(client, /Save event/);
  assert.doesNotMatch(client, /Public event output/);
  assert.doesNotMatch(client, /shouldShowLiveCardBuilder/);
  assert.doesNotMatch(client, /Boolean\(draft\)/);
  assert.doesNotMatch(client, /draftWorkspacePreview/);
  assert.doesNotMatch(client, /Open Workspace/);
  assert.doesNotMatch(client, /Product: \$\{option\.label\}/);
  assert.doesNotMatch(client, /draft\.previewCopy\.headline/);
  assert.doesNotMatch(client, /rounded-2xl border border-\[#eee7ff\]/);
  assert.doesNotMatch(client, /canSave\s*\?\s*"Ready"\s*:\s*"Draft"/);
});

test("/cht typo route is not present", () => {
  assert.equal(fs.existsSync(path.join(repoRoot, "src/app/cht/page.tsx")), false);
});

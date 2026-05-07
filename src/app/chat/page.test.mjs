import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("/chat is the OpenAI-backed concierge creator", () => {
  const appShell = readSource("src/app/AppShell.tsx");
  const page = readSource("src/app/chat/page.tsx");
  const client = readSource("src/app/chat/ConciergeChatClient.tsx");
  const preview = readSource("src/app/chat/ChatProductPreview.tsx");
  const chatSurface = `${client}\n${preview}`;
  const bottomNav = readSource("src/components/ui/bottom-nav-bar.tsx");
  const uiDemo = readSource("src/components/ui/demo.tsx");
  const extract = readSource("src/lib/concierge/extract.ts");
  const eventActions = readSource("src/lib/concierge/event-actions.ts");

  assert.match(page, /ConciergeChatClient/);
  assert.match(page, /getServerSession\(authOptions as any\)/);
  assert.match(page, /getUserByEmail\(email\)/);
  assert.match(page, /userFirstName=\{userFirstName\}/);
  assert.doesNotMatch(page, /isAdmin/);
  assert.doesNotMatch(page, /notFound\(/);

  assert.match(client, /What are we celebrating\?/);
  assert.match(client, /DETAIL_CONFIRMATION_LINE/);
  assert.match(client, /RSVP\(\?: guest count\| by\| deadline\| line\)\?/);
  assert.match(
    client,
    /themeValue && !\/\\btheme\$\/i\.test\(themeValue\) \? `\$\{themeValue\} theme` : null/,
  );
  assert.match(client, /userFirstName\?: string \| null/);
  assert.match(client, /buildInitialAssistantPrompt/);
  assert.match(client, /Hi \$\{cleaned\}, what are we celebrating\?/);
  assert.match(client, /isOpeningAssistantPrompt/);
  assert.match(client, /text-4xl/);
  assert.match(client, /sm:text-6xl/);
  assert.match(client, /STUDIO_CATEGORY_TILES/);
  assert.match(client, /CHAT_STARTER_PROMPTS/);
  assert.match(client, /CELEBRATION_STARTER_TILES/);
  assert.match(client, /What are we celebrating\?/);
  assert.match(client, /Or just start typing and let's get going/);
  assert.doesNotMatch(client, /Describe what you're planning/);
  assert.doesNotMatch(client, /Choose a format or describe what you need/);
  assert.match(client, /\[&::placeholder\]:text-\[0\.82rem\]/);
  assert.match(client, /Pick a category or describe it in your own words/);
  assert.match(client, /label: "Birthday"/);
  assert.match(client, /label: "Wedding"/);
  assert.match(client, /label: "Baby Shower"/);
  assert.match(client, /label: "Game Day"/);
  assert.match(client, /label: "Bridal Shower"/);
  assert.doesNotMatch(client, /Birthday live card/);
  assert.doesNotMatch(client, /Wedding invitation/);
  assert.doesNotMatch(client, /Baby shower invite/);
  assert.doesNotMatch(client, /Game event page/);
  assert.doesNotMatch(client, /Bridal shower invite/);
  assert.doesNotMatch(client, /Something else/);
  assert.doesNotMatch(client, /handleCustomCategoryPrompt/);
  assert.doesNotMatch(client, /COMPOSER_TEXTAREA_ID/);
  assert.doesNotMatch(client, /Watch party invite/);
  assert.ok(client.indexOf('label: "Game Day"') < client.indexOf('label: "Baby Shower"'));
  assert.match(client, /label: "Baby Shower"[\s\S]*?size: "desktopWide"/);
  assert.match(client, /selectedStarterCategory \? "starter_category" : undefined/);
  assert.match(client, /col-span-2 aspect-\[2\.055\/1\]/);
  assert.match(client, /sm:col-span-2 sm:aspect-\[2\.055\/1\]/);
  assert.match(client, /aspect-square min-h-\[8\.25rem\]/);
  assert.doesNotMatch(client, /Upload invite or photo/);
  assert.doesNotMatch(client, /CHAT_STUDIO_GRID_COMPOSITION/);
  assert.doesNotMatch(client, /ChatStudioStarterGrid/);
  assert.doesNotMatch(client, /auto-rows-\[92px\]/);
  assert.doesNotMatch(client, /sm:auto-rows-\[130px\]/);
  assert.doesNotMatch(client, /md:auto-rows-\[155px\]/);
  assert.match(client, /max-w-\[90rem\]/);
  assert.doesNotMatch(client, /Choose a category and product to start/);
  assert.doesNotMatch(client, /Upload Your Invite/);
  assert.match(client, /PRODUCT_OPTIONS/);
  assert.doesNotMatch(client, /CATEGORY_OPTIONS/);
  assert.doesNotMatch(client, /categorySelectValueFromDraft/);
  assert.doesNotMatch(client, /handleCategoryChange/);
  assert.doesNotMatch(client, /Set the event category to/);
  assert.doesNotMatch(client, /Inferred category/);
  assert.match(client, /gym_meet: "Game Day"/);
  assert.match(preview, /ChevronDown/);
  assert.match(preview, /isMobileDetailsOpen/);
  assert.match(preview, /aria-expanded=\{isMobileDetailsOpen\}/);
  assert.match(preview, /md:mt-0 md:grid/);
  assert.match(preview, /function ChatOutputPreviewSurface/);
  assert.match(preview, /function ChatFlyerInvitePreview/);
  assert.doesNotMatch(preview, /function ChatInvitationPreview/);
  assert.match(preview, /function ChatEventPagePreview/);
  assert.match(
    preview,
    /selectedOutput === "digital_flyer"[\s\S]{0,140}selectedOutput === "printable_flyer"[\s\S]{0,140}selectedOutput === "invitation"/,
  );
  assert.doesNotMatch(preview, /Open Invitation/);
  assert.match(preview, /if \(selectedOutput === "event_page"\)/);
  assert.match(preview, /<ChatOutputPreviewSurface/);
  assert.match(preview, /selectedOutput=\{selectedOutput\}/);
  assert.match(preview, /publicActionLabelForOutput/);
  assert.match(preview, /selectedOutput === "event_page"\) return "Open Event Page"/);
  assert.match(preview, /Preview placeholder\. Generate to publish\./);
  assert.match(preview, /Answer the next question to unlock Generate\./);
  assert.doesNotMatch(preview, /isCategoryMenuOpen/);
  assert.doesNotMatch(preview, /title=\{`Category: \$\{categoryLabel\}`\}/);
  assert.doesNotMatch(client, /PRODUCT_CHOICE_PROMPT/);
  assert.doesNotMatch(client, /"What kind of product would you like to create\?"/);
  assert.doesNotMatch(client, /const shouldShowComposerProductOptions = !liveCardEventId/);
  assert.doesNotMatch(client, /shouldShowComposerProductOptions/);
  assert.match(client, /shouldShowProductFormatTiles/);
  assert.match(client, /hasInitialEventContext/);
  assert.match(client, /!draft\?\.requestedOutputs\.length/);
  assert.doesNotMatch(
    client,
    /const shouldShowProductFormatTiles =[\s\S]{0,180}!selectedProductOutput/,
  );
  assert.match(client, /BottomNavBar/);
  assert.match(client, /ariaLabel="Choose product format"/);
  assert.match(client, /activeValue=\{selectedProductOutput\}/);
  assert.match(client, /defaultIndex=\{-1\}/);
  assert.doesNotMatch(client, /autoOpenOnMount/);
  assert.doesNotMatch(client, /autoOpenIntervalMs=\{2000\}/);
  assert.match(client, /className="w-fit max-w-full self-start"/);
  assert.match(client, /className="min-w-\[304px\] border-\[#e9e3f2\] bg-white\/96"/);
  assert.match(client, /onValueChange=\{\(value\) =>/);
  assert.match(client, /function handleProductChoice\(option: ProductOption\)/);
  assert.match(client, /setSelectedProductOutput\(option\.output\)/);
  assert.match(client, /function updateComposerSelection/);
  assert.match(client, /function selectionPrefix/);
  assert.match(client, /setInput\(\(current\) =>/);
  assert.match(client, /function handleComposerValueChange\(nextValue: string\)/);
  assert.match(client, /if \(nextValue\.trim\(\)\) return/);
  assert.match(client, /setSelectedStarterCategory\(null\)/);
  assert.match(client, /setSelectedProductOutput\(null\)/);
  assert.match(client, /onValueChange=\{handleComposerValueChange\}/);
  assert.match(client, /focusComposerAtEnd/);
  assert.doesNotMatch(
    client,
    /function updateComposerSelection[\s\S]{0,700}focusComposerAtEnd\(\)/,
  );
  assert.match(client, /updateComposerSelection\(nextCategoryLabel, option\.output\)/);
  assert.match(client, /const draftRequestedOutputs = draft\?\.requestedOutputs\?\.length/);
  assert.match(client, /const shouldPreserveDraftOutputs =/);
  assert.match(client, /shouldPreserveDraftOutputs\s*\?\s*draftRequestedOutputs/);
  assert.match(client, /selectedProductOutput\s*\?\s*\[selectedProductOutput\]/);
  assert.doesNotMatch(client, /message: option\.prompt/);
  assert.doesNotMatch(client, /requestedOutputs: \[option\.output\]/);
  assert.match(client, /role="group"/);
  assert.match(client, /selectedProductOutput === option\.output/);
  assert.match(client, /text-\[#5f4b82\]/);
  assert.match(client, /className="flex w-full justify-center sm:hidden"/);
  assert.match(client, /className="w-full !min-w-0 !max-w-\[21rem\]/);
  assert.match(
    client,
    /className="flex w-full justify-center sm:hidden"[\s\S]{0,800}defaultIndex=\{-1\}/,
  );
  assert.match(client, /hidden max-w-full flex-wrap[\s\S]{0,120}sm:flex/);
  assert.match(client, /icon: IdCard/);
  assert.doesNotMatch(client, /icon: Mail/);
  assert.match(client, /icon: FileImage/);
  assert.match(client, /icon: Globe/);
  assert.doesNotMatch(client, /className="grid grid-cols-2 gap-3"/);
  assert.doesNotMatch(client, /rounded-\[1\.05rem\]/);
  assert.doesNotMatch(client, /max-w-\[22\.5rem\]/);
  assert.doesNotMatch(client, /rounded-\[1\.85rem\]/);
  assert.doesNotMatch(client, /bg-\[linear-gradient\(135deg,#432577,#9151d8_50%,#d45aa7\)\]/);
  assert.doesNotMatch(client, /min-h-\[5\.25rem\]/);
  assert.doesNotMatch(client, /md:min-h-\[6\.4rem\]/);
  assert.doesNotMatch(client, /min-h-\[2\.05rem\]/);
  assert.doesNotMatch(client, /grid grid-cols-3 gap-1/);
  assert.match(client, /Live Card/);
  assert.match(client, /Flyer\/Invitation/);
  assert.match(client, /prompt: "Create a flyer invitation"/);
  assert.match(client, /Event Page/);
  assert.doesNotMatch(client, /label: "Invitation"/);
  assert.ok(
    client.indexOf('label: "Live Card"') < client.indexOf('label: "Flyer/Invitation"') &&
      client.indexOf('label: "Flyer/Invitation"') < client.indexOf('label: "Event Page"'),
  );
  assert.doesNotMatch(client, /ProductOptionIcon/);
  assert.doesNotMatch(client, /<Mail className="size-4"/);
  assert.match(bottomNav, /export function BottomNavBar/);
  assert.match(bottomNav, /const MOBILE_LABEL_WIDTH = 72/);
  assert.match(bottomNav, /min-w-\[320px\]/);
  assert.match(bottomNav, /rounded-full/);
  assert.match(bottomNav, /bg-\[#ede8f7\]/);
  assert.match(bottomNav, /text-\[#4b3674\]/);
  assert.match(bottomNav, /text-\[#6d5a8e\]/);
  assert.match(bottomNav, /activeValue\?: string/);
  assert.match(bottomNav, /const isActiveValueControlled = activeValue !== undefined/);
  assert.match(bottomNav, /isActiveValueControlled \? controlledIndex : activeIndex/);
  assert.match(bottomNav, /autoOpenOnMount\?: boolean/);
  assert.match(bottomNav, /autoOpenIntervalMs\?: number/);
  assert.match(bottomNav, /const \[autoOpenIndex, setAutoOpenIndex\]/);
  assert.match(bottomNav, /setAutoOpenIndex\(nextIndex\)/);
  assert.match(bottomNav, /Math\.max\(autoOpenIntervalMs, 500\)/);
  assert.match(bottomNav, /setHasManualSelection\(true\)/);
  assert.match(bottomNav, /onValueChange\?:/);
  assert.match(bottomNav, /aria-pressed=\{isActive\}/);
  assert.match(uiDemo, /import BottomNavBar from "@\/components\/ui\/bottom-nav-bar"/);
  assert.match(uiDemo, /return <BottomNavBar \/>/);

  assert.match(client, /window\.addEventListener\("envitefy:chat:new", handleNewChatSession\)/);
  assert.doesNotMatch(client, /CreationThreadSummary/);
  assert.doesNotMatch(client, /CreationThreadsResponse/);
  assert.doesNotMatch(client, /fetch\("\/api\/creation\/threads"/);
  assert.doesNotMatch(client, /fetch\(`\/api\/creation\/threads\/\$\{encodeURIComponent\(id\)\}`/);
  assert.doesNotMatch(client, /Recent Chats/);
  assert.doesNotMatch(client, /isSidebarOpen/);
  assert.doesNotMatch(client, /isSidebarCollapsed/);
  assert.match(client, /useRouter/);
  assert.doesNotMatch(client, /router\.push\(`\/chat\?thread=/);

  assert.match(client, /fetch\("\/api\/creation\/intake"/);
  assert.match(client, /CREATION_INTAKE_STREAM_URL = "\/api\/creation\/intake\/stream"/);
  assert.match(client, /readConciergeIntakeStream/);
  assert.match(client, /assistant_delta/);
  assert.match(client, /withConciergeTiming\(CREATION_INTAKE_STREAM_URL\)/);
  assert.match(client, /CreationSessionResumeResponse/);
  assert.match(client, /useSearchParams/);
  assert.match(client, /const threadId = searchParams\.get\("thread"\)/);
  assert.match(client, /restoreThread/);
  assert.match(client, /\/api\/creation\/intake\?threadId=/);
  assert.match(client, /setDraft\(restoredDraft\)/);
  assert.match(client, /CreationChatMessageSnapshot/);
  assert.match(client, /chatMessageFromSnapshot/);
  assert.match(client, /chatMessagesForPersistence/);
  assert.match(client, /json\.chatMessages\?\.length/);
  assert.match(client, /chatMessages: chatMessagesForPersistence/);
  assert.match(client, /FailedConciergeRequest/);
  assert.match(client, /setFailedRequest\(\{ \.\.\.params, error: errorMessage \}\)/);
  assert.match(client, /Try again/);
  assert.match(client, /activeContext: ConciergeActiveContext/);
  assert.match(client, /currentEventId: liveCardEventId/);
  assert.doesNotMatch(client, /setSuggestedReplies/);
  assert.doesNotMatch(client, /handleSuggestedReply/);
  assert.doesNotMatch(client, /suggestedReplies/);
  assert.doesNotMatch(client, /shouldShowSuggestedReplies/);
  assert.doesNotMatch(client, /detectedSourceIntent/);
  assert.match(preview, /weatherContext: ConciergeWeatherContext \| null/);
  assert.match(preview, /Umbrella/);

  assert.match(client, /type ConciergePhase =/);
  assert.match(client, /"ready_to_generate"/);
  assert.match(client, /"generating_card"/);
  assert.match(client, /"card_ready"/);
  assert.match(appShell, /const isChatPath = pathname\.replace\(\/\\\/\+\$\/, ""\) === "\/chat"/);
  assert.match(appShell, /className=\{isChatPath \? "h-\[100dvh\] overflow-hidden" : ""\}/);
  assert.match(client, /className="flex h-full min-h-0 w-full overflow-hidden/);
  assert.match(
    client,
    /className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"/,
  );
  assert.doesNotMatch(client, /relative flex min-h-screen min-w-0 flex-1 flex-col overflow-y-auto/);
  assert.match(client, /shouldShowProductPanel/);
  assert.match(client, /Boolean\(draft\)/);
  assert.match(client, /mobileView/);
  assert.match(client, /const isEmptyState =/);
  assert.match(client, /className="min-h-0 flex-1 overflow-y-auto/);
  assert.match(client, /setMobileView\("preview"\)/);
  assert.match(chatSurface, /Preview/);
  assert.doesNotMatch(chatSurface, /Chat builds the product here/);
  assert.doesNotMatch(preview, /statusLabel/);
  assert.doesNotMatch(preview, /statusClassName/);
  const blockedOldProductLabelPattern = new RegExp("Work" + "space");
  assert.doesNotMatch(chatSurface, blockedOldProductLabelPattern);
  assert.doesNotMatch(chatSurface, /Share preview/);
  assert.doesNotMatch(chatSurface, /More preview actions/);
  assert.doesNotMatch(chatSurface, /Share2/);
  assert.doesNotMatch(chatSurface, /MoreVertical/);
  assert.doesNotMatch(client, /label: "Invitation"/);
  assert.doesNotMatch(
    chatSurface,
    /grid grid-cols-2[\s\S]{0,700}setPreviewTab\("rsvp"\)[\s\S]{0,250}>\s*RSVP\s*</,
  );
  assert.doesNotMatch(chatSurface, /Guest List/);
  assert.match(client, /\/api\/events\/\$\{encodeURIComponent\(eventId\)\}\/rsvp/);
  assert.match(client, /rsvpPreview\.stats\.yes/);
  assert.match(client, /rsvpPreview\.responses\.map/);
  assert.match(client, /function generatedProductHref/);
  assert.match(client, /buildEventProductPath\(\{ eventId, output: selectedOutput \}\)/);
  assert.doesNotMatch(client, /withGeneratedInviteOutputs/);
  assert.doesNotMatch(
    client,
    /new Set<RequestedOutput>\(\[\.\.\.draft\.requestedOutputs, "live_card", "invitation"\]\)/,
  );
  assert.match(client, /draft: productDraft/);
  assert.doesNotMatch(preview, /Generate invite/);
  assert.match(
    client,
    /const shouldShowReadyActions =[\s\S]{0,140}\(canGenerateProduct \|\| isGeneratingCard\)[\s\S]{0,120}!isReadyChatComposerOpen \|\| isGeneratingCard/,
  );
  assert.match(client, /Keep chatting/);
  assert.match(client, /disabled=\{isGeneratingCard \|\| !canGenerateProduct\}/);
  assert.match(client, /<Loader2 className="size-4 shrink-0 animate-spin"/);
  assert.match(client, /isGeneratingCard \? "Generating" : "Generate"/);
  assert.match(client, /shouldShowReadyActions \? readyActions : composer/);
  assert.doesNotMatch(preview, /w-auto max-w-full/);
  assert.match(preview, /top-\[calc\(100%\+0\.5rem\)\]/);
  assert.match(preview, /pb-\[calc\(env\(safe-area-inset-bottom\)\+1rem\)\]/);
  assert.match(preview, /flex w-full flex-none items-center justify-center/);
  assert.match(preview, /relative aspect-\[9\/16\] w-full max-w-\[22rem\] sm:max-w-\[23rem\]/);
  assert.match(preview, /min-h-\[4\.75rem\] justify-end/);
  assert.doesNotMatch(preview, /pb-24/);
  assert.doesNotMatch(chatSurface, /Manage/);
  assert.doesNotMatch(chatSurface, blockedOldProductLabelPattern);
  assert.doesNotMatch(chatSurface, /Regenerate version/);
  assert.match(chatSurface, /Open Live Card/);
  assert.match(chatSurface, /Open Flyer\/Invitation/);
  assert.match(preview, /bg-\[#3b2468\]/);
  assert.doesNotMatch(chatSurface, blockedOldProductLabelPattern);
  assert.match(client, /sendGeneratedCardEdit/);
  assert.match(client, /fetch\(`\/api\/concierge\/events\/\$\{liveCardEventId\}\/message`/);

  assert.match(client, /savePendingSnapUpload/);
  assert.match(client, /createClientAttemptId\("scan"\)/);
  assert.match(client, /validateClientUploadFile\(file, "attachment"\)/);
  assert.match(client, /router\.push\("\/\?action=upload"\)/);
  assert.match(client, /area: "snap-upload"/);
  assert.match(client, /accept=\{getUploadAcceptAttribute\("header"\)\}/);
  assert.match(client, /onClick=\{openSnapUploadPicker\}/);
  assert.match(client, /onClick=\{openSnapCameraPicker\}/);
  assert.match(client, /Preparing upload/);
  assert.doesNotMatch(client, /NEXT_PUBLIC_CONCIERGE_FAST_UPLOADS/);
  assert.doesNotMatch(client, /FAST_UPLOAD_OCR_URL/);
  assert.doesNotMatch(client, /DEFAULT_UPLOAD_OCR_URL/);
  assert.doesNotMatch(client, /ENABLE_FAST_UPLOAD_OCR/);
  assert.match(client, /aria-label="Upload file"/);
  assert.match(client, /aria-label="Use camera"/);
  assert.match(client, /bg-\[#fbf9ff\]/);
  assert.match(client, /border-\[#d8caff\]/);
  assert.match(client, /!text-\[#25183a\]/);
  assert.match(client, /!placeholder:text-\[#8b7ca6\]/);
  assert.match(client, /caret-\[#7c4dff\]/);
  assert.match(client, /inline-flex h-9 w-9/);
  assert.match(client, /\(input\.trim\(\) \|\| isListening\) && "text-\[#7c4dff\]"/);
  assert.match(client, /<Mic\s+className="size-6 text-current"/);
  assert.match(client, /<ArrowUp\s+className="size-6 text-current"/);
  assert.match(bottomNav, /aria-label=\{item\.label\}/);
  assert.doesNotMatch(client, /choiceClassName/);
  assert.doesNotMatch(client, /choiceIconClassName/);
  assert.match(client, /<Paperclip className="size-6"/);
  assert.match(client, /<Camera className="size-6"/);
  assert.match(client, /Concierge is thinking\.\.\./);
  assert.match(client, /isThinking && "animate-pulse"/);
  assert.match(client, /isThinking \? null : \(/);
  assert.match(client, /message\.type !== "upload_status" && !message\.text\.trim\(\)/);
  assert.match(client, /if \(!value\) return/);
  assert.doesNotMatch(client, /Choose Live card, Flyer \/ Invite, or Event page first/);
  assert.doesNotMatch(client, /mobileComposerSpacer/);
  assert.doesNotMatch(client, /composerBottomPadding/);
  assert.doesNotMatch(client, /md:fixed/);
  assert.doesNotMatch(client, /PanelTopDashed/);
  assert.doesNotMatch(client, /PartyFlyerIcon/);
  assert.doesNotMatch(client, /LandingPageIcon/);
  assert.doesNotMatch(client, /bg-\[#1F2023\]/);
  assert.doesNotMatch(client, /border-\[#444444\]/);
  assert.doesNotMatch(client, /placeholder:text-\[#9CA3AF\]/);
  assert.doesNotMatch(client, /bg-\[color:var\(--color-surface\)\]/);
  assert.doesNotMatch(client, /bg-\[color:var\(--color-primary\)\]/);
  assert.doesNotMatch(client, /aria-label=\{`Output: \$\{option\.label\}`\}/);
  assert.doesNotMatch(client, /isOutputLocked/);
  assert.doesNotMatch(client, /aria-label="Product menu"/);
  assert.doesNotMatch(client, /Choose output/);
  assert.doesNotMatch(client, /Add source/);
  assert.doesNotMatch(client, /setIsProductMenuOpen/);
  assert.doesNotMatch(client, /Suggest date/);
  assert.doesNotMatch(client, /My place/);
  assert.doesNotMatch(client, /Make it elegant/);

  assert.match(client, /action: "save"/);
  assert.match(client, /persistSession: true/);
  assert.doesNotMatch(client, /await generateProductForDraft\(json\.draft\)/);
  assert.doesNotMatch(client, /fetch\("\/api\/history"/);
  assert.doesNotMatch(client, /buildConciergeHistoryPayload\(draft\)/);
  assert.doesNotMatch(client, /@google\/genai/);
  assert.doesNotMatch(client, /GEMINI_API_KEY/);
  assert.doesNotMatch(client, /GoogleGenAI/);

  assert.match(extract, /import OpenAI from "openai";/);
  assert.match(extract, /process\.env\.OPENAI_API_KEY/);
  assert.match(extract, /client\.chat\.completions\.create/);
  assert.match(eventActions, /import OpenAI from "openai";/);
  assert.match(eventActions, /process\.env\.OPENAI_API_KEY/);
});

test("/chat live-card preview preserves RSVP and registry action metadata", () => {
  const adapter = readSource("src/app/chat/chat-preview-adapters.ts");
  const preview = readSource("src/app/chat/ChatProductPreview.tsx");

  assert.match(adapter, /const rsvpEnabled = draft\?\.rsvpEnabled === true;/);
  assert.match(adapter, /eventId: args\.eventId \|\| ""/);
  assert.match(adapter, /rsvpEnabled,/);
  assert.match(adapter, /rsvpMode: rsvpEnabled \? "envitefy" : ""/);
  assert.match(
    adapter,
    /rsvpUrl: rsvpEnabled && args\.sharePath \? `\$\{args\.sharePath\}#event-rsvp` : ""/,
  );
  assert.match(adapter, /registryLink: registryLink \|\| ""/);
  assert.match(preview, /const hasRsvp = draft\?\.rsvpEnabled === true;/);
  assert.match(
    preview,
    /const hasRegistry = Boolean\(draft\?\.registryLink \|\| draft\?\.giftRegistryLink\);/,
  );
  assert.match(preview, /\["Yes", "No", "Maybe"\]\.map/);
  assert.match(preview, /<Menu className="size-3\.5"/);
  assert.match(preview, />Details</);
});

test("/cht typo route is not present", () => {
  assert.equal(fs.existsSync(path.join(repoRoot, "src/app/cht/page.tsx")), false);
});

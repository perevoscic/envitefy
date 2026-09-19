import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("/chat redirects signed-out visitors to the main page", () => {
  const page = readSource("src/app/chat/page.tsx");

  assert.match(page, /getServerSession\(authOptions\)/);
  assert.match(page, /if \(!session\?\.user\) return null;/);
  assert.match(page, /if \(!profile\) redirect\("\/"\);/);
});

test("/chat is the OpenAI-backed concierge creator", () => {
  const appShell = readSource("src/app/AppShell.tsx");
  const page = readSource("src/app/chat/page.tsx");
  const client = readSource("src/app/chat/ConciergeChatClient.tsx");
  const preview = readSource("src/app/chat/ChatProductPreview.tsx");
  const snapPage = readSource("src/app/snap/page.tsx");
  const snapLaunchCards = readSource("src/app/event/SnapLaunchCards.tsx");
  const skins = readSource("src/lib/concierge/skins.ts");
  const sidebar = readSource("src/app/left-sidebar.tsx");
  const sidebarController = readSource("src/app/left-sidebar.controller.ts");
  const chatSurface = `${client}\n${preview}`;
  const liveCardSurface = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");
  const bottomNav = readSource("src/components/ui/bottom-nav-bar.tsx");
  const uiDemo = readSource("src/components/ui/demo.tsx");
  const extract = readSource("src/lib/concierge/extract.ts");
  const eventActions = readSource("src/lib/concierge/event-actions.ts");

  assert.match(page, /ConciergeChatClient/);
  assert.match(page, /getServerSession\(authOptions\)/);
  assert.match(page, /getUserByEmail\(email\)/);
  assert.match(page, /userInitials=\{userInitials\}/);
  assert.match(page, /profileInitialsFrom/);
  assert.doesNotMatch(page, /isAdmin/);
  assert.doesNotMatch(page, /notFound\(/);

  assert.match(client, /What are we celebrating\?/);
  assert.match(client, /DETAIL_CONFIRMATION_LINE/);
  assert.match(client, /RSVP\(\?: guest count\| by\| deadline\| line\)\?/);
  assert.match(client, /function draftVisualDirection\(draft: ConciergeEventDraft, fallback: string\)/);
  assert.match(client, /tone\.toLowerCase\(\)\.includes\(theme\.toLowerCase\(\)\) \? tone : `\$\{theme\}\. \$\{tone\}`/);
  assert.doesNotMatch(client, /const theme = stringValue\(draft\.theme\) \|\| stringValue\(draft\.tone\)/);
  assert.match(
    client,
    /themeValue && !\/\\btheme\$\/i\.test\(themeValue\) \? `\$\{themeValue\} theme` : null/,
  );
  assert.doesNotMatch(client, /userFirstName\?: string \| null/);
  assert.match(client, /userInitials\?: string \| null/);
  assert.match(client, /buildInitialAssistantPrompt/);
  assert.match(client, /function UserChatAvatar/);
  assert.match(client, /userConciergeLogo/);
  assert.match(client, /<UserChatAvatar initials=\{userAvatarInitials\}/);
  assert.doesNotMatch(client, /Hi \$\{cleaned\}, what are we celebrating\?/);
  assert.doesNotMatch(client, /<span>What are we<\/span>/);
  assert.doesNotMatch(client, /<br \/>/);
  assert.doesNotMatch(client, /<span>celebrating\?<\/span>/);
  assert.match(client, /isOpeningAssistantPrompt/);

  assert.match(client, /sm:text-4xl/);

  assert.match(client, /STUDIO_CATEGORY_TILES/);

  assert.match(client, /I can't post to your social accounts/);
  assert.match(client, /prepare the event link and message/);
  assert.doesNotMatch(client, /short video brief/);
  assert.doesNotMatch(client, /Upload or snap an invite/);
  assert.match(snapPage, /AuthenticatedSnapUploadStart/);
  assert.match(snapPage, /SnapLaunchCards/);
  assert.match(snapLaunchCards, /Snap flyer/);
  assert.match(snapLaunchCards, /Upload file/);
  assert.match(client, /Tell me what you're planning/);
  assert.match(client, /Ask a question or change a detail/);
  assert.doesNotMatch(client, /Describe what you're planning/);
  assert.doesNotMatch(client, /Choose a format or describe what you need/);
  assert.match(client, /\[&::placeholder\]:text-\[0\.82rem\]/);
  assert.doesNotMatch(client, /AI reads the image first/);
  assert.match(client, /selectedSkinLabel/);
  assert.match(skins, /function skinLabelForCategoryName/);

  assert.doesNotMatch(preview, /Skin:/);
  assert.match(sidebar, /Snap \/ Upload/);
  assert.match(sidebar, /isSnapUploadStartActive/);
  assert.match(sidebarController, /router\.push\("\/snap"\)/);

  assert.doesNotMatch(client, /Birthday live card/);
  assert.doesNotMatch(client, /Wedding invitation/);
  assert.doesNotMatch(client, /Baby shower invite/);
  assert.doesNotMatch(client, /Game event page/);
  assert.doesNotMatch(client, /Bridal shower invite/);
  assert.doesNotMatch(client, /Something else/);
  assert.doesNotMatch(client, /handleCustomCategoryPrompt/);
  assert.doesNotMatch(client, /COMPOSER_TEXTAREA_ID/);
  assert.doesNotMatch(client, /Watch party invite/);

  assert.doesNotMatch(client, /Upload invite or photo/);
  assert.doesNotMatch(client, /CHAT_STUDIO_GRID_COMPOSITION/);
  assert.doesNotMatch(client, /ChatStudioStarterGrid/);
  assert.doesNotMatch(client, /auto-rows-\[92px\]/);
  assert.doesNotMatch(client, /sm:auto-rows-\[130px\]/);
  assert.doesNotMatch(client, /md:auto-rows-\[155px\]/);

  assert.doesNotMatch(client, /Choose a category and product to start/);
  assert.doesNotMatch(client, /Upload Your Invite/);
  assert.match(client, /PRODUCT_OPTIONS/);
  assert.doesNotMatch(client, /CATEGORY_OPTIONS/);
  assert.doesNotMatch(client, /categorySelectValueFromDraft/);
  assert.doesNotMatch(client, /handleCategoryChange/);
  assert.doesNotMatch(client, /Set the event category to/);
  assert.doesNotMatch(client, /Inferred category/);
  assert.match(client, /gym_meet: "Game Day"/);
  assert.doesNotMatch(preview, /Details captured/);
  assert.doesNotMatch(preview, /isMobileDetailsOpen/);
  assert.doesNotMatch(preview, /aria-expanded=\{isMobileDetailsOpen\}/);

  assert.doesNotMatch(preview, /function ChatInvitationPreview/);

  assert.match(
    preview,
    /selectedOutput === "digital_flyer"[\s\S]{0,140}selectedOutput === "printable_flyer"[\s\S]{0,140}selectedOutput === "invitation"/,
  );
  assert.doesNotMatch(preview, /Open Invitation/);
  assert.match(preview, /if \(selectedOutput === "event_page"\)/);

  assert.match(preview, /publicActionLabelForOutput/);
  assert.match(preview, /selectedOutput === "event_page"\) return "Open Event Page"/);
  assert.doesNotMatch(preview, /Placeholder preview/);

  assert.match(preview, /Published preview: open the link to review what guests will see\./);
  assert.doesNotMatch(preview, /isCategoryMenuOpen/);
  assert.doesNotMatch(preview, /title=\{`Category: \$\{categoryLabel\}`\}/);
  assert.doesNotMatch(client, /PRODUCT_CHOICE_PROMPT/);
  assert.doesNotMatch(client, /"What kind of product would you like to create\?"/);
  assert.doesNotMatch(client, /const shouldShowComposerProductOptions = !liveCardEventId/);
  assert.doesNotMatch(client, /shouldShowComposerProductOptions/);
  assert.match(client, /setSelectedProductOutput\(option\.output\)/);
  assert.match(client, /function updateComposerSelection/);
  assert.match(client, /function selectionPrefix/);
  assert.match(client, /const \[isComposerFocused, setIsComposerFocused\]/);
  assert.match(client, /const isCompactEmptyComposer =/);

  assert.match(client, /"Tell me what you're planning\.\.\."/);
  assert.match(client, /onFocus=\{\(\) => setIsComposerFocused\(true\)\}/);
  assert.match(client, /onBlur=\{\(\) => setIsComposerFocused\(false\)\}/);

  assert.match(client, /setInput\(\(current\) =>/);
  assert.match(client, /function handleComposerValueChange\(nextValue: string\)/);

  assert.match(client, /onValueChange=\{handleComposerValueChange\}/);

  assert.match(client, /"min-h-\[44px\] min-w-0 flex-1/);
  assert.match(client, /focusComposerAtEnd/);
  assert.doesNotMatch(
    client,
    /function updateComposerSelection[\s\S]{0,700}focusComposerAtEnd\(\)/,
  );
  assert.match(client, /updateComposerSelection\(\)/);
  assert.match(client, /const draftRequestedOutputs = draft\?\.requestedOutputs\?\.length/);
  assert.match(client, /const shouldPreserveDraftOutputs =/);
  assert.match(client, /shouldPreserveDraftOutputs\s*\?\s*draftRequestedOutputs/);
  assert.match(client, /selectedProductOutput\s*\?\s*\[selectedProductOutput\]/);
  assert.doesNotMatch(client, /message: option\.prompt/);
  assert.doesNotMatch(client, /requestedOutputs: \[option\.output\]/);
  assert.match(client, /role="group"/);
  assert.match(client, /selectedProductOutput === option\.output/);
  assert.doesNotMatch(client, /effectiveSelectedProductOutput === option\.output/);

  assert.match(client, /text-\[#5c5be5\]/);

  assert.doesNotMatch(client, /pb-44/);

  assert.match(client, /icon: IdCard/);
  assert.doesNotMatch(client, /icon: Mail/);
  assert.match(client, /icon: FileImage/);
  assert.match(client, /icon: Globe/);
  assert.doesNotMatch(client, /label: "RSVP Page"/);
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
  assert.match(bottomNav, /labelWidth\?: number/);
  assert.match(bottomNav, /min-w-0 max-w-\[95vw\]/);
  assert.match(bottomNav, /spreadItems && "w-full justify-between"/);
  assert.match(bottomNav, /h-11 min-h-11 min-w-11 items-center/);

  assert.match(bottomNav, /rounded-full/);
  assert.match(bottomNav, /bottomNavActiveUnderline/);
  assert.match(bottomNav, /bg-\[#eff1f8\]/);
  assert.match(bottomNav, /shadow-\[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff\]/);
  assert.match(bottomNav, /text-\[#5c5be5\]/);
  assert.match(bottomNav, /bg-\[#5c5be5\] opacity-40/);
  assert.match(bottomNav, /text-\[#747684\]/);
  assert.match(bottomNav, /activeValue\?: string/);
  assert.match(bottomNav, /spreadItems\?: boolean/);
  assert.match(bottomNav, /spreadItems = false/);

  assert.match(bottomNav, /const activeLabelWidth = item\.labelWidth \?\? MOBILE_LABEL_WIDTH/);

  assert.match(bottomNav, /const isActiveValueControlled = activeValue !== undefined/);
  assert.match(bottomNav, /isActiveValueControlled \? controlledIndex : activeIndex/);
  assert.match(bottomNav, /autoOpenOnMount\?: boolean/);
  assert.match(bottomNav, /autoOpenIntervalMs\?: number/);
  assert.match(bottomNav, /autoOpenCycles\?: number/);
  assert.match(bottomNav, /const \[autoOpenIndex, setAutoOpenIndex\]/);
  assert.match(bottomNav, /const expandedIndex = autoOpenIndex \?\? resolvedActiveIndex/);
  assert.match(bottomNav, /const startIndex = safeDefaultIndex >= 0 \? safeDefaultIndex : 0/);
  assert.match(bottomNav, /const isExpanded = expandedIndex === idx/);
  assert.match(bottomNav, /const maxDisplays = items\.length \* Math\.max\(autoOpenCycles, 1\)/);
  assert.match(bottomNav, /setAutoOpenIndex\(nextIndex\)/);
  assert.doesNotMatch(bottomNav, /setActiveIndex\(nextIndex\)/);
  assert.match(bottomNav, /width: isExpanded \? `\$\{activeLabelWidth\}px` : "0px"/);
  assert.match(bottomNav, /Math\.max\(autoOpenIntervalMs, 500\)/);
  assert.match(bottomNav, /setHasManualSelection\(true\)/);
  assert.match(bottomNav, /onValueChange\?:/);
  assert.match(bottomNav, /aria-pressed=\{isActive\}/);
  assert.match(uiDemo, /import \{ Testimonial \} from "@\/components\/ui\/design-testimonial"/);
  assert.match(uiDemo, /<Testimonial \/>/);

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
  assert.match(client, /function chatMessagesFromSnapshots/);
  assert.match(client, /preserveLastAssistantId: streamAssistantId/);
  assert.match(client, /id: preserveLastAssistantId/);
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
  assert.match(preview, /weatherContext: ConciergeWeatherContext \| null/);
  assert.doesNotMatch(preview, /Umbrella/);

  assert.match(client, /type ConciergePhase =/);
  assert.match(client, /"ready_to_generate"/);
  assert.match(client, /"generating_card"/);
  assert.match(client, /"card_ready"/);
  assert.match(appShell, /const isChatPath = pathname\.replace\(\/\\\/\+\$\/, ""\) === "\/chat"/);
  assert.match(appShell, /className=\{isChatPath \? "h-\[100dvh\] overflow-hidden" : ""\}/);

  assert.match(client, /className="flex h-full min-h-0 w-full overflow-hidden/);
  assert.match(client, /--envitefy-chat-layout-height/);
  assert.match(client, /--envitefy-chat-keyboard-inset/);

  assert.doesNotMatch(client, /--envitefy-chat-viewport-height/);
  assert.doesNotMatch(client, /window\.visualViewport\?\.height \|\| window\.innerHeight/);

  assert.match(
    client,
    /className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"/,
  );
  assert.doesNotMatch(client, /relative flex min-h-screen min-w-0 flex-1 flex-col overflow-y-auto/);
  assert.match(client, /shouldShowProductPanel/);
  assert.match(client, /hasGeneratedDraftProduct/);
  assert.doesNotMatch(
    client,
    /const shouldShowProductPanel =[\s\S]{0,120}Boolean\(draft\)/,
  );
  assert.match(client, /isBusy && !isUploading && !isGeneratingCard && !isStreamingAssistant/);
  assert.match(client, /mobileView/);
  assert.match(client, /const isEmptyState =/);
  assert.match(client, /"min-h-0 flex-1 overflow-y-auto/);
  assert.match(client, /setMobileView\("preview"\)/);
  assert.match(chatSurface, /Preview/);
  assert.doesNotMatch(chatSurface, /Chat builds the product here/);
  assert.doesNotMatch(preview, /statusLabel/);
  assert.doesNotMatch(preview, /statusClassName/);

  assert.doesNotMatch(chatSurface, /Share preview/);
  assert.doesNotMatch(chatSurface, /More preview actions/);
  assert.doesNotMatch(chatSurface, />\s*Workspace\s*</);

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
  assert.match(client, /async function preloadGeneratedPreviewImage/);
  assert.match(client, /draftStudioInvite\?\.imageUrl \|\| generatedInviteImageUrl/);
  assert.match(client, /buildEventProductPath\(\{ eventId, output: selectedOutput \}\)/);
  assert.match(client, /params\.set\("preview", "owner"\)/);
  assert.match(client, /params\.set\("returnTo", returnHref\)/);
  assert.match(client, /function generatedRsvpDashboardHref/);
  assert.match(client, /buildEventPath\(eventId, null, \{ tab: "dashboard" \}\)/);
  assert.match(client, /const \[draftStudioInvite, setDraftStudioInvite\]/);
  assert.match(client, /const hasGeneratedDraftProduct = Boolean\(draftStudioInvite\);/);
  assert.match(client, /async function publishGeneratedDraft\(\)/);
  assert.match(client, /action: "save"[\s\S]{0,260}studioInvite: draftStudioInvite/);
  assert.match(client, /async function sendGeneratedDraftEdit\(message: string\)/);
  assert.match(client, /function isGeneratedDraftFullRedesignRequest\(message: string\)/);
  assert.match(client, /function buildGeneratedDraftFullRedesignPrompt\(userMessage: string\)/);
  assert.match(client, /const fullRedesign = isGeneratedDraftFullRedesignRequest\(trimmed\);/);
  assert.match(
    client,
    /const existingDraftImageUrl = draftStudioInvite\?\.imageUrl \|\| generatedInviteImageUrl;/,
  );
  assert.match(
    client,
    /sourceImageUrl: fullRedesign \? null : existingDraftImageUrl/,
  );
  assert.match(client, /previousDraft: fullRedesign \? null : draft/);
  assert.match(client, /I generated a completely new draft design from scratch/);
  assert.match(client, /sourceImageUrl \? "image" : "both"/);
  assert.match(client, /previousDraft: draft/);
  assert.match(client, /function buildGeneratedDraftImageEditPrompt/);
  assert.match(client, /localized correction to the current generated card/);
  assert.match(client, /modify only those characters inside the existing label/);

  assert.match(client, /function refreshGeneratedDraftInviteMetadata/);
  assert.match(client, /refreshLiveCardInvitationData\(details, existingInvite\.invitationData\)/);
  assert.match(client, /const canReuseCurrentImage =/);
  assert.match(client, /!shouldRegenerateGeneratedDraftImageForEdit/);
  assert.match(
    client,
    /canReuseCurrentImage && draftStudioInvite[\s\S]{0,120}refreshGeneratedDraftInviteMetadata/,
  );
  assert.match(client, /function additionalLocationNarrative/);
  assert.match(client, /Preserve the full event flow in the generated live card/);
  assert.match(client, /await preloadGeneratedPreviewImage\(studioInvite\.imageUrl\);/);
  assert.match(client, /if \(draftStudioInvite && !liveCardEventId\)/);
  assert.match(client, /function isAffirmativeReply/);
  assert.match(client, /function isGenerateConfirmationMessage/);
  assert.match(client, /\^\(generate\(\?:\\s\+\(\?:it\|now\)\)\?\|create it\|make it\)\$/);
  assert.match(
    client,
    /canGenerateProduct &&[\s\S]*?draft &&[\s\S]*?currentQuestion !== "date_confirmation"[\s\S]*?isGenerateConfirmationMessage\(value\)/,
  );
  assert.match(
    client,
    /setIsReadyChatComposerOpen\(false\);[\s\S]{0,80}await generateProductForDraft\(draft\)/,
  );
  assert.doesNotMatch(client, /withGeneratedInviteOutputs/);
  assert.doesNotMatch(
    client,
    /new Set<RequestedOutput>\(\[\.\.\.draft\.requestedOutputs, "live_card", "invitation"\]\)/,
  );
  assert.match(client, /draft: productDraft/);
  assert.doesNotMatch(preview, /Generate invite/);
  assert.match(
    client,
    /const hasReadyDraftProduct =[\s\S]{0,100}isReadyProductDraft\(draft\)[\s\S]{0,120}!liveCardEventId[\s\S]{0,120}!hasGeneratedDraftProduct/,
  );
  assert.match(client, /const canGenerateProduct =\s*hasReadyDraftProduct && !isBusy;/);
  assert.doesNotMatch(client, /shouldShowReadyActions/);
  assert.match(client, /const shouldShowGiftRegistryActions = shouldShowGiftRegistryPrompt/);
  assert.match(
    client,
    /setDraft\(\(current\) =>[\s\S]{0,180}\? \{ \.\.\.current, giftPromptDismissed: true \}/,
  );
  assert.match(client, /function optionalGiftQuestionText/);
  assert.match(client, /Optional:\\s\*\(do you have \[\^\?\\n\]\+\\\?\)/);
  assert.match(client, /Skip for now/);
  assert.doesNotMatch(client, /As an Amazon Associate/);
  assert.doesNotMatch(client, /Generate now still works without/);
  assert.match(client, /shouldShowReceivedInviteActions \? \(/);
  assert.match(client, /Event details stay locked to the upload/);
  assert.match(client, /Save invite/);
  assert.doesNotMatch(client, /ChatDraftReview|Review saved event details|Event planning details/);
  assert.match(client, /<Loader2 className="size-4 shrink-0 animate-spin"/);
  assert.doesNotMatch(client, /Generate draft preview|Review the design first/);
  assert.match(
    client,
    /shouldShowGiftRegistryActions \|\| shouldShowReceivedInviteActions[\s\S]{0,80}\? readyActions[\s\S]{0,80}: null\}[\s\S]{0,80}\{composer\}/,
  );
  assert.doesNotMatch(preview, /w-auto max-w-full/);
  assert.doesNotMatch(preview, /top-\[calc\(100%\+0\.5rem\)\]/);

  assert.doesNotMatch(preview, /pb-24/);
  assert.match(preview, /rsvpDashboardHref: string \| null;/);
  assert.match(preview, /hasDraftProduct: boolean;/);
  assert.match(preview, /const shouldShowDraftActions = hasDraftProduct && !publicHref;/);

  assert.doesNotMatch(preview, /Keep Editing/);
  assert.doesNotMatch(preview, /onKeepEditing/);
  assert.doesNotMatch(preview, /href=\{publicHref\}[\s\S]{0,140}target="_blank"/);
  assert.match(preview, /href=\{rsvpDashboardHref\}/);
  assert.doesNotMatch(preview, /href=\{rsvpDashboardHref\}[\s\S]{0,140}target="_blank"/);
  assert.match(preview, /Open Dashboard/);

  assert.doesNotMatch(preview, /w-full min-w-full max-w-none/);

  assert.match(liveCardSurface, /top-\[-2\.35rem\]/);
  assert.doesNotMatch(chatSurface, /Manage/);

  assert.doesNotMatch(chatSurface, /Regenerate version/);
  assert.match(chatSurface, /Open Live Card/);
  assert.match(chatSurface, /Open Flyer\/Invitation/);

  assert.match(client, /sendGeneratedCardEdit/);
  assert.match(client, /fetch\(`\/api\/concierge\/events\/\$\{liveCardEventId\}\/message`/);

  assert.match(client, /createClientAttemptId\("scan"\)/);
  assert.match(snapLaunchCards, /createClientAttemptId\("scan"\)/);
  assert.match(client, /validateClientUploadFile\(file, "attachment"\)/);
  assert.match(snapLaunchCards, /validateClientUploadFile\(file, "attachment"\)/);
  assert.doesNotMatch(client, /shouldUseConciergeUploadFlow/);
  assert.doesNotMatch(client, /createScannedEventPageFromUpload/);
  assert.doesNotMatch(client, /fetch\("\/api\/scan\/event-page"/);
  assert.doesNotMatch(client, /router\.push\(created\.eventPath\)/);

  assert.doesNotMatch(client, /updateGeneratedDraftImageFromUpload\(file, scanAttemptId\)/);
  assert.doesNotMatch(client, /sourceImageUrl: uploadedImageUrl/);
  assert.doesNotMatch(client, /autoPublishEventPage/);
  assert.doesNotMatch(client, /publishScannedEventPageDraft/);
  assert.doesNotMatch(client, /router\.push\(buildEventPath\(savedEventId/);
  assert.doesNotMatch(client, /shouldHidePendingScanPlaceholder/);
  assert.doesNotMatch(client, /!shouldHidePendingScanPlaceholder &&/);
  assert.doesNotMatch(client, /savePendingSnapUpload/);
  assert.doesNotMatch(client, /router\.push\("\/\?action=upload"\)/);
  assert.match(snapLaunchCards, /savePendingSnapUpload/);
  assert.match(snapLaunchCards, /uploadActionHref = "\/\?action=upload"/);
  assert.match(snapLaunchCards, /router\.push\(uploadActionHref\)/);
  assert.match(snapLaunchCards, /area: "snap-upload"/);
  assert.doesNotMatch(client, /stage: "scan-event-page-created"/);
  assert.match(snapLaunchCards, /accept=\{getUploadAcceptAttribute\("header"\)\}/);
  assert.match(client, /openSnapUploadPicker/);
  assert.doesNotMatch(client, /openSnapCameraPicker/);
  assert.doesNotMatch(client, /NEXT_PUBLIC_CONCIERGE_FAST_UPLOADS/);
  assert.doesNotMatch(client, /FAST_UPLOAD_OCR_URL/);
  assert.doesNotMatch(client, /DEFAULT_UPLOAD_OCR_URL/);
  assert.doesNotMatch(client, /ENABLE_FAST_UPLOAD_OCR/);
  assert.doesNotMatch(client, /aria-label="Upload invite image"/);
  assert.doesNotMatch(client, /aria-label="Snap invite photo"/);
  assert.match(snapLaunchCards, /Upload file/);
  assert.match(snapLaunchCards, /Snap flyer/);
  assert.doesNotMatch(client, /tooltip="Upload file"/);
  assert.doesNotMatch(client, /tooltip="Use camera"/);
  assert.match(client, /bg-\[#fbf9ff\]/);
  assert.match(client, /border-\[#d8caff\]/);
  assert.match(client, /!text-\[#25183a\]/);
  assert.match(client, /!placeholder:text-\[#8b7ca6\]/);
  assert.match(client, /caret-\[#5c5be5\]/);

  assert.match(bottomNav, /aria-label=\{item\.label\}/);
  assert.doesNotMatch(client, /choiceClassName/);
  assert.doesNotMatch(client, /choiceIconClassName/);
  assert.doesNotMatch(client, /<Paperclip/);
  assert.doesNotMatch(client, /<Camera/);
  assert.match(client, /Envitefy Create is thinking\.\.\./);
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
  assert.match(adapter, /function normalizeAdditionalLocations/);
  assert.match(adapter, /additionalLocations,/);
  assert.match(
    adapter,
    /rsvpUrl: rsvpEnabled && args\.sharePath \? `\$\{args\.sharePath\}#event-rsvp` : ""/,
  );
  assert.match(adapter, /registryLink: registryLink \|\| ""/);

});

test("/chat preview uses real generation stages and keeps streamed artwork visible", () => {
  const client = readSource("src/app/chat/ConciergeChatClient.tsx");
  const preview = readSource("src/app/chat/ChatProductPreview.tsx");

  assert.match(client, /GENERATION_STAGE_LABELS/);
  assert.match(client, /const isUpdatingPreview = isEditingGeneratedCard && isSending;/);
  assert.doesNotMatch(client, /BUILDING_STEPS|PREVIEW_UPDATE_STEPS|setBuildProgress/);
  assert.match(client, /isGenerating=\{isGeneratingCard \|\| isUpdatingPreview\}/);
  assert.match(client, /currentBuildStep=\{GENERATION_STAGE_LABELS\[generationStage\]\}/);
  assert.match(client, /hasStreamingPreview=\{Boolean\(streamingPreviewImage\)\}/);
  assert.match(preview, /hasStreamingPreview/);
  assert.doesNotMatch(preview, /value=\{buildProgress\}/);
});

test("/chat reserves fullscreen device previews for event pages", () => {
  const preview = readSource("src/app/chat/ChatProductPreview.tsx");
  assert.match(preview, /const isEventPagePreview = selectedOutput === "event_page";/);
  assert.match(preview, /if \(!isPreviewOpen \|\| !isEventPagePreview\) return;/);
  assert.match(preview, /isEventPagePreview \? \(\s*<dialog[\s\S]*?<EventPreviewViewport/);
  const artworkPreview = preview.slice(preview.indexOf("<ArtworkPreviewDialog"));
  assert.match(artworkPreview, /open=\{isPreviewOpen\}/);
  assert.match(artworkPreview, /onShare=\{\(\) => void handleShare\(\)\}/);
  assert.match(artworkPreview, /<StudioShowcaseLiveCard[\s\S]*?previewMode/);
  assert.match(artworkPreview, /actionsPlacement="overlay"/);
  assert.match(artworkPreview, /<img src=\{previewImageUrl\}/);
  assert.doesNotMatch(artworkPreview, /EventPreviewViewport|<iframe|<dialog|fullscreen/);
});

test("/chat live-card preview overlays guest actions and keeps Preview and Publish at the bottom", () => {
  const preview = readSource("src/app/chat/ChatProductPreview.tsx");
  const dialog = readSource("src/components/ArtworkPreviewDialog.tsx");
  const dialogCss = readSource("src/components/ArtworkPreviewDialog.module.css");
  const liveCardPreview = preview.slice(preview.indexOf("{isLiveCard ? ("), preview.indexOf("{artworkNotice"));
  const previewActionsStart = preview.indexOf("const previewActions =");
  const previewActions = preview.slice(
    previewActionsStart,
    preview.indexOf("return (", previewActionsStart),
  );

  assert.match(liveCardPreview, /actionsPlacement="overlay"/);
  assert.doesNotMatch(liveCardPreview, /actionsPlacement="above"/);
  assert.doesNotMatch(previewActions, /Edit in chat/);
  assert.match(previewActions, />[\s\S]*?<span className="whitespace-nowrap">Preview<\/span>/);
  assert.match(previewActions, /\{isPublishing \? publishBusyLabel : publishActionLabel\}/);
  assert.match(preview, /\{previewActions\}/);
  assert.doesNotMatch(preview, /\{isLiveCard \? previewActions : null\}/);
  assert.match(dialog, /aria-label="Share"/);
  assert.match(dialog, /aria-label="Close preview"/);
  assert.match(dialogCss, /\.share \{\s*left: 12px;/);
  assert.match(dialogCss, /\.close \{\s*right: 12px;/);
  assert.doesNotMatch(dialogCss, /top: -52px/);
});

test("/cht typo route is not present", () => {
  assert.equal(fs.existsSync(path.join(repoRoot, "src/app/cht/page.tsx")), false);
});

test("/chat keeps product format choices on the starting screen", () => {
  const client = readSource("src/app/chat/ConciergeChatClient.tsx");
  const thread = client.slice(client.indexOf("  const chatThread = ("), client.indexOf("  const composer = ("));
  const composer = client.slice(client.indexOf("  const composer = ("), client.indexOf("  const readyActions = ("));
  assert.doesNotMatch(client, /BottomNavBar|shouldShowProductFormatTiles|chatProductNavItem/);
  assert.doesNotMatch(thread, /PRODUCT_OPTIONS|Choose product format/);
  assert.match(composer, /isEmptyState \? \([\s\S]*?aria-label="Choose product format"/);
  assert.match(composer, /PRODUCT_OPTIONS\.map/);
  assert.match(composer, /const isSelected = selectedProductOutput === option\.output/);
  assert.match(composer, /handleStarterProductChoice\(option\)/);
});

test("/chat infers event categories from text without a category popup", () => {
  const client = readSource("src/app/chat/ConciergeChatClient.tsx");
  const submit = client.slice(client.indexOf("  async function submitComposerInput()"), client.indexOf("  async function handleSubmit("));

  assert.doesNotMatch(client, /ChatCategoryMenu|CHAT_STARTER_PROMPTS|CELEBRATION_STARTER_TILES|selectedStarterCategory|Choose celebration category/);
  assert.match(client, /const selectedCategoryLabel =\s*categoryLabelForDraft\(draft\)/);
  assert.match(submit, /const typedValue = input\.trim\(\)/);
  assert.match(submit, /const value = typedValue \|\| selectionPrefix\(selectedCategoryLabel, selectedProductOutput\)/);
  assert.match(submit, /await sendToConcierge\(\{\s*message: value,/);
  assert.doesNotMatch(submit, /starter_category|starterCategory:/);
  assert.match(client, /skinLabelForCategoryName\(selectedCategoryLabel\) \|\| skinLabelForDraft\(draft\)/);
  assert.match(client, /const skinInstruction = draft\.theme \|\| draft\.tone \? ""/);
  assert.match(client, /optional style inspiration/);
});

test("/chat offers the signup gallery before upload, generation, or event editing", () => {
  const client = readSource("src/app/chat/ConciergeChatClient.tsx");
  const submit = client.slice(client.indexOf("  async function submitComposerInput()"), client.indexOf("  async function handleSubmit("));
  const handoff = submit.slice(submit.indexOf("    if (signupHandoff)"), submit.indexOf("    if (pendingChatUpload)"));

  assert.match(submit, /const signupHandoff = signupFormHandoff\(typedValue\)/);
  assert.match(handoff, /newMessage\("user", typedValue\)/);
  assert.match(handoff, /newMessage\("assistant", signupHandoff\)/);
  assert.match(handoff, /return;/);
  assert.doesNotMatch(handoff, /setDraft|setPendingChatUpload|generateProductForDraft|sendGeneratedDraftEdit|sendGeneratedCardEdit|saveChatProgress|fetch\(/);
  assert.match(client, /href=\{SIGNUP_FORM_GALLERY_HREF\}/);
  assert.match(client, /progress\.requestLeave\(\(\) => router\.push\(SIGNUP_FORM_GALLERY_HREF\)\)/);
  assert.match(client, /formatAssistantBubbleText\(message\.text, draft, openSignupFormGallery\)/);
});

test("/chat keeps a centered accessible composer with Send and no microphone or Cancel", () => {
  const client = readSource("src/app/chat/ConciergeChatClient.tsx");
  const composer = client.slice(client.indexOf("  const composer = ("), client.indexOf("  const readyActions = ("));

  assert.match(composer, /ref=\{composerCardRef\} className="pointer-events-auto relative mx-auto w-full max-w-3xl"/);
  assert.match(composer, /pb-\[max\(env\(safe-area-inset-bottom\),3rem\)\]/);
  assert.match(composer, /aria-label="Send"/);
  assert.match(composer, /disabled=\{isBusy \|\| !canSubmitComposer\}/);
  assert.match(composer, /inline-flex size-11 items-center justify-center/);
  assert.match(composer, /focus-visible:ring-2/);
  assert.match(composer, /<ArrowUp className="size-6"/);
  assert.doesNotMatch(composer, /<Mic|aria-label="Cancel"|Voice|isListening/);
  assert.match(client, /isEmptyState && !input\.trim\(\) && !isComposerFocused;/);
  assert.match(client, /const hasComposerSelection = Boolean\(selectedProductOutput\)/);
  assert.match(client, /const canSubmitComposer = Boolean\(input\.trim\(\) \|\| hasComposerSelection \|\| pendingChatUpload\)/);
  assert.match(client, /className="m-auto w-full max-w-3xl shrink-0 px-6 py-8 text-center"/);
});

test("/chat uses the shared viewport hook to fit the keyboard and restores scrolling", () => {
  const client = readSource("src/app/chat/ConciergeChatClient.tsx");
  const viewport = readSource("src/hooks/useVisualViewportInsets.ts");
  const appShell = readSource("src/app/AppShell.tsx");

  assert.match(client, /useVisualViewportInsets\(\{/);
  assert.match(client, /fitVisualViewport: true/);
  assert.match(client, /lockPageScroll: true/);
  assert.match(viewport, /const layoutHeight = window\.innerHeight/);
  assert.match(viewport, /const keyboardInset = Math\.max\(0, layoutHeight - visualHeight - visualTop\)/);
  assert.match(viewport, /root\.style\.overflow = previousRootOverflow/);
  assert.match(viewport, /body\.style\.overflow = previousBodyOverflow/);
  assert.match(appShell, /isChatPath \|\| isEventPreview \? null : <ConditionalFooter/);
});

test("/chat uses the interactive guest card and keeps artwork, publish, and share separate", () => {
  const preview = readSource("src/app/chat/ChatProductPreview.tsx");
  const client = readSource("src/app/chat/ConciergeChatClient.tsx");
  const artworkChange = readSource("src/lib/concierge/artwork-change.ts");

  assert.match(preview, /const liveCardPreview = buildChatShowcasePreview\(\{/);
  assert.match(preview, /<StudioShowcaseLiveCard\s+preview=\{liveCardPreview\}\s+previewMode/);
  assert.match(preview, /aria-label="Interactive guest preview"/);
  assert.match(preview, /inert=\{isGenerating\}/);
  assert.match(preview, /aria-label="Invitation artwork"/);
  assert.match(preview, /src=\{previewImageUrl\}/);
  assert.match(preview, /Draft preview: review the design here, then choose Publish when ready/);
  assert.match(preview, /publishActionLabel = "Publish"/);
  assert.match(preview, /onClick=\{onPublish\}/);
  assert.match(preview, /const hasShareAction = Boolean\(publicHref\)/);
  assert.match(preview, /\{!isLiveCard && hasShareAction \? \(/);
  assert.match(preview, /onClick=\{\(\) => void handleShare\(\)\}/);
  assert.match(preview, /navigator\.share\(sharePayload\)/);
  assert.match(preview, /navigator\.clipboard\.writeText\(url\)/);
  assert.match(client, /import \{ shouldRegenerateGeneratedDraftImageForEdit \} from "@\/lib\/concierge\/artwork-change"/);
  assert.match(artworkChange, /export function shouldRegenerateGeneratedDraftImageForEdit/);
  assert.match(artworkChange, /publicContentForDraft\(before\)\.requiredArtworkLines/);
});

test("/chat persists attached files only through the explicit progress save handler", () => {
  const client = readSource("src/app/chat/ConciergeChatClient.tsx");
  const saveProgress = client.slice(client.indexOf("  async function saveChatProgress("), client.indexOf("  async function generateProductForDraft("));

  assert.match(saveProgress, /uploadMediaFile\(\{ file: pendingChatUpload\.file, usage: "attachment" \}\)/);
  assert.match(saveProgress, /fetch\("\/api\/creation\/draft"/);
  assert.match(saveProgress, /method: "PUT"/);
  assert.match(saveProgress, /composerText: input/);
  assert.match(saveProgress, /chatMessages: chatMessagesForPersistence\(messages\)/);
});

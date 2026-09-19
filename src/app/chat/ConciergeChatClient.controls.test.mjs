import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { SIGNUP_FORM_GALLERY_HREF, signupFormHandoff } from "../../lib/concierge/signup-handoff.ts";

const source = fs.readFileSync(new URL("./ConciergeChatClient.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("chat.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function declaration(name) {
  let found;
  const visit = (node) => {
    if ((ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) && node.name?.getText(ast) === name) found = node;
    ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(found, `Missing ${name}`);
  return ts.isVariableDeclaration(found) ? `const ${found.getText(ast)};` : found.getText(ast);
}
function load(name, scope) {
  const code = ts.transpile(declaration(name), { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React });
  return new Function(...Object.keys(scope), `${code}; return ${name};`)(...Object.values(scope));
}
const noop = () => {};
const canUploadFlyerToOutput = load("canUploadFlyerToOutput", {});
function harness(overrides = {}) {
  const state = {
    messages: [
      { id: "user", role: "user", text: "Wedding at the beach" },
      { id: "partial", role: "assistant", text: "Let's plan it" },
      { id: "empty", role: "assistant", text: "" },
    ],
    draft: { ready: true, requestedOutputs: [] },
    isSending: true,
  };
  const scope = {
    isBusy: true,
    conversationVersionRef: { current: 0 },
    messagesRef: { current: state.messages },
    responseAbortRef: { current: new AbortController() },
    generationAbortRef: { current: new AbortController() },
    uploadAbortRef: { current: new AbortController() },
    progress: { requestLeave: (navigate) => { state.navigate = navigate; } },
    router: { push: (url) => { state.destination = url; } },
    draftStudioInvite: null, liveCardEventId: null, draft: state.draft,
    isReadyProductDraft: (draft) => draft.ready,
    newMessage: (role, text) => ({ role, text, id: String(Math.random()) }),
    focusComposerAtEnd: noop, refocusComposerAfterResponse: noop,
    messages: state.messages, phase: "collecting_details",
    selectedProductOutput: "live_card", selectedSkinLabel: null,
    categoryLabelForDraft: () => "wedding",
    skinLabelForCategoryName: () => null, chatMessagesForPersistence: (messages) => messages,
    withConciergeTiming: (url) => url, CREATION_INTAKE_URL: "/intake",
    conciergeClientErrorMessage: (error) => String(error),
    ...overrides,
  };
  for (const name of ["IsSending", "RestoringProgress", "IsStreamingAssistant", "IsUploading", "ChatUploadStage", "StreamingPreviewImage", "GenerationStage", "Error", "FailedRequest", "FailedSnapUpload", "Phase", "MobileView", "Messages", "Draft"]) {
    const key = name[0].toLowerCase() + name.slice(1);
    scope[`set${name}`] = (value) => { state[key] = typeof value === "function" ? value(state[key]) : value; };
  }
  return { state, scope };
}

test("leaving the conversation prevents a late non-streaming response from replacing newer state", async () => {
  let resolveFetch;
  let signal;
  const h = harness({ fetch: (_url, options) => {
    signal = options.signal;
    return new Promise((resolve) => { resolveFetch = resolve; });
  } });
  const response = load("sendToConcierge", h.scope)({ message: "Confirm the date", ocrContext: {} });
  assert.ok(signal);
  h.scope.conversationVersionRef.current += 1;
  h.scope.responseAbortRef.current.abort();
  h.state.isSending = true;
  resolveFetch({ ok: true, json: async () => ({ ok: true, draft: { title: "stale result" } }) });
  assert.equal(await response, null);
  assert.equal(signal.aborted, true);
  assert.equal(h.state.draft.ready, true);
  assert.equal(h.state.isSending, true);
  assert.equal(h.state.failedRequest, null);
});

test("a superseded intake cannot overwrite the newer request or clear its busy state", async () => {
  let completeOld;
  const h = harness({ fetch: () => new Promise(resolve => { completeOld = resolve; }) });
  const pending = load("sendToConcierge", h.scope)({ message: "Move to 3 PM", ocrContext: {} });
  const old = h.scope.responseAbortRef.current;
  h.scope.responseAbortRef.current = new AbortController();
  old.abort();
  h.state.isSending = true;
  completeOld({ ok: true, json: async () => ({ ok: true, draft: { title: "stale" } }) });
  assert.equal(await pending, null);
  assert.equal(h.state.draft.ready, true);
  assert.equal(h.state.isSending, true);
});

test("leaving the conversation during artwork generation ignores a late completed image", async () => {
  let completeGeneration;
  const h = harness({
    normalizeDraftProductOutputs: (draft) => draft,
    uploadedFlyerSourceImageUrl: async () => null,
    generateStudioInviteForDraft: () => new Promise((resolve) => { completeGeneration = resolve; }),
  });
  const generation = load("generateProductForDraft", h.scope)(h.state.draft);
  await Promise.resolve();
  assert.equal(typeof completeGeneration, "function");
  h.scope.conversationVersionRef.current += 1;
  completeGeneration({ imageUrl: "late-image.webp" });
  await generation;
  assert.equal(h.scope.draftStudioInvite, null);
  assert.equal(h.state.error, null);
});

function renderComposer({ busy = false, text = "", output = null, upload = null } = {}) {
  const icon = (name) => (props) => React.createElement("svg", { ...props, "data-icon": name });
  const container = ({ children, className }) => React.createElement("div", { className }, children);
  return renderToStaticMarkup(load("composer", {
    React, cn: (...classes) => classes.filter(Boolean).join(" "),
    isEmptyState: false, isCompactEmptyComposer: false, isBusy: busy,
    isUploading: false,
    isGeneratingCard: busy, isPublishingCard: false, canSubmitComposer: true,
    canAttachFlyer: !busy && canUploadFlyerToOutput(output), canUploadFlyerToOutput,
    selectedProductOutput: output, pendingChatUpload: upload, openSnapUploadPicker: noop,
    liveCardEventId: null, draft: {}, input: text, selectionPills: null, error: null,
    composerCardRef: { current: null }, fileInputRef: { current: null },
    handleSubmit: noop, handleSelectedSnapFile: noop, handleComposerValueChange: noop,
    submitComposerInput: noop,
    setIsComposerFocused: noop, getUploadAcceptAttribute: () => "image/*", busyLabel: "Generating invite",
    PromptInput: container, PromptInputActions: container, PromptInputAction: container,
    PromptInputTextarea: (props) => React.createElement("textarea", props),
    ArrowUp: icon("send"), Loader2: icon("loading"), Plus: icon("upload"),
  }));
}

test("active chat offers Send without a category popup, Cancel, or voice input", () => {
  for (const text of ["", "More wedding details"]) {
    const html = renderComposer({ text });
    assert.doesNotMatch(html, /Choose event category|Start an event|role="dialog"/);
    assert.match(html, /aria-label="Send"/);
    assert.doesNotMatch(html, /Cancel|voice input|dictation|microphone/);
  }
  const busy = renderComposer({ busy: true });
  assert.doesNotMatch(busy, /Cancel/);
  assert.match(busy, /disabled=""[^>]+aria-label="Send"/);
});

test("upload plus is active only for an explicitly selected Live Card or Event Page", () => {
  for (const output of [null, "digital_flyer", "printable", "invitation", "signup_form", "live_card", "event_page"]) {
    for (const busy of [false, true]) {
      const html = renderComposer({ output, busy });
      const button = html.match(/<button[^>]*aria-label="Upload your flyer"[^>]*>/)?.[0];
      const fileInput = html.match(/<input[^>]*type="file"[^>]*>/)?.[0];
      assert.ok(button);
      assert.ok(fileInput);
      const enabled = !busy && ["live_card", "event_page"].includes(output);
      assert.equal(button.includes('disabled=""'), !enabled, `${output}, busy=${busy}`);
      assert.equal(fileInput.includes('disabled=""'), !enabled);
      assert.match(button, /aria-describedby="chat-upload-help"/);
      assert.match(button, /size-11/);
    }
  }
});

test("opening and cancelling the picker preserves the attachment, notes, and retry state", () => {
  for (const enabled of [false, true]) {
    let clicks = 0;
    const open = load("openSnapUploadPicker", {
      canAttachFlyer: enabled, fileInputRef: { current: { click: () => { clicks += 1; } } },
      setError: () => assert.fail("Opening the picker must not clear existing state"),
    });
    open();
    assert.equal(clicks, Number(enabled));
  }
  const select = load("handleSelectedSnapFile", { canAttachFlyer: true });
  select(null, "upload");
});

test("picking a valid flyer only stages it; invalid files preserve the existing attachment", () => {
  const file = { name: "september-23.webp", type: "image/webp" };
  const previous = { file: { name: "existing.webp" }, source: "upload" };
  for (const enabled of [false, true]) {
    for (const invalid of [false, true]) {
      const state = { pending: previous, error: null, focused: false, input: "Keep September 23 at 3 PM" };
      const select = load("handleSelectedSnapFile", {
        canAttachFlyer: enabled, validateClientUploadFile: () => invalid ? "File too large" : null,
        setError: value => { state.error = value; }, setFailedRequest: noop, setFailedSnapUpload: noop,
        setPendingChatUpload: value => { state.pending = value; },
        focusComposerAtEnd: () => { state.focused = true; },
      });
      select(file, "upload");
      assert.deepEqual(state.pending, enabled && !invalid ? { file, source: "upload" } : previous);
      assert.equal(state.error, enabled && invalid ? "File too large" : null);
      assert.equal(state.focused, enabled && !invalid);
      assert.equal(state.input, "Keep September 23 at 3 PM");
    }
  }
});

function submissionHarness(overrides = {}) {
  const state = { input: "Create a birthday invitation for Livia on September 23", messages: [], sent: [], focused: false };
  const unexpected = () => { throw new Error("Unexpected generation, save, upload, or edit"); };
  const scope = {
    isBusy: false, input: state.input, signupFormHandoff, canAttachFlyer: true,
    pendingChatUpload: null, selectedProductOutput: "live_card", selectedCategoryLabel: null,
    draft: null, draftStudioInvite: null, liveCardEventId: null,
    canSaveReceivedInvite: false, canGenerateProduct: false,
    isGenerateConfirmationMessage: () => false, shouldRefocusComposerRef: { current: false },
    setInput: value => { state.input = value; },
    setMessages: update => { state.messages = update(state.messages); },
    newMessage: (role, text) => ({ role, text }),
    focusComposerAtEnd: () => { state.focused = true; },
    sendToConcierge: async request => { state.sent.push(request); },
    sendGeneratedDraftEdit: unexpected, sendGeneratedCardEdit: unexpected,
    generateProductForDraft: unexpected, saveReceivedInviteDraft: unexpected,
    routeSelectedSnapFile: unexpected, setDraft: unexpected, setPendingChatUpload: unexpected,
    ...overrides,
  };
  return { state, scope, submit: load("submitComposerInput", scope) };
}

test("Send forwards an attached flyer with its chosen output and the user's instructions", async () => {
  const upload = { file: { name: "birthday.webp" }, source: "upload" };
  const note = "Keep September 23 at 3 PM and the original artwork";
  for (const output of ["live_card", "event_page"]) {
    let attachment = upload;
    const requests = [];
    const h = submissionHarness({
      input: note, pendingChatUpload: upload, selectedProductOutput: output,
      setPendingChatUpload: value => { attachment = value; },
      routeSelectedSnapFile: async (...args) => { requests.push(args); },
    });
    await h.submit();
    assert.deepEqual(requests, [[upload.file, "upload", output, note, note]]);
    assert.equal(attachment, null);
    assert.equal(h.state.input, "");
    assert.deepEqual(h.state.sent, []);
  }
});

test("switching an attached flyer to an unsupported output blocks Send without losing the file or notes", async () => {
  const upload = { file: { name: "birthday.webp" }, source: "upload" };
  for (const output of [null, "digital_flyer"]) {
    const h = submissionHarness({ pendingChatUpload: upload, selectedProductOutput: output, canAttachFlyer: false });
    await h.submit();
    assert.equal(h.state.input, h.scope.input);
    assert.deepEqual(h.state.sent, []);
    assert.equal(load("canSubmitComposer", {
      input: h.scope.input, hasComposerSelection: Boolean(output), pendingChatUpload: upload, canAttachFlyer: false,
    }), false);
    assert.match(renderComposer({ output, upload }), /Select Live Card or Event Page to use this upload, or remove the file/);
    await load("routeSelectedSnapFile", { selectedProductOutput: output, isBusy: false, canUploadFlyerToOutput })(upload.file, "upload");
  }
});

test("upload retries retain the originally chosen output and instructions", async () => {
  const file = { name: "september-23.webp", type: "image/webp" };
  const requests = [];
  const state = { messages: [], error: null, failed: null, failScan: true };
  const scope = {
    selectedProductOutput: "event_page", isBusy: false, canUploadFlyerToOutput,
    conversationVersionRef: { current: 0 }, validateClientUploadFile: () => null,
    setError: value => { state.error = value; }, setFailedRequest: noop,
    setFailedSnapUpload: value => { state.failed = value; }, setIsUploading: noop,
    uploadAbortRef: { current: null }, setChatUploadStage: noop,
    createObjectUrlPreview: () => "blob:flyer", setUploadedPreviewImageUrl: noop,
    setUploadedPreviewFileName: noop, uploadedFileLabel: file => file.name,
    createClientAttemptId: () => "scan", newMessage: (role, text) => ({ id: text, role, text }),
    setMessages: update => { state.messages = update(state.messages); }, reportClientLog: noop,
    runSnapOcrUpload: async () => { if (state.failScan) throw new Error("Scan failed"); return {}; },
    buildChatOcrContext: () => ({}), sendToConcierge: async request => { requests.push(request); return { ok: true, draft: {} }; },
    normalizeDraftProductOutputs: draft => draft, isReadyProductDraft: () => false,
    chatUploadFailureMessage: message => message, fileInputRef: { current: null },
  };
  const route = load("routeSelectedSnapFile", scope);
  await route(file, "upload", "event_page", "Keep September 23 at 3 PM", "Use my flyer");
  assert.deepEqual(state.failed, {
    file, source: "upload", requestedOutput: "event_page", uploadPrompt: "Keep September 23 at 3 PM",
    userEchoOverride: "Use my flyer", error: "Scan failed",
  });
  state.failScan = false;
  await load("retryFailedSnapUpload", { failedSnapUpload: state.failed, isBusy: false, routeSelectedSnapFile: route })();
  assert.equal(state.error, null);
  assert.equal(state.failed, null);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].requestedOutputs, ["event_page"]);
  assert.match(requests[0].message, /User note: Keep September 23 at 3 PM/);
});

test("Live Card and Event Page generation carry forward the supplied source artwork", async () => {
  for (const output of ["live_card", "event_page", "digital_flyer"]) {
    const saved = [];
    const url = await load("uploadedFlyerSourceImageUrl", {
      canUploadFlyerToOutput, effectiveSelectedProductOutput: output,
      uploadedPreviewImageUrl: "blob:original-flyer", uploadedPreviewFileName: "my-flyer.webp",
      persistImageMediaValue: async media => { saved.push(media); return "/media/original-flyer.webp"; },
    })();
    assert.equal(url, output === "digital_flyer" ? null : "/media/original-flyer.webp");
    assert.deepEqual(saved, output === "digital_flyer" ? [] : [{ value: "blob:original-flyer", fileName: "my-flyer.webp" }]);
  }
});

test("typed event requests reach inference with their output choice and no manual category", async () => {
  const h = submissionHarness();
  await h.submit();
  assert.deepEqual(h.state.sent, [{
    message: "Create a birthday invitation for Livia on September 23",
    requestedOutputs: ["live_card"],
  }]);
  assert.equal(h.state.input, "");
});

test("sign-up inquiries hand off before upload, creation, saved-event edits, or artwork generation", async () => {
  for (const active of [
    {},
    { draft: { title: "Livia's birthday", dateText: "September 23", requestedOutputs: ["live_card"] }, canGenerateProduct: true },
    { draftStudioInvite: { imageUrl: "birthday.webp" } },
    { liveCardEventId: "saved-event" },
    { pendingChatUpload: { file: { name: "invitation.webp" }, source: "upload" } },
  ]) {
    const before = structuredClone(active);
    const h = submissionHarness({ input: "Can you make a sign-up form for volunteers?", ...active });
    await h.submit();
    assert.deepEqual(active, before);
    assert.deepEqual(h.state.sent, []);
    assert.equal(h.state.messages.length, 2);
    assert.equal(h.state.messages[0].role, "user");
    assert.equal(h.state.messages[1].role, "assistant");
    assert.ok(h.state.messages[1].text.includes(SIGNUP_FORM_GALLERY_HREF));
    assert.equal(h.state.input, "");
    assert.equal(h.state.focused, true);
  }
});

test("signup gallery reply renders a real accessible link and protects unsaved work on navigation", () => {
  let leave, destination, prevented = false;
  const open = load("openSignupFormGallery", {
    SIGNUP_FORM_GALLERY_HREF,
    progress: { requestLeave: next => { leave = next; } },
    router: { push: href => { destination = href; } },
  });
  const render = load("renderSignupGalleryLine", { React, SIGNUP_FORM_GALLERY_HREF });
  const elements = render(signupFormHandoff("Where are the signup forms?"), open);
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null, elements));
  assert.match(html, /href="\/signup-forms\/templates"/);
  assert.match(html, />Browse sign-up templates<\/a>/);
  const link = elements[1].props.children[0];
  const event = { button: 0, preventDefault: () => { prevented = true; } };
  link.props.onClick({ ...event, ctrlKey: true });
  assert.equal(prevented, false);
  assert.equal(leave, undefined);
  link.props.onClick(event);
  assert.equal(prevented, true);
  assert.equal(destination, undefined);
  leave();
  assert.equal(destination, SIGNUP_FORM_GALLERY_HREF);
});

test("a gallery-only inquiry does not create progress to save, while real event work stays protected", () => {
  const scope = {
    draft: null, draftStudioInvite: null, input: "", selectedProductOutput: null,
    pendingChatUpload: null, restoringProgress: false, liveCardEventId: null, isBusy: false,
    signupFormHandoff, chatMessagesForPersistence: messages => messages,
    useEventProgress: options => options,
    messages: [{ role: "user", text: "Where are your signup forms?" }],
  };
  assert.equal(load("progress", scope).enabled, false);
  assert.equal(load("progress", { ...scope, draft: { title: "September 23 birthday" } }).enabled, true);
  assert.equal(load("progress", { ...scope, messages: [{ role: "user", text: "Livia's birthday is September 23" }] }).enabled, true);
});

test("sign-up gallery replies do not advertise Generate now for an existing ready draft", () => {
  const scope = {
    hasReadyDraftProduct: true, canGenerateProduct: true, isGeneratingCard: false,
    draft: {}, getCreationReadiness: () => ({ canPublish: true }), failedRequest: null, failedSnapUpload: null,
    SIGNUP_FORM_GALLERY_HREF, visibleMessages: [{ role: "assistant", text: signupFormHandoff("Create a signup sheet") }],
  };
  assert.equal(load("shouldShowGenerateReply", scope), false);
  assert.equal(load("shouldShowGenerateReply", { ...scope, visibleMessages: [{ role: "assistant", text: "Ready to generate your birthday card." }] }), true);
});

test("Generate now starts generation for the current draft and respects readiness", () => {
  const draft = { title: "Livia's birthday" };
  const generated = [];
  const scope = {
    React, shouldShowGenerateReply: true, canGenerateProduct: true, draft,
    isGeneratingCard: false, setIsReadyChatComposerOpen: noop,
    generateProductForDraft: value => generated.push(value),
    Sparkles: () => null, Loader2: () => null,
  };
  const action = load("generateReplyAction", scope);
  assert.match(renderToStaticMarkup(action), /Generate now/);
  action.props.onClick();
  assert.deepEqual(generated, [draft]);
  load("generateReplyAction", { ...scope, canGenerateProduct: false }).props.onClick();
  assert.equal(generated.length, 1);
  assert.equal(load("generateReplyAction", { ...scope, shouldShowGenerateReply: false }), null);
});

function generationHarness(generate) {
  const state = { view: "chat", views: [], phase: null, error: null, messages: [] };
  const scope = {
    conversationVersionRef: { current: 0 }, normalizeDraftProductOutputs: draft => draft,
    isReadyProductDraft: () => true, setError: value => { state.error = value; },
    setPhase: value => { state.phase = value; },
    setMobileView: value => { state.view = value; state.views.push(value); },
    setGenerationStage: noop, setStreamingPreviewImage: noop,
    uploadedFlyerSourceImageUrl: async () => null,
    generateStudioInviteForDraft: generate, effectiveSelectedProductLabel: "Live Card",
    newMessage: (role, text) => ({ role, text }), preloadGeneratedPreviewImage: async () => {},
    setDraft: noop, setDraftStudioInvite: noop, setGeneratedInviteImageUrl: noop,
    setLiveCardEventId: noop, setLiveCardTitle: noop, setLiveCardSummary: noop,
    draftHeadline: draft => draft.title, liveCardSummaryFromDraft: () => ({}),
    effectiveSelectedProductOutput: "live_card", notifyCreationThreadsChanged: noop,
    setMessages: update => { state.messages = update(state.messages); },
  };
  return { state, scope, generate: load("generateProductForDraft", scope) };
}

test("generation opens preview immediately and completion preserves a return to chat", async () => {
  let complete;
  const h = generationHarness(() => new Promise(resolve => { complete = resolve; }));
  const pending = h.generate({ title: "Livia's birthday", canPersist: true });
  assert.equal(h.state.view, "preview");
  await Promise.resolve();
  h.scope.setMobileView("chat");
  complete({ imageUrl: "birthday.webp" });
  await pending;
  assert.equal(h.state.view, "chat");
  assert.equal(h.state.phase, "card_ready");
  assert.deepEqual(h.state.views, ["preview", "chat"]);
  assert.equal(h.state.messages.length, 1);
});

test("failed generation returns to chat with the error and a retryable draft", async () => {
  const h = generationHarness(async () => { throw new Error("Please retry generation."); });
  await h.generate({ title: "Livia's birthday", canPersist: true });
  assert.equal(h.state.view, "chat");
  assert.equal(h.state.phase, "ready_to_generate");
  assert.equal(h.state.error, "Please retry generation.");
  assert.equal(h.state.messages.length, 0);
});

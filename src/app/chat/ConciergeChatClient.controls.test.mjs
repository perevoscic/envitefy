import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

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
    messages: state.messages, phase: "collecting_details", selectedStarterCategory: null,
    selectedProductOutput: "live_card", selectedSkinLabel: null,
    starterSelectionLabel: () => null, categoryLabelForDraft: () => "wedding",
    skinLabelForCategoryName: () => null, chatMessagesForPersistence: (messages) => messages,
    withConciergeTiming: (url) => url, CREATION_INTAKE_URL: "/intake",
    conciergeClientErrorMessage: (error) => String(error),
    ...overrides,
  };
  for (const name of ["IsSending", "RestoringProgress", "IsStreamingAssistant", "IsUploading", "ChatUploadStage", "StreamingPreviewImage", "GenerationStage", "Error", "FailedRequest", "FailedSnapUpload", "Phase", "MobileView", "Messages", "SelectedStarterCategory", "Draft"]) {
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
    uploadedLiveCardSourceImageUrl: async () => null,
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

function renderComposer({ busy = false, text = "" } = {}) {
  const icon = (name) => (props) => React.createElement("svg", { ...props, "data-icon": name });
  const container = ({ children, className }) => React.createElement("div", { className }, children);
  return renderToStaticMarkup(load("composer", {
    React, cn: (...classes) => classes.filter(Boolean).join(" "),
    isEmptyState: false, isCompactEmptyComposer: false, isBusy: busy,
    isUploading: false,
    isGeneratingCard: busy, isPublishingCard: false, canSubmitComposer: true,
    liveCardEventId: null, draft: {}, input: text, selectionPills: null, error: null,
    composerCardRef: { current: null }, fileInputRef: { current: null },
    handleSubmit: noop, handleSelectedSnapFile: noop, handleComposerValueChange: noop,
    submitComposerInput: noop, handleStarterCategoryChoice: noop,
    ChatCategoryMenu: ({ disabled }) => React.createElement("button", { disabled, "aria-label": "Choose event category" }, "+"),
    setIsComposerFocused: noop, getUploadAcceptAttribute: () => "image/*", busyLabel: "Generating invite",
    PromptInput: container, PromptInputActions: container, PromptInputAction: container,
    PromptInputTextarea: (props) => React.createElement("textarea", props),
    ArrowUp: icon("send"), Loader2: icon("loading"),
  }));
}

test("active chat offers categories beside Send without Cancel or voice input", () => {
  for (const text of ["", "More wedding details"]) {
    const html = renderComposer({ text });
    assert.match(html, /aria-label="Choose event category"/);
    assert.match(html, /aria-label="Send"/);
    assert.doesNotMatch(html, /Cancel|voice input|dictation|microphone/);
  }
  const busy = renderComposer({ busy: true });
  assert.doesNotMatch(busy, /Cancel/);
  assert.match(busy, /disabled="" aria-label="Choose event category"/);
  assert.match(busy, /disabled=""[^>]+aria-label="Send"/);
});

function categoryHarness({ active = false, thread = null, busy = false } = {}) {
  const state = { input: "Livia, September 25", draft: active ? { title: "Livia's birthday" } : null, selected: null, resets: 0 };
  const scope = {
    isBusy: busy, isEmptyState: !active, threadId: thread,
    CELEBRATION_STARTER_TILES: [{ prompt: "Birthday", color: "text-pink-600" }],
    pendingStarterCategoryRef: { current: null },
    setSelectedStarterCategory: (tile) => { state.selected = tile; },
    updateComposerSelection: noop, focusComposerAtEnd: noop,
    resetConversation: () => { state.draft = null; state.input = ""; state.resets += 1; },
    progress: { requestLeave: (callback) => { state.leave = callback; }, markSaved: noop, allowNavigation: (callback) => callback() },
    router: { push: (href) => { state.href = href; }, replace: (href) => { state.href = href; } },
  };
  return { state, scope, choose: load("handleStarterCategoryChoice", scope) };
}

const birthday = { label: "Birthdays", prompt: "Birthday", href: "/event/birthdays" };

test("choosing a category before the first message preserves typed details", () => {
  const h = categoryHarness();
  h.choose(birthday);
  assert.equal(h.state.input, "Livia, September 25");
  assert.equal(h.state.selected.prompt, "Birthday");
  assert.equal(h.state.resets, 0);
  assert.equal(h.state.leave, undefined);
});

test("category changes in an active chat wait for the unsaved-progress decision", () => {
  const h = categoryHarness({ active: true });
  h.choose(birthday);
  assert.equal(h.state.draft.title, "Livia's birthday");
  assert.equal(h.state.resets, 0);
  assert.equal(h.state.selected, null);
  h.state.leave();
  assert.equal(h.state.resets, 1);
  assert.equal(h.state.selected.prompt, "Birthday");
});

test("a new category survives leaving a saved thread and signup navigation is guarded", () => {
  const h = categoryHarness({ active: true, thread: "saved-thread" });
  h.choose(birthday);
  h.state.leave();
  assert.equal(h.state.href, "/chat");
  assert.equal(h.scope.pendingStarterCategoryRef.current.prompt, "Birthday");
  const signup = categoryHarness({ active: true });
  signup.choose({ label: "Sign-up Form", prompt: "Sign-up Form", href: "/signup-forms/templates" });
  assert.equal(signup.state.href, undefined);
  signup.state.leave();
  assert.equal(signup.state.href, "/signup-forms/templates");
  assert.equal(signup.state.resets, 0);
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
    uploadedLiveCardSourceImageUrl: async () => null,
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

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const { normalizeSignupIntent } = loadTs("src/lib/signup-intent.ts");
const parse = (file) => ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const view = parse("src/app/left-sidebar.tsx");
const controller = parse("src/app/left-sidebar.controller.ts");
const rootPanel = view.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "RootNavigationPanel");
const hook = controller.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "useLeftSidebarController");
const variable = (name) => hook.body.statements.flatMap(node => ts.isVariableStatement(node) ? [...node.declarationList.declarations] : [])
  .find(node => node.name.getText(controller) === name).initializer.getText(controller);
const evaluate = (source, bindings) => new Function("require", "exports", ...Object.keys(bindings), ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText)(require, {}, ...Object.values(bindings));
const icon = () => null;

test("gymnastics signup gets a permission-gated shortcut without changing other accounts", () => {
  for (const scenario of [
    { source: "gymnastics", intent: null, pages: true, categories: ["gymnastics"], visible: true },
    { source: "gymnastics", intent: "weddings", pages: true, categories: ["gymnastics", "weddings"], visible: true },
    { source: "legacy", intent: "gymnastics", pages: true, categories: ["gymnastics"], visible: true },
    { source: "football", intent: "football", pages: true, categories: ["gymnastics", "football"], visible: false },
    { source: "snap", intent: null, pages: true, categories: ["gymnastics"], visible: false },
    { source: "gymnastics", intent: "gymnastics", pages: false, categories: ["gymnastics"], visible: false },
    { source: "gymnastics", intent: "gymnastics", pages: true, categories: ["weddings"], visible: false },
    { source: "gymnastics", intent: "gymnastics", pages: true, categories: null, visible: false },
  ]) {
    const showGymnasticsCreate = evaluate(`return ${variable("showGymnasticsCreate")};`, {
      hasCreateEventAccess: scenario.pages,
      creationAccess: { access: scenario.categories ? { allowedCategories: scenario.categories } : null },
      effectivePrimarySignupSource: scenario.source,
      defaultCreateIntent: scenario.intent,
      normalizeSignupIntent,
    });
    assert.equal(showGymnasticsCreate, scenario.visible, JSON.stringify(scenario));
  }
});

test("the shortcut follows Create event on mobile and desktop, opens templates and owns the active state", () => {
  const navigations = [];
  let cleared = false;
  let collapsed = false;
  let sidebarPage;
  const onGymnastics = evaluate(`return ${variable("handleRootGymnasticsNavigate")};`, {
    useCallback: callback => callback,
    showGymnasticsCreate: true,
    clearEventContext: () => { cleared = true; },
    setForcedCreateActiveLabel: () => {},
    setSidebarPage: page => { sidebarPage = page; },
    collapseSidebarOnTouch: () => { collapsed = true; },
    router: { push: href => navigations.push(href) },
  });
  const links = [];
  const RootNavigationPanel = evaluate(`${rootPanel.getText(view)}; return RootNavigationPanel;`, {
    Home: icon, Upload: icon, LiveCardIcon: icon, Plus: icon, SidebarGymnasticsMenuIcon: icon,
    SidebarMyEventsMenuIcon: icon, Trophy: icon, ClipboardList: icon, FileEdit: icon, ShieldCheck: icon,
    SidebarLink: ({ link }) => { links.push(link); return React.createElement("button", null, link.label); },
  });
  renderToStaticMarkup(React.createElement(RootNavigationPanel, {
    pathname: "/event/gymnastics", sidebarPage: "root", eventContextSourcePage: "myEvents",
    hasCreateEventAccess: true, showGymnasticsCreate: true, isGymnasticsCreateActive: true,
    createEntryLabel: "Create event", isCreateEntryActive: true, isSnapUploadActive: false,
    isAdmin: false, createdEventsCount: 0, schedulesCount: 0, signupFormsCount: 0,
    draftsCount: 0, isSignupFormsDefault: false, onGymnastics,
  }));
  const createIndex = links.findIndex(link => link.label === "Create event");
  const gymnastics = links[createIndex + 1];
  assert.equal(gymnastics.label, "Gymnastics");
  assert.equal(gymnastics.active, true);
  assert.equal(links[createIndex].active, false);
  assert.equal(links.find(link => link.label === "My Events").active, false);
  gymnastics.onClick();
  assert.deepEqual(navigations, ["/event/gymnastics"]);
  assert.equal(cleared, true);
  assert.equal(collapsed, true);
  assert.equal(sidebarPage, "root");
});

test("the public gymnastics signup keeps its persisted category and gallery continuation", () => {
  const landing = readFileSync("src/components/gymnastics-landing/GymnasticsLanding.tsx", "utf8");
  assert.match(landing, /signupSource="gymnastics"/);
  assert.match(landing, /successRedirectUrl=\{authMode === "signup" \? "\/event\/gymnastics" : "\/"\}/);
  const creation = readFileSync("src/app/event/gymnastics/GymnasticsCreationPageClient.tsx", "utf8");
  assert.match(creation, /<GymnasticsDesignGallery\s*\/>/);
});

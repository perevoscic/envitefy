import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = ts.createSourceFile("sidebar.tsx", readFileSync("src/app/left-sidebar.tsx", "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declaration = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "RootNavigationPanel");
const code = ts.transpileModule(declaration.getText(source), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
const icon = () => null;

test("Sign-up Forms appears for published forms, forms-focused accounts and admins", () => {
  for (const scenario of [
    { name: "new ordinary account", isAdmin: false, isSignupFormsDefault: false, signupFormsCount: 0, draftsCount: 0, visible: false },
    { name: "drafts only", isAdmin: false, isSignupFormsDefault: false, signupFormsCount: 0, draftsCount: 1, visible: false },
    { name: "published form", isAdmin: false, isSignupFormsDefault: false, signupFormsCount: 1, draftsCount: 0, visible: true },
    { name: "forms-focused account", isAdmin: false, isSignupFormsDefault: true, signupFormsCount: 0, draftsCount: 0, visible: true },
    { name: "admin", isAdmin: true, isSignupFormsDefault: false, signupFormsCount: 0, draftsCount: 0, visible: true },
  ]) {
    let opened = false;
    let createOpened = false;
    let signupFormOpened = false;
    const links = [];
    const bindings = {
      Home: icon, Upload: icon, LiveCardIcon: icon, Plus: icon,
      SidebarMyEventsMenuIcon: icon, Trophy: icon, ClipboardList: icon,
      FileEdit: icon, ShieldCheck: icon,
      SidebarLink: ({ link }) => {
        links.push(link);
        return React.createElement("button", { "aria-current": link.active ? "page" : undefined }, link.label, link.badge ?? "");
      },
    };
    const RootNavigationPanel = new Function("require", "exports", ...Object.keys(bindings), `${code}; return RootNavigationPanel;`)(require, {}, ...Object.values(bindings));
    const markup = renderToStaticMarkup(React.createElement(RootNavigationPanel, {
      pathname: "/", sidebarPage: "signupForms", eventContextSourcePage: "myEvents",
      hasCreateEventAccess: true, createEntryLabel: "Create Event", isCreateEntryActive: false,
      isSnapUploadActive: false, ...scenario,
      onSignupForms: () => { opened = true; },
      onCreate: () => { createOpened = true; },
      onSignupForm: () => { signupFormOpened = true; },
    }));
    const formsLink = links.find((link) => link.label === "Sign-up Forms");
    assert.equal(links.some((link) => link.label === "Live Card"), true, scenario.name);
    assert.equal(links.some((link) => link.label === "Envitefy Create"), false, scenario.name);
    assert.equal(Boolean(formsLink), scenario.visible, scenario.name);
    if (formsLink) {
      assert.equal(formsLink.active, true);
      assert.equal(formsLink.badge, scenario.signupFormsCount);
      formsLink.onClick();
      assert.equal(opened, true);
    }
    assert.equal(links.some((link) => link.label === "Admin"), scenario.isAdmin);
    assert.equal(links.find((link) => link.label === "Drafts").badge, scenario.draftsCount);
    links.find((link) => link.label === "Create Event").onClick();
    assert.equal(createOpened, true);
    links.find((link) => link.label === "Sign-up Form").onClick();
    assert.equal(signupFormOpened, true, "the first form is discoverable from its own root entry");
    assert.match(markup, /aria-label="Main navigation"/);
  }
});

test("unified navigation keeps creation products independent and saved-work sidebar lists accessible", () => {
  for (const [pages, signup] of [[true, false], [false, true], [true, true], [false, false]]) {
    const links = [];
    const bindings = {
      Home: icon, Upload: icon, LiveCardIcon: icon, Plus: icon,
      SidebarMyEventsMenuIcon: icon, Trophy: icon, ClipboardList: icon,
      FileEdit: icon, ShieldCheck: icon,
      SidebarLink: ({ link }) => { links.push(link); return React.createElement("button", null, link.label); },
    };
    const RootNavigationPanel = new Function("require", "exports", ...Object.keys(bindings), `${code}; return RootNavigationPanel;`)(require, {}, ...Object.values(bindings));
    renderToStaticMarkup(React.createElement(RootNavigationPanel, {
      pathname: "/events", sidebarPage: "root", eventContextSourcePage: "myEvents",
      hasCreateEventAccess: pages, hasSignupFormAccess: signup, unifiedCreation: true,
      createEntryLabel: "Event Page", isCreateEntryActive: false, isSnapUploadActive: false,
      isAdmin: false, createdEventsCount: 3, schedulesCount: 1, signupFormsCount: 1,
      draftsCount: 1, isSignupFormsDefault: false,
    }));
    assert.deepEqual(links.map(link => link.label), ["Home", "Snap a Flyer", "Live Card", ...(pages ? ["Event Page"] : []), ...(signup ? ["Sign-up Form"] : []), "My Events", "Schedules", "Sign-up Forms", "Drafts"]);
    assert.equal(links.find(link => link.label === "My Events").active, true);
    assert.equal(links.find(link => link.label === "My Events").badge, 3);
  }
});

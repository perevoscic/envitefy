import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { suppressEventPreviewChrome } from "./event-preview-chrome.ts";

function rootElement(initial = {}) {
  const attributes = new Map(Object.entries(initial));
  return {
    getAttribute: (name) => attributes.get(name) ?? null,
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
  };
}

test("navigation stays hidden until nested previews close, then returns", () => {
  const root = rootElement();
  const closeOuter = suppressEventPreviewChrome(root);
  const closeInner = suppressEventPreviewChrome(root);
  assert.equal(root.getAttribute("data-owner-preview-open"), "true");
  closeOuter();
  closeOuter();
  assert.equal(root.getAttribute("data-owner-preview-open"), "true");
  closeInner();
  assert.equal(root.getAttribute("data-owner-preview-open"), null);
});

test("preview documents are independent and existing attributes are restored", () => {
  const root = rootElement({ "data-owner-preview-open": "false" });
  const iframeRoot = rootElement();
  const close = suppressEventPreviewChrome(root);
  const closeIframe = suppressEventPreviewChrome(iframeRoot);
  closeIframe();
  assert.equal(root.getAttribute("data-owner-preview-open"), "true");
  close();
  assert.equal(root.getAttribute("data-owner-preview-open"), "false");
  const reopen = suppressEventPreviewChrome(root);
  reopen();
  assert.equal(root.getAttribute("data-owner-preview-open"), "false");
});

test("opened previews hide navigation and remove its spacing; inline previews do not", () => {
  const read = (file) => readFileSync(file, "utf8");
  const viewport = read("src/components/EventPreviewViewport.tsx");
  const sidebar = read("src/app/left-sidebar.tsx");
  const styles = read("src/app/globals.css");
  assert.match(viewport, /!preserveNavigation && \(fullscreen \|\| onClose\) \? <OwnerPreviewMobileTopbarSuppressor/);
  for (const surface of ["sidebar", "topbar", "reveal", "drawer-backdrop"]) {
    assert.ok(sidebar.includes(`data-app-navigation="${surface}"`));
  }
  assert.match(styles, /html\[data-owner-preview-open="true"\] \[data-app-navigation\] \{\s*display: none !important;/);
  assert.match(styles, /\[data-app-main-content="true"\] \{[^}]*padding-left: 0 !important;/);
  assert.match(read("src/components/MainContentWrapper.tsx"), /data-app-main-content="true"/);
  assert.match(read("src/app/AppShell.tsx"), /isAuthenticated=\{false\}\s*reserveSidebarSpace=\{false\}/);
});

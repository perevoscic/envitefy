import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("AppShell hides app chrome on marketing and full live-card routes", () => {
  const appShell = readSource("src/app/AppShell.tsx");

  assert.match(appShell, /MARKETING_PATHS/);
  assert.doesNotMatch(appShell, /const MARKETING_PATHS = new Set\(\[[^\]]*"\/snap"/s);
  assert.match(appShell, /"\/gymnastics"/);
  assert.match(appShell, /"\/weddings"/);
  assert.match(appShell, /"\/signup-forms"/);
  assert.match(appShell, /"\/landing"/);
  assert.match(appShell, /function isStudioCardSharePath\(pathname: string\)/);
  assert.match(appShell, /segments\.length === 2 && segments\[0\] === "card"/);
  assert.match(appShell, /const isStudioCardShare = isStudioCardSharePath\(pathname\);/);
  assert.match(appShell, /showAppChrome/);
  assert.match(
    appShell,
    /const showAppChrome\s*=\s*isAuthenticated && !onMarketing && !isStudioCardShare && !isCreateLanding && !isEventPreview;/,
  );
  assert.match(appShell, /const isRedirectingFromMarketing = pathname === "\/landing" && isAuthenticated/);
  assert.match(appShell, /templateCategoryForPath\(pathname\)/);
  assert.match(appShell, /isPublicTemplatePath\(pathname\)/);
  assert.match(appShell, /getCreateActionForSignupIntent\(signupIntentForMarketingPath\(pathname\)\)/);
  assert.match(appShell, /router\.replace\(pathname === "\/landing" \|\| !createAction \? "\/" : createAction\.href\)/);
  assert.match(appShell, /z-\[14000\]/);
  assert.match(appShell, /auth-transition-overlay/);
  assert.match(appShell, />Loading \.\.\.<\/p>[\s\S]*<EnvitefyWordmark/);
  assert.doesNotMatch(appShell, /Opening Envitefy/);
  assert.match(appShell, /data-auth-transition/);
  assert.match(appShell, /shine/);
  assert.match(appShell, /AUTH_TRANSITION_EVENT/);
  assert.match(appShell, /authTransitionMessage/);
});

const nativeRequire = createRequire(import.meta.url);
function loadComponent(relativePath, mocks) {
  const code = ts.transpileModule(readSource(relativePath), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => (name in mocks ? mocks[name] : nativeRequire(name)),
    module,
    module.exports,
  );
  return module.exports;
}

function renderRoute(pathname, status, { serverSession = null, preview = false } = {}) {
  const menuContext = React.createContext(null);
  const mocks = {
    "next/dynamic": () => () => React.createElement("aside", null, "Account navigation"),
    "next/navigation": {
      usePathname: () => pathname,
      useSearchParams: () => new URLSearchParams(preview ? "preview=owner" : ""),
      useRouter: () => ({}),
    },
    "next-auth/react": { useSession: () => ({ status }) },
    "@/app/event-cache-context": { EventCacheProvider: React.Fragment },
    "@/components/branding/EnvitefyWordmark": { default: () => null, __esModule: true },
    "@/components/ConditionalFooter": { default: () => null, __esModule: true },
    "@/components/MobileOverflowReporter": { default: () => null, __esModule: true },
    "@/components/MainContentWrapper": {
      MainContentWrapper: ({ children }) => React.createElement("div", null, children),
    },
    "@/contexts/MenuContext": {
      MenuProvider: ({ children }) =>
        React.createElement(menuContext.Provider, { value: {} }, children),
      useMenuOptional: () => React.useContext(menuContext),
    },
    "@/lib/template-categories": loadComponent("src/lib/template-categories.ts", {}),
    "@/lib/signup-intent": {},
    "@/utils/authTransition": {},
    "@/components/events/category-gallery-page": {
      categoryGalleryPageClassName: () => "gallery-colors",
    },
    "@/components/navigation/SignedOutPageChrome": {
      __esModule: true,
      default: () => React.createElement("nav", null, "Public navigation"),
    },
  };
  const AppShell = loadComponent("src/app/AppShell.tsx", mocks).default;
  const GalleryLayout = loadComponent(
    "src/components/templates/TemplateGalleryLayout.tsx",
    mocks,
  ).default;
  const content = pathname.replace(/\/+$/, "") === "/signup-forms/templates"
    ? React.createElement(GalleryLayout, { category: "signup-forms" }, "Signup gallery")
    : React.createElement("main", null, "Editor content");
  return renderToStaticMarkup(React.createElement(AppShell, { serverSession }, content));
}

test("signed-in signup galleries and editors retain the account menu", () => {
  for (const route of [
    "/signup-forms/templates",
    "/signup-forms/templates/",
    "/signup-forms/templates/editorial--clean-clear/customize",
    "/templates/signup",
    "/smart-signup-form",
  ]) {
    const html = renderRoute(route, "authenticated");
    assert.match(html, /Account navigation/, route);
    assert.doesNotMatch(html, /Public navigation|pt-24/, route);
  }
  const hydrating = renderRoute("/signup-forms/templates", "loading", {
    serverSession: { user: { name: "Organizer" } },
  });
  assert.match(hydrating, /Account navigation/);
  assert.doesNotMatch(hydrating, /Public navigation|pt-24/);
});

test("anonymous signup browsing keeps public navigation and editors remain accessible", () => {
  for (const status of ["unauthenticated", "loading"]) {
    const gallery = renderRoute("/signup-forms/templates", status);
    assert.match(gallery, /Public navigation/);
    assert.match(gallery, /pt-24/);
    assert.match(gallery, /Signup gallery/);
    assert.doesNotMatch(gallery, /Account navigation/);
    const editor = renderRoute("/signup-forms/templates/editorial--clean-clear/customize", status);
    assert.match(editor, /Editor content/);
    assert.doesNotMatch(editor, /Account navigation/);
  }
});

test("signup marketing, other public galleries, live cards and clean previews stay unchanged", () => {
  for (const route of [
    "/signup-forms", "/signup-forms/", "/weddings/templates", "/card/example", "/envitefy-create",
  ]) {
    assert.doesNotMatch(renderRoute(route, "authenticated"), /Account navigation/, route);
  }
  assert.doesNotMatch(
    renderRoute("/signup-forms/templates/editorial--clean-clear/customize", "authenticated", { preview: true }),
    /Account navigation/,
  );
});

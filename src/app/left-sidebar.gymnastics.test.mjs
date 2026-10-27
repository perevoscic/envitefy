import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const favorites = loadTs("src/lib/category-favorites.ts");
const { resolveCreationAccess } = loadTs("src/lib/creation-access.ts");
const parse = (file) =>
  ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
const view = parse("src/app/left-sidebar.tsx");
const controller = parse("src/app/left-sidebar.controller.ts");
const rootPanel = view.statements.find(
  (node) => ts.isFunctionDeclaration(node) && node.name?.text === "RootNavigationPanel",
);
const hook = controller.statements.find(
  (node) => ts.isFunctionDeclaration(node) && node.name?.text === "useLeftSidebarController",
);
const variable = (name) =>
  hook.body.statements
    .flatMap((node) => (ts.isVariableStatement(node) ? [...node.declarationList.declarations] : []))
    .find((node) => node.name.getText(controller) === name)
    .initializer.getText(controller);
const evaluate = (source, bindings) =>
  new Function(
    "require",
    "exports",
    ...Object.keys(bindings),
    ts.transpileModule(source, {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
    }).outputText,
  )(require, {}, ...Object.values(bindings));
const icon = () => null;

function renderNavigation({
  ids,
  source = null,
  intent = null,
  access = resolveCreationAccess(),
  pathname = "/create",
  query = "",
  schedulesCount = 0,
} = {}) {
  const links = [];
  const SidebarLink = ({ link }) => {
    links.push(link);
    return React.createElement(
      "button",
      { "aria-current": link.active ? "page" : undefined },
      link.label,
    );
  };
  const { SidebarCategoryFavorites, SidebarCategoryShortcut } = loadTs(
    "src/components/navigation/SidebarCategoryFavorites.tsx",
    {
      "@/components/ui/sidebar": { SidebarLink },
      "lucide-react": new Proxy({}, { get: () => icon }),
    },
  );
  const defaultCategory = favorites.defaultCreationCategoryFor(source, intent, access);
  const visible = favorites
    .categoryFavoritesFor(favorites.resolvePinnedCategoryIds(ids, source, intent), access)
    .filter((favorite) => favorite.id !== defaultCategory?.id);
  const isDefaultCreationCategoryActive = evaluate(
    `return ${variable("isDefaultCreationCategoryActive")};`,
    {
      categoryFavorites: { defaultCategory },
      pathname,
      searchParams: new URLSearchParams(query),
      isCategoryFavoriteActive: favorites.isCategoryFavoriteActive,
    },
  );
  const activeId = evaluate(`return ${variable("activeCategoryFavoriteId")};`, {
    categoryFavorites: { favorites: visible },
    pathname,
    searchParams: new URLSearchParams(query),
    isCategoryFavoriteActive: favorites.isCategoryFavoriteActive,
  });
  const isCreateEntryActive = evaluate(`return ${variable("isCreateEntryActive")};`, {
    activeCategoryFavoriteId: activeId,
    isDefaultCreationCategoryActive,
    isCreateRouteActive: pathname === "/create",
    sidebarPage: "root",
  });
  const RootNavigationPanel = evaluate(`${rootPanel.getText(view)}; return RootNavigationPanel;`, {
    Home: icon,
    Upload: icon,
    LiveCardIcon: icon,
    Plus: icon,
    SidebarMyEventsMenuIcon: icon,
    Trophy: icon,
    ClipboardList: icon,
    FileEdit: icon,
    ShieldCheck: icon,
    SidebarLink,
  });
  const html = renderToStaticMarkup(
    React.createElement(RootNavigationPanel, {
      pathname,
      sidebarPage: "root",
      eventContextSourcePage: "myEvents",
      hasCreateEventAccess: access.allowedProducts.some(
        (product) => product === "event_page" || product === "signup_form",
      ),
      defaultCreationCategory: defaultCategory
        ? React.createElement(SidebarCategoryShortcut, {
            favorite: defaultCategory,
            active: isDefaultCreationCategoryActive,
            onNavigate: () => {},
          })
        : null,
      isDefaultCreationCategoryActive,
      unifiedCreation: true,
      categoryFavorites: React.createElement(SidebarCategoryFavorites, {
        favorites: visible,
        options: favorites.categoryFavoritesFor(
          favorites.CATEGORY_FAVORITES.map((item) => item.id),
          access,
        ),
        activeId,
        loading: false,
        saving: false,
        error: "",
        onNavigate: () => {},
        onToggle: async () => {},
      }),
      isCategoryFavoriteActive: Boolean(activeId),
      createEntryLabel: "Create event",
      isCreateEntryActive,
      isSnapUploadActive: false,
      isAdmin: false,
      createdEventsCount: 0,
      schedulesCount,
      signupFormsCount: 0,
      draftsCount: 0,
      isSignupFormsDefault: false,
    }),
  );
  return { links, html, activeId, defaultCategory };
}

test("signup creation defaults stay permission-gated and independent from explicit favorites", () => {
  for (const scenario of [
    {
      source: "gymnastics",
      ids: undefined,
      categories: ["gymnastics"],
      labels: [],
      defaultId: "gymnastics",
    },
    {
      source: "legacy",
      intent: "gymnastics",
      ids: undefined,
      categories: ["gymnastics"],
      labels: [],
      defaultId: "gymnastics",
    },
    {
      source: "gymnastics",
      ids: [],
      categories: ["gymnastics"],
      labels: [],
      defaultId: "gymnastics",
    },
    {
      source: "gymnastics",
      ids: ["school", "birthdays"],
      categories: ["general", "birthdays", "gymnastics"],
      labels: ["School & classroom", "Birthdays"],
      defaultId: "gymnastics",
    },
    {
      source: "football",
      ids: undefined,
      categories: ["gymnastics", "football"],
      labels: [],
      defaultId: "football",
    },
    {
      source: "gymnastics",
      ids: ["gymnastics", "school"],
      categories: ["gymnastics", "general"],
      labels: ["School & classroom"],
      defaultId: "gymnastics",
    },
    { source: "gymnastics", ids: ["gymnastics"], categories: ["weddings"], labels: [] },
    {
      source: "gymnastics",
      ids: ["gymnastics"],
      categories: ["gymnastics"],
      products: ["snap"],
      labels: [],
    },
  ]) {
    const access = resolveCreationAccess({
      policy: "restricted",
      categories: scenario.categories,
      products: scenario.products || ["event_page"],
    });
    const { links, html, defaultCategory } = renderNavigation({ ...scenario, access });
    const section =
      html.match(/<section aria-label="Favorite event types"[\s\S]*?<\/section>/)?.[0] || "";
    const favoriteLabels = [...section.matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map((match) =>
      match[1].replaceAll("&amp;", "&"),
    );
    assert.deepEqual(favoriteLabels, scenario.labels, JSON.stringify(scenario));
    assert.equal(defaultCategory?.id || null, scenario.defaultId || null, JSON.stringify(scenario));
    if (defaultCategory) {
      const createIndex = links.findIndex((link) => link.label === "Create event");
      assert.equal(
        links[createIndex + 1].label,
        defaultCategory.label,
        "the signup default stays immediately under Create event",
      );
    }
  }
});

test("shared mobile and desktop navigation places favorites after Create products and preserves their active state", () => {
  for (const scenario of [
    { pathname: "/event/gymnastics", query: "", id: "gymnastics", label: "Gymnastics" },
    {
      pathname: "/event/general",
      query: "collection=school",
      id: "school",
      label: "School & classroom",
    },
    {
      pathname: "/bridal-showers/templates",
      query: "",
      id: "bridal-showers",
      label: "Bridal showers",
    },
    { pathname: "/signup-forms/templates", query: "", id: "signup-forms", label: "Sign-up Form" },
  ]) {
    const { links, html, activeId } = renderNavigation({
      ids: [scenario.id, "birthdays"],
      ...scenario,
    });
    const createIndex = links.findIndex((link) => link.label === "Create event");
    assert.equal(links[createIndex + 1].label, scenario.label);
    assert.equal(links[createIndex + 2].label, "Birthdays");
    assert.match(html, /Create event<\/button><\/div><section aria-label="Favorite event types"/);
    assert.ok(
      html.indexOf('aria-label="Favorite event types"') < html.indexOf(">Manage</p>"),
      "Favorites has its own section before Manage",
    );
    assert.equal(activeId, scenario.id);
    assert.equal(links[createIndex + 1].active, true);
    assert.equal(links[createIndex].active, false);
    assert.equal(links.find((link) => link.label === "My Events").active, false);
  }
  const withDefault = renderNavigation({
    source: "gymnastics",
    ids: ["school"],
    pathname: "/event/gymnastics",
  });
  assert.equal(withDefault.activeId, null);
  assert.equal(
    withDefault.links.find((link) => link.label === "Gymnastics").active,
    true,
    "the independent signup default has its own active state",
  );
  assert.equal(withDefault.links.find((link) => link.label === "Create event").active, false);
  assert.equal(withDefault.links.find((link) => link.label === "School & classroom").active, false);
});

test("favorite navigation uses the selected app-owned destination, resets event context and rejects missing access", () => {
  const selected = favorites.categoryFavoritesFor(
    ["gymnastics", "school", "bridal-showers"],
    resolveCreationAccess(),
  );
  for (const favorite of selected) {
    const actions = [];
    const navigate = evaluate(`return ${variable("handleRootCategoryFavoriteNavigate")};`, {
      useCallback: (callback) => callback,
      categoryFavorites: { favorites: selected },
      hasCreateEventAccess: true,
      clearEventContext: () => actions.push("clear"),
      setForcedCreateActiveLabel: (value) => actions.push(["selection", value]),
      setSidebarPage: (page) => actions.push(["panel", page]),
      collapseSidebarOnTouch: () => actions.push("collapse"),
      router: { push: (href) => actions.push(["navigate", href]) },
    });
    navigate(favorite.id);
    assert.deepEqual(actions, [
      "clear",
      ["selection", null],
      ["panel", "root"],
      "collapse",
      ["navigate", favorite.href],
    ]);
    actions.length = 0;
    navigate("/event/untrusted-destination");
    assert.deepEqual(actions, []);
  }
  const denied = evaluate(`return ${variable("handleRootCategoryFavoriteNavigate")};`, {
    useCallback: (callback) => callback,
    categoryFavorites: { favorites: selected },
    hasCreateEventAccess: false,
    clearEventContext: () => assert.fail("denied navigation changed event context"),
    collapseSidebarOnTouch: () => {},
    router: { push: () => assert.fail("denied navigation changed route") },
    setSidebarPage: () => {},
  });
  denied("gymnastics");
  for (const hasCreateEventAccess of [true, false]) {
    const actions = [];
    const navigateDefault = evaluate(`return ${variable("handleRootDefaultCategoryNavigate")};`, {
      useCallback: (callback) => callback,
      categoryFavorites: { favorites: [], defaultCategory: selected[0] },
      hasCreateEventAccess,
      clearEventContext: () => actions.push("clear"),
      setForcedCreateActiveLabel: (value) => actions.push(["selection", value]),
      setSidebarPage: (page) => actions.push(["panel", page]),
      collapseSidebarOnTouch: () => actions.push("collapse"),
      router: { push: (href) => actions.push(["navigate", href]) },
    });
    navigateDefault();
    assert.deepEqual(
      actions,
      hasCreateEventAccess
        ? [
            "clear",
            ["selection", null],
            ["panel", "root"],
            "collapse",
            ["navigate", selected[0].href],
          ]
        : [],
      "the signup default navigates independently of the favorite list and respects current access",
    );
  }
});

test("favorites show a Create-style caption and pencil while normal navigation contains only pinned categories", () => {
  const { html, links } = renderNavigation({ ids: ["school"] });
  assert.match(html, /<section aria-label="Favorite event types"/);
  assert.match(html, /nav-chrome-sidebar-caption[^>]*>Favorites</);
  assert.match(html, /aria-label="Edit favorite categories"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="[^"]+"/);
  assert.doesNotMatch(
    html,
    /<details|<summary|Edit favorites|Favorites are shortcuts|All available event types stay in Create event/,
  );
  assert.doesNotMatch(html, /aria-label="(?:Unpin Gymnastics|Pin School &amp; classroom)"/);
  const favoriteSection = html.match(
    /<section aria-label="Favorite event types"[\s\S]*?<\/section>/,
  )?.[0];
  assert.match(favoriteSection, /School &amp; classroom/);
  assert.doesNotMatch(favoriteSection, /Sign-up Form/);
  assert.equal(
    links.some((link) => link.label === "Schedules"),
    false,
    "an account without schedules has no Schedules entry",
  );
  const withSchedule = renderNavigation({ ids: ["school"], schedulesCount: 1 });
  assert.equal(
    withSchedule.links.find((link) => link.label === "Schedules")?.badge,
    1,
    "a saved schedule reveals its Manage entry",
  );
  const denied = renderNavigation({
    access: resolveCreationAccess({
      policy: "restricted",
      categories: ["gymnastics"],
      products: ["snap"],
    }),
  });
  assert.doesNotMatch(denied.html, /Favorite event types|Edit favorite categories/);
});

test("the public gymnastics signup keeps its persisted category and gallery continuation", () => {
  const landing = readFileSync("src/components/gymnastics-landing/GymnasticsLanding.tsx", "utf8");
  assert.match(landing, /signupSource="gymnastics"/);
  assert.match(
    landing,
    /successRedirectUrl=\{authMode === "signup" \? "\/event\/gymnastics" : "\/"\}/,
  );
  const creation = readFileSync(
    "src/app/event/gymnastics/GymnasticsCreationPageClient.tsx",
    "utf8",
  );
  assert.match(creation, /<GymnasticsDesignGallery\s*\/>/);
});

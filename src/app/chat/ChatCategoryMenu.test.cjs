const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");

let menu;
const fragment = ({ children }) => React.createElement(React.Fragment, null, children);
const element = (tag) => ({ children, ...props }) => React.createElement(tag, props, children);
// Exercise the real menu and navigation data; keep the dialog open during SSR.
// Dialog focus/portal behavior belongs to Radix, not these product-boundary checks.
const mocks = {
  react: { ...React, useState: () => [true, () => {}] },
  "@/contexts/MenuContext": { useMenu: () => menu },
  "lucide-react": Object.fromEntries(
    ["Baby", "Cake", "Gift", "Heart", "PartyPopper", "Plus", "Trophy", "X"].map(name => [name, props => React.createElement("svg", { ...props, "data-icon": name })]),
  ),
  "@radix-ui/react-dialog": {
    Root: fragment, Trigger: fragment, Portal: fragment, Overlay: () => null,
    Content: element("div"), Title: element("h2"), Description: element("p"), Close: element("button"),
  },
};
const cache = new Map();
function load(file) {
  const filename = path.resolve(file);
  if (cache.has(filename)) return cache.get(filename);
  const module = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  function localRequire(name) {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (!name.startsWith("@/") && !name.startsWith(".")) return require(name);
    let target = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(filename), name);
    if (!path.extname(target)) target += fs.existsSync(`${target}.ts`) ? ".ts" : ".tsx";
    return load(target);
  }
  new Function("require", "module", "exports", compiled)(localRequire, module, module.exports);
  cache.set(filename, module.exports);
  return module.exports;
}
const { getCreateEventSections } = load("src/config/navigation-config.tsx");
const ChatCategoryMenu = load("src/app/chat/ChatCategoryMenu.tsx").default;
function renderMenu(overrides = {}) {
  menu = {
    isAdmin: false,
    visibleTemplateKeys: ["birthdays", "weddings"],
    productScopes: ["snap"], defaultCreateIntent: "birthdays",
    featureVisibility: { hasLoadedPreferences: true, loading: false, refresh: async () => {} },
    ...overrides,
  };
  return renderToStaticMarkup(React.createElement(ChatCategoryMenu, {
    disabled: false, hasConversation: false, onSelect: () => {},
  }));
}

test("chat offers enabled event categories without sign-up forms, even for signup-default accounts", () => {
  for (const defaultCreateIntent of ["birthdays", "weddings", "signup_forms"]) {
    const html = renderMenu({ defaultCreateIntent });
    assert.match(html, />Birthdays</);
    assert.match(html, />Weddings</);
    assert.doesNotMatch(html, /Sign-up Form|Sign-ups|Baby Showers|Football/);
    if (defaultCreateIntent === "weddings") assert.ok(html.indexOf(">Weddings<") < html.indexOf(">Birthdays<"));
  }
});

test("admin chat also excludes forms while retaining all event categories", () => {
  const html = renderMenu({ isAdmin: true, visibleTemplateKeys: [], defaultCreateIntent: "signup_forms" });
  for (const label of ["Birthdays", "Weddings", "Anniversaries", "Baby Showers", "Gender Reveal", "Football", "Sports"]) {
    assert.ok(html.includes(`>${label}<`), label);
  }
  assert.doesNotMatch(html, /Sign-up Form|Sign-ups/);
});

test("no enabled event categories gives a clear empty state instead of a form category", () => {
  const html = renderMenu({ visibleTemplateKeys: [], defaultCreateIntent: "signup_forms" });
  assert.match(html, /No event categories are enabled/);
  assert.doesNotMatch(html, /Sign-up Form|Sign-ups|<h3/);
});

test("unloaded or failed preferences never expose category options", () => {
  for (const loading of [true, false]) {
    const html = renderMenu({ featureVisibility: { hasLoadedPreferences: false, loading, refresh: async () => {} } });
    assert.doesNotMatch(html, /Sign-up Form|Sign-ups|>Birthdays<|>Weddings</);
    assert.match(html, loading ? /Loading your categories/ : /Your categories couldn/);
  }
});

test("general Create Event keeps the separate Sign-up Form builder and saved-default ordering", () => {
  const sections = getCreateEventSections(["birthdays"], ["snap"], undefined, { defaultCreateIntent: "signup_forms" });
  assert.equal(sections[0].items[0].label, "Sign-up Form");
  assert.equal(sections[0].items[0].href, "/signup-forms/templates");
  assert.ok(sections.flatMap(section => section.items).some(item => item.label === "Birthdays"));
  const signupOnly = getCreateEventSections([], ["signup_forms"], undefined);
  assert.deepEqual(signupOnly.flatMap(section => section.items).map(item => item.href), ["/signup-forms/templates"]);
});

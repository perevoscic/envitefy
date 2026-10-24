const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");

// Exercise real component handlers without submitting credentials or creating an event.
function componentHarness(file, initialStatus = "unauthenticated") {
  const state = [];
  let cursor = 0;
  let status = initialStatus;
  const AuthModal = () => null;
  const Link = ({ children, ...props }) => React.createElement("a", props, children);
  const cache = new Map();
  const body = {};
  const portalTargets = [];
  const hooks = {
    ...React,
    useId: () => "sample-status",
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial;
      return [
        state[index],
        (next) => {
          state[index] = typeof next === "function" ? next(state[index]) : next;
        },
      ];
    },
  };
  function load(relative) {
    const filename = path.resolve(relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    const localRequire = (name) => {
      if (name === "react") return hooks;
      if (name === "react-dom")
        return {
          createPortal: (children, target) => {
            portalTargets.push(target);
            return children;
          },
        };
      if (name === "next-auth/react") return { useSession: () => ({ status }) };
      if (name === "next/dynamic") return { __esModule: true, default: () => AuthModal };
      if (name === "next/link") return { __esModule: true, default: Link };
      if (name === "lucide-react") return new Proxy({}, { get: () => () => null });
      if (name.startsWith("@/")) return load(path.join("src", `${name.slice(2)}.ts`));
      return require(name);
    };
    new Function("require", "module", "exports", source)(localRequire, module, module.exports);
    return module.exports;
  }
  const Component = load(file).default;
  return {
    render(props = {}) {
      cursor = 0;
      const previousDocument = global.document;
      global.document = { body };
      try {
        return Component(props);
      } finally {
        if (previousDocument === undefined) delete global.document;
        else global.document = previousDocument;
      }
    },
    setStatus(next) {
      status = next;
    },
    AuthModal,
    Link,
    body,
    portalTargets,
  };
}

function elements(tree) {
  const result = [];
  function visit(value) {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!React.isValidElement(value)) return;
    result.push(value);
    visit(value.props.children);
  }
  visit(tree);
  return result;
}

function click(overrides = {}) {
  return {
    button: 0,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    ...overrides,
  };
}

for (const href of ["/create", "/live-cards", "/live-cards?create=1", "/event/gender-reveal"]) {
  test(`signed-out creation preserves ${href} through signup and login`, () => {
    const harness = componentHarness("src/components/marketing/PublicCreationLink.tsx");
    const props = { href, children: "Create" };
    let nodes = elements(harness.render(props));
    const link = nodes.find((node) => node.type === harness.Link);
    assert.equal(link.props.href, href);
    const event = click();
    link.props.onClick(event);
    assert.equal(event.defaultPrevented, true);
    nodes = elements(harness.render(props));
    let modal = nodes.find((node) => node.type === harness.AuthModal);
    assert.equal(modal.props.mode, "signup");
    assert.equal(modal.props.successRedirectUrl, href);
    assert.equal(
      harness.portalTargets.at(-1),
      harness.body,
      "Auth dialog escapes transformed hero ancestors",
    );
    if (href === "/event/gender-reveal") {
      assert.equal(modal.props.signupIntent, "gender_reveal");
      assert.equal(modal.props.signupSource, "gender_reveal");
    }
    modal.props.onModeChange("login");
    modal = elements(harness.render(props)).find((node) => node.type === harness.AuthModal);
    assert.equal(modal.props.mode, "login");
    assert.equal(modal.props.successRedirectUrl, href);
    modal.props.onClose();
    assert.equal(
      elements(harness.render(props)).some((node) => node.type === harness.AuthModal),
      false,
    );
  });
}

test("authenticated creation links retain native navigation and exact destinations", () => {
  const harness = componentHarness(
    "src/components/marketing/PublicCreationLink.tsx",
    "authenticated",
  );
  const link = elements(harness.render({ href: "/live-cards?create=1", children: "Create" })).find(
    (node) => node.type === harness.Link,
  );
  const event = click();
  link.props.onClick(event);
  assert.equal(event.defaultPrevented, false);
  assert.equal(link.props.href, "/live-cards?create=1");
  assert.equal(link.props["aria-haspopup"], undefined);
});

test("modified clicks and already handled link presses keep native behavior", () => {
  const harness = componentHarness("src/components/marketing/PublicCreationLink.tsx");
  for (const modifiers of [
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { button: 1 },
  ]) {
    const link = elements(harness.render({ href: "/create", children: "Create" })).find(
      (node) => node.type === harness.Link,
    );
    const event = click(modifiers);
    link.props.onClick(event);
    assert.equal(event.defaultPrevented, false);
  }
  assert.equal(
    elements(harness.render({ href: "/create" })).some((node) => node.type === harness.AuthModal),
    false,
  );
});

test("signup sample claims and undoes a local Cake walk spot without a request", () => {
  const harness = componentHarness("src/app/category-pages/SignupBoardPreview.tsx");
  const originalFetch = global.fetch;
  global.fetch = () => {
    throw new Error("A sample action must never submit a response");
  };
  try {
    let tree = harness.render();
    let html = renderToStaticMarkup(tree);
    assert.match(html, /Interactive sample/);
    assert.match(html, /No response is saved or sent/);
    assert.match(html, /3\/4/);
    assert.match(html, /aria-pressed="false"/);
    elements(tree)
      .find((node) => node.type === "button")
      .props.onClick();
    tree = harness.render();
    html = renderToStaticMarkup(tree);
    assert.match(html, /Sample Cake walk spot claimed/);
    assert.match(html, />32<\/p>/);
    assert.match(html, />13<\/p>/);
    assert.match(html, /aria-pressed="true"/);
    assert.doesNotMatch(html, /3\/4/);
    elements(tree)
      .find((node) => node.type === "button")
      .props.onClick();
    html = renderToStaticMarkup(harness.render());
    assert.match(html, /3\/4/);
    assert.match(html, />31<\/p>/);
    assert.match(html, />14<\/p>/);
  } finally {
    global.fetch = originalFetch;
  }
});

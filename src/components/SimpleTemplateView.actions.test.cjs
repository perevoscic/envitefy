const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

let renderedActions;
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "lucide-react") {
    const file = path.join(process.cwd(), "node_modules/lucide-react/dist/cjs/lucide-react.js");
    const mod = new Module(file, parent);
    mod.paths = Module._nodeModulePaths(path.dirname(file));
    mod._compile(fs.readFileSync(file, "utf8"), file);
    return mod.exports;
  }
  // Unrelated owner controls and map integrations aren't used in the guest render.
  if (
    [
      "@/components/EventDeleteModal",
      "@/components/EventActions",
      "@/components/StaticMap",
      "@/components/event-templates/EventGuestActions",
    ].includes(request)
  )
    return () => null;
  if (request === "@/components/design-panel") return { applyTheme() {} };
  const loaded = originalLoad.call(this, request, parent, isMain);
  if (request === "@/components/gym-meet-templates/GymMeetTemplateRenderer") {
    return {
      ...loaded,
      __esModule: true,
      default: (props) => {
        renderedActions = props;
        return React.createElement(loaded.default, props);
      },
    };
  }
  return loaded;
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return originalResolve.call(
    this,
    request.startsWith("@/") ? path.join(process.cwd(), "src", request.slice(2)) : request,
    parent,
    ...rest,
  );
};
for (const ext of [".ts", ".tsx"])
  Module._extensions[ext] = (mod, file) =>
    mod._compile(
      ts.transpileModule(fs.readFileSync(file, "utf8"), {
        fileName: file,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
      file,
    );
Module._extensions[".css"] = (mod) => {
  mod.exports = new Proxy({}, { get: (_, key) => (key === "__esModule" ? false : String(key)) });
};

const SimpleTemplateView = require("./SimpleTemplateView.tsx").default;
const props = {
  eventId: "saved-meet",
  eventTitle: "Fright Invite",
  eventData: {
    category: "gymnastics",
    pageTemplateId: "airborne-atlas",
    date: "2026-10-23",
    time: "14:00",
    venue: "Coral Springs Gymnasium",
    rsvpEnabled: false,
  },
  isOwner: false,
  isReadOnly: true,
  viewerKind: "guest",
  hideOwnerActions: true,
  sessionEmail: null,
  shareUrl: "/event/fright-invite",
};

function render(overrides = {}) {
  renderedActions = null;
  const html = renderToStaticMarkup(
    React.createElement(SimpleTemplateView, { ...props, ...overrides }),
  );
  assert.ok(renderedActions, "the real event component reached the gymnastics renderer");
  return { html, actions: renderedActions };
}

function browser(t, navigator) {
  const calls = { alerts: [], copies: [], prompts: [], shares: [] };
  for (const [name, value] of Object.entries({
    window: {
      location: { origin: "https://envitefy.example" },
      prompt: (...args) => calls.prompts.push(args),
    },
    navigator: navigator(calls),
    alert: (message) => calls.alerts.push(message),
  })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() =>
      descriptor ? Object.defineProperty(globalThis, name, descriptor) : delete globalThis[name],
    );
  }
  return calls;
}

test("the full saved event renders with live Share and provider callbacks above the hero", () => {
  for (const viewerKind of ["owner", "guest", "readonly"]) {
    const { html, actions } = render({ viewerKind, isOwner: viewerKind === "owner" });
    assert.ok(html.includes("Fright Invite"));
    assert.ok(html.indexOf('aria-label="Share event"') < html.indexOf("<h1"));
    for (const action of ["onShare", "onGoogleCalendar", "onAppleCalendar", "onOutlookCalendar"])
      assert.equal(typeof actions[action], "function", action);
  }
});

test("Share sends the saved public event to the native chooser", async (t) => {
  const { actions } = render();
  const calls = browser(t, (calls) => ({ share: async (data) => calls.shares.push(data) }));
  await actions.onShare();
  assert.deepEqual(calls.shares, [
    { title: "Fright Invite", url: "https://envitefy.example/event/fright-invite" },
  ]);
  assert.deepEqual(calls.alerts, []);
});

test("dismissing native Share does not copy or prompt", async (t) => {
  const { actions } = render();
  const calls = browser(t, (calls) => ({
    share: async () => {
      const error = new Error("Dismissed");
      error.name = "AbortError";
      throw error;
    },
    clipboard: { writeText: async (text) => calls.copies.push(text) },
  }));
  await actions.onShare();
  assert.deepEqual(calls.copies, []);
  assert.deepEqual(calls.prompts, []);
});

test("Share falls back to copying the public link", async (t) => {
  const { actions } = render();
  const calls = browser(t, (calls) => ({
    clipboard: { writeText: async (text) => calls.copies.push(text) },
  }));
  await actions.onShare();
  assert.deepEqual(calls.copies, ["https://envitefy.example/event/fright-invite"]);
  assert.deepEqual(calls.alerts, ["Event link copied."]);
});

test("Share offers a manual copy when the clipboard is unavailable", async (t) => {
  const { actions } = render();
  const calls = browser(t, () => ({}));
  await actions.onShare();
  assert.deepEqual(calls.prompts, [
    ["Copy your event link:", "https://envitefy.example/event/fright-invite"],
  ]);
});

test("an unsaved preview cannot share a fabricated event URL", async (t) => {
  const { actions } = render({ eventId: "preview", shareUrl: "" });
  const calls = browser(t, (calls) => ({ share: async (data) => calls.shares.push(data) }));
  await actions.onShare();
  assert.deepEqual(calls.shares, []);
  assert.deepEqual(calls.alerts, ["Publish your event to get a shareable link."]);
});

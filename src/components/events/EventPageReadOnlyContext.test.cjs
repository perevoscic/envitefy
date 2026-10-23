const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const h = React.createElement;

function load(file, imports = {}, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.resolve(file), "utf8"), {
    fileName: file,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", "window", "navigator", source)(
    (name) => {
      if (name in imports) return imports[name];
      if (name === "react" || name.startsWith("react/")) return require(name);
      if (name === "lucide-react") return new Proxy({}, { get: () => () => h("svg") });
      if (name.endsWith(".css")) return new Proxy({}, { get: (_, key) => key });
      return {};
    },
    mod,
    mod.exports,
    globals.window,
    globals.navigator,
  );
  return mod.exports;
}

const context = load("src/components/events/EventPageReadOnlyContext.tsx");
const { EventSectionsReadOnly } = load("src/components/events/EventSectionBuilder.tsx", {
  "./EventPageReadOnlyContext": context,
});
const Hero = load("src/components/events/HeroImageEditor.tsx", {
  "./EventPageReadOnlyContext": context,
}).default;
const Inline = load("src/components/events/InlineEditableText.tsx", {
  "./EventPageReadOnlyContext": context,
}).default;
const actions = load("src/lib/event-guest-actions.ts");
const planning = load("src/lib/event-guest-planning.ts");
const guestImports = {
  "@/components/events/EventPageReadOnlyContext": context,
  "@/components/templates/TemplateEditorContext": {
    useTemplateEditor: () => ({ requestSave: async () => {} }),
  },
  "@/lib/event-guest-actions": actions,
  "@/lib/event-guest-planning": planning,
  "@/lib/directions": {
    buildGoogleMapsDirectionsHref: (value) => `https://maps.example/${encodeURIComponent(value)}`,
  },
};
const GuestActions = load(
  "src/components/event-templates/EventGuestActions.tsx",
  guestImports,
).default;

test("clean page scope hides editing tools while retaining host copy and guest actions", () => {
  const content = () =>
    h(
      React.Fragment,
      null,
      h(Hero, { value: "/host-artwork.webp", onChange() {} }),
      h(
        "h1",
        null,
        h(Inline, {
          label: "Page title",
          value: "Host title",
          fallback: "Template title",
          onChange() {},
        }),
      ),
      h(GuestActions, {
        location: "North entrance",
        visibility: { calendar: false },
        onVisibilityChange() {},
      }),
    );
  const clean = renderToStaticMarkup(h(EventSectionsReadOnly, null, content()));
  assert.match(clean, /<h1>Host title<\/h1>/);
  assert.match(clean, /aria-label="Get directions"/);
  assert.match(clean, /aria-label="Share event"/);
  assert.doesNotMatch(
    clean,
    /data-hero-image-control|Edit page title|data-remove-action|data-restore-action|Removed actions/,
  );
  const editing = renderToStaticMarkup(h(EventSectionsReadOnly, { readOnly: false }, content()));
  assert.match(editing, /data-hero-image-control/);
  assert.match(editing, /Edit page title/);
  assert.match(editing, /data-remove-action="share"/);
  assert.match(editing, /data-restore-action="calendar"/);
  assert.equal(
    renderToStaticMarkup(content()),
    editing,
    "existing editors outside the clean workspace retain editing controls",
  );
});

test("nested scopes cannot enable editing inside a clean page", () => {
  function Probe() {
    return h("output", null, context.useEventPageReadOnly() ? "clean" : "editing");
  }
  const html = renderToStaticMarkup(
    h(
      context.EventPageReadOnlyProvider,
      { readOnly: true },
      h(EventSectionsReadOnly, { readOnly: false }, h(Probe)),
    ),
  );
  assert.equal(html, "<output>clean</output>");
});

test("sharing from a clean page never requests a template save or changes visibility", async () => {
  for (const preview of [false, true]) {
    let saves = 0;
    const copied = [],
      states = [];
    const Component = load(
      "src/components/event-templates/EventGuestActions.tsx",
      {
        ...guestImports,
        react: {
          useRef: () => ({ current: null }),
          useState: (value) => [value, (next) => states.push(next)],
        },
        "@/components/events/EventPageReadOnlyContext": { useEventPageReadOnly: () => true },
        "@/components/templates/TemplateEditorContext": {
          useTemplateEditor: () => ({
            requestSave: async () => {
              saves++;
            },
          }),
        },
      },
      {
        window: { location: { origin: "https://envitefy.com" } },
        navigator: {
          clipboard: {
            writeText: async (value) => {
              copied.push(value);
            },
          },
        },
      },
    ).default;
    const tree = Component({
      preview,
      shareUrl: "https://envitefy.com/event/family-party",
      onVisibilityChange: () => assert.fail("clean pages cannot change action visibility"),
    });
    const flatten = (node) =>
      !node || typeof node !== "object"
        ? []
        : [node, ...[node.props?.children].flat().flatMap(flatten)];
    const share = flatten(tree).find((node) => node.props?.["aria-label"] === "Share event");
    share.props.onClick();
    await Promise.resolve();
    assert.equal(saves, 0);
    assert.deepEqual(copied, preview ? [] : ["https://envitefy.com/event/family-party"]);
    assert.ok(
      states.includes(
        preview ? "Publish your event to get a shareable link." : "Event link copied.",
      ),
    );
    assert.equal(
      flatten(tree).some(
        (node) => node.props?.["data-remove-action"] || node.props?.["data-restore-action"],
      ),
      false,
    );
  }
});

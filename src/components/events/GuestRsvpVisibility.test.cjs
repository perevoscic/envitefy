const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const assert = require("node:assert/strict");
const test = require("node:test");
const ts = require("typescript");
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === "lucide-react") {
    const file = path.join(process.cwd(), "node_modules/lucide-react/dist/cjs/lucide-react.js");
    const mod = new Module(file, parent);
    mod.paths = Module._nodeModulePaths(path.dirname(file));
    mod._compile(fs.readFileSync(file, "utf8"), file);
    return mod.exports;
  }
  return originalLoad.call(this, request, parent, isMain);
};
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...rest) {
  return resolve.call(this, request.startsWith("@/") ? path.join(process.cwd(), "src", request.slice(2)) : request, parent, ...rest);
};
for (const ext of [".ts", ".tsx"]) Module._extensions[ext] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
  fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
}).outputText, file);
Module._extensions[".css"] = mod => { mod.exports = new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) }); };
const React = require("react");
const { renderToStaticMarkup: render } = require("react-dom/server");
const Wedding = require("../weddings/WeddingRenderer.tsx").default;
test("disabled RSVP removes guest RSVP sections and links from every wedding design", () => {
  const failures = [];
  for (const design of JSON.parse(fs.readFileSync("templates/weddings/index.json", "utf8"))) {
    const template = JSON.parse(fs.readFileSync(`templates/weddings/${design.id}/config.json`, "utf8"));
    const html = render(React.createElement(Wedding, { template, hideGuestTools: true, event: {
      headlineTitle: "Alex & Sam", gallery: [], schedule: [], rsvpEnabled: false,
      rsvp: { url: "https://example.test/stale-rsvp", deadline: "2027-04-10" },
    } }));
    const enabled = render(React.createElement(Wedding, { template, hideGuestTools: true, event: {
      headlineTitle: "Alex & Sam", gallery: [], schedule: [], rsvpEnabled: true,
      rsvp: { url: "https://example.test/stale-rsvp", deadline: "2027-04-10" },
    } }));
    assert.match(enabled, /id="rsvp"|RSVP|stale-rsvp/i, `${design.id}: enabled RSVP stays available`);
    if (/id="rsvp"|href="[^"]*(?:#rsvp|stale-rsvp)/i.test(html) || /\bRSVP\b/.test(html.replace(/<[^>]+>/g, " "))) failures.push(design.id);
  }
  assert.deepEqual(failures, [], "disabled designs must not render RSVP controls or sections");
});

test("disabled birthday RSVP hides response forms and previous response summaries", () => {
  const Birthday = require("../birthdays/BirthdayRenderer.tsx").default;
  const { CELEBRATION_DESIGN_CATALOG } = require("../../data/birthday-design-catalog.ts");
  for (const template of CELEBRATION_DESIGN_CATALOG) {
    const html = render(React.createElement(Birthday, { template, event: {
      birthdayName: "Alex", gallery: [], rsvpEnabled: false, rsvpDeadline: "2027-04-10",
    }, userRsvpResponse: "yes", onRsvpClick() {} }));
    assert.doesNotMatch(html, /Will you be joining us|id="rsvp"|data-rsvp-response|>RSVP</i, template.id);
  }
});

const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
let rsvpProps;
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "@/components/EventRsvpPrompt") return (props) => { rsvpProps = props; return React.createElement("div", { "data-rsvp": true }); };
  if (request === "@/components/CalendarAction") return () => React.createElement("button", null, "Add to Calendar");
  if (request === "@/components/EventTrackedLink") return ({ children, ...props }) => React.createElement("a", { href: props.href }, children);
  if (request === "lucide-react") return new Proxy({}, { get: (_, key) => key === "__esModule" ? false : () => null });
  return originalLoad.call(this, request, parent, isMain);
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return originalResolve.call(this, request.startsWith("@/") ? path.join(process.cwd(), "src", request.slice(2)) : request, parent, ...rest);
};
for (const ext of [".ts", ".tsx"]) Module._extensions[ext] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file);
Module._extensions[".css"] = (mod) => { mod.exports = {}; };
const Website = require("./ConciergeEventWebsite.tsx").default;
const props = {
  eventId: "test-preview", title: "Lantern Workshop", category: "Workshop", imageUrl: "/archived.webp",
  venueName: "Maple Center", location: "Maple Center, Room B, 23 Oak Street",
  whenLabel: "September 23, 2026 at 2–4 PM", guestInstructions: ["Bring goggles.", "No gifts, please."], requiredArtworkLines: ["No gifts, please."],
};
test("actual guest renderer exposes full logistics and physical directions without duplicated venue", () => {
  const html = renderToStaticMarkup(React.createElement(Website, props));
  assert.match(html, /Maple Center, Room B, 23 Oak Street/);
  assert.doesNotMatch(html, /Maple Center, Maple Center/);
  assert.match(html, /Directions/);
  assert.match(html, /23(?:\+|%20)Oak(?:\+|%20)Street/);
  assert.match(html, /Bring goggles\./);
  assert.equal(html.split("No gifts, please.").length, 2);
});
test("preview shares real RSVP/content renderer but inhibits server writes", () => {
  renderToStaticMarkup(React.createElement(Website, { ...props, category: "Gender Reveal", previewMode: true, showRsvp: true, directRsvpEnabled: true }));
  assert.equal(rsvpProps.previewMode, true);
  assert.equal(rsvpProps.eventCategory, "Gender Reveal");
});
test("approved page lettering changes are rendered as HTML typography with scoped hero contrast", () => {
  const html = renderToStaticMarkup(React.createElement(Website, { ...props, pageTypography: { scale: 1.2, contrast: "high" } }));
  assert.match(html, /--event-page-type-scale:1.2/);
  assert.match(html, /data-event-page-hero/);
});

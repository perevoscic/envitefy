const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

// Compile the real component and URL helpers without making map requests.
const originalResolve = Module._resolveFilename;
const originalExtensions = new Map([".ts", ".tsx"].map((ext) => [ext, Module._extensions[ext]]));
let MapEmbed;
try {
  Module._resolveFilename = function (request, parent, ...rest) {
    const resolved = request === "@/lib/geocoding"
      ? path.join(__dirname, "../lib/geocoding.ts")
      : request;
    return originalResolve.call(this, resolved, parent, ...rest);
  };
  for (const ext of originalExtensions.keys()) {
    Module._extensions[ext] = (mod, file) => mod._compile(ts.transpileModule(
      fs.readFileSync(file, "utf8"),
      { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
    ).outputText, file);
  }
  MapEmbed = require("./MapEmbed.tsx").default;
} finally {
  Module._resolveFilename = originalResolve;
  for (const [ext, original] of originalExtensions) {
    if (original) Module._extensions[ext] = original;
    else delete Module._extensions[ext];
  }
}

function renderMap(props, key) {
  const previous = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  try {
    if (key) process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = key;
    else delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    return renderToStaticMarkup(React.createElement(MapEmbed, {
      latitude: 41.88, longitude: -87.63, ...props,
    }));
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    else process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = previous;
  }
}

test("configured maps render without crashing and label the supplied location", () => {
  const html = renderMap({ query: "  Maple Center, Room B  " }, "offline-test-key");
  assert.match(html, /<iframe/);
  assert.match(html, /title="Map for Maple Center, Room B"/);
  assert.match(html, /q=Maple%20Center%2C%20Room%20B/);
});

test("coordinate-only maps have a usable accessible title and destination", () => {
  for (const query of [undefined, null, "", "   "]) {
    const html = renderMap({ query }, "offline-test-key");
    assert.match(html, /title="Map for 41.88, -87.63"/);
    assert.match(html, /q=41.88,-87.63/);
    assert.doesNotMatch(html, /undefined|null/);
  }
});

test("maps without an API key keep the external search link fallback", () => {
  const html = renderMap({ query: "Maple Center" });
  assert.doesNotMatch(html, /<iframe/);
  assert.match(html, /maps\/search\/\?api=1&amp;query=Maple%20Center/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
});

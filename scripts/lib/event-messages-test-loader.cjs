const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const ts = require("typescript");

module.exports = function loadTs(relative, stubs = {}, cache = new Map()) {
  const filename = path.resolve(relative);
  if (cache.has(filename)) return cache.get(filename);
  // JSON is data, not TypeScript. Transpiling it silently discards its exports.
  if (filename.endsWith(".json")) {
    const value = JSON.parse(fs.readFileSync(filename, "utf8"));
    cache.set(filename, value);
    return value;
  }
  if (filename.endsWith(".css")) return new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) });
  const loaded = { exports: {} };
  cache.set(filename, loaded.exports);
  const nativeRequire = createRequire(filename);
  const localRequire = (name) => {
    if (Object.hasOwn(stubs, name)) return stubs[name];
    if (name.startsWith("@/") || name.startsWith(".")) {
      const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(filename), name);
      const target = [base, ...[".ts", ".tsx", ".js", ".jsx", ".json"].map(extension => `${base}${extension}`)]
        .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (!target) throw new Error(`Cannot resolve test module ${JSON.stringify(name)} from ${filename}`);
      return module.exports(target, stubs, cache);
    }
    return nativeRequire(name);
  };
  try {
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      // .mjs/.mts force ESM output even with module: CommonJS. Keep their source
      // path for resolution, but use a CommonJS filename for this evaluator.
      fileName: /\.(mjs|mts)$/i.test(filename) ? `${filename}.cts` : filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    new Function("exports", "require", "module", "__filename", "__dirname", code)(loaded.exports, localRequire, loaded, filename, path.dirname(filename));
    cache.set(filename, loaded.exports);
    return loaded.exports;
  } catch (error) {
    cache.delete(filename);
    throw error;
  }
};

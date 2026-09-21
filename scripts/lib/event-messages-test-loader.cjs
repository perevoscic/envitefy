const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

module.exports = function loadTs(relative, stubs = {}, cache = new Map()) {
  const filename = path.resolve(relative);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const localRequire = (name) => {
    if (Object.hasOwn(stubs, name)) return stubs[name];
    if (name.startsWith("@/") || name.startsWith(".")) {
      const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(filename), name);
      const target = fs.existsSync(base) && fs.statSync(base).isFile() ? base : `${base}.ts`;
      return module.exports(target, stubs, cache);
    }
    return require(name);
  };
  new Function("exports", "require", code)(exports, localRequire);
  return exports;
};

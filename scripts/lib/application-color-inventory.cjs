const fs = require("node:fs");
const path = require("node:path");

// Read every production source, including shared class maps. The browser audit
// exercises these exact utilities rather than a separately maintained sample.
module.exports = function applicationColorInventory(root = path.resolve("src")) {
  const files = [];
  const surfaces = new Map();
  const inks = new Map();
  const add = (map, token, file) => {
    if (!map.has(token)) map.set(token, new Set());
    map.get(token).add(path.relative(process.cwd(), file));
  };
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!/^(?:__tests__|__fixtures__|fixtures)$/.test(entry.name)) walk(filename);
      } else if (/\.(?:[cm]?[jt]sx?|css)$/.test(filename) && !/\.(?:test|spec|stories|story)\./.test(filename)) files.push(filename);
    }
  }
  walk(root);
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    if (file.endsWith(".css")) continue;
    for (const match of source.matchAll(/(?<![\w:-])(?:hover:)?bg-(?:white|(?:(?:slate|gray|zinc|neutral|stone)-(?:50|100|200|300)|(?:rose|red|pink|amber|yellow|orange|green|emerald|teal|cyan|sky|blue|purple|violet|indigo)-(?:50|100|200)))(?:\/(?:\d+(?:\.\d+)?|\[[\d.]+\]))?(?![\w/-])/g)) {
      const token = match[0];
      const opacity = Number(token.match(/\/(\d+(?:\.\d+)?)$/)?.[1] ?? 100);
      // Low-opacity white is a highlight on artwork/dark photography, not paper.
      if (token.includes("bg-white/") && opacity < 50) continue;
      if (token.includes("[")) continue;
      add(surfaces, token, file);
    }
    for (const match of source.matchAll(/(?<![\w:-])text-(?:black|(?:slate|gray|zinc|neutral|stone|rose|red|pink|amber|yellow|orange|green|emerald|teal|cyan|sky|blue|purple|violet|indigo)-(?:400|500|600|700|800|900|950))(?:\/\d+)?(?![\w/-])/g)) {
      if (Number(match[0].match(/\/(\d+)$/)?.[1] ?? 100) < 80) continue;
      add(inks, match[0], file);
    }
  }
  const serialize = map => Object.fromEntries([...map].sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => [key, [...values].sort()]));
  return { filesScanned: files.length, surfaces: serialize(surfaces), inks: serialize(inks) };
};

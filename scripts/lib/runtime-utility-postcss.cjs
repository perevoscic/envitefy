const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const stale = (reason) => new Error(`Runtime utility delivery is stale (${reason}). Run npm run build or node scripts/build-runtime-utilities.mjs before invoking next build directly.`);

module.exports = () => ({
  postcssPlugin: "envitefy-runtime-utilities",
  OnceExit(root, { result }) {
    const filename = root.source?.input?.file || result.opts.from;
    if (!filename || path.resolve(filename) !== path.resolve("src/app/globals.css")) return;
    const project = path.resolve(".");
    let metadata;
    try { metadata = JSON.parse(fs.readFileSync(path.join(project, "config/runtime-utilities.generated.json"), "utf8")); }
    catch { throw stale("missing generated manifest"); }
    for (const [relative, expected] of Object.entries(metadata.sourceHashes)) {
      let content;
      try { content = fs.readFileSync(path.join(project, relative)); } catch { throw stale(`missing ${relative}`); }
      if (sha256(content.toString("utf8").replaceAll("\r\n", "\n")) !== expected) throw stale(relative);
    }
    const layers = [];
    root.walkAtRules("layer", (layer) => { if (layer.params === "utilities") layers.push(layer); });
    const entries = [];
    function visit(node, context) {
      if (node.type === "comment") return;
      if (node.type === "rule") entries.push({ node, key: JSON.stringify([...context, node.selector].map((value) => value.replaceAll("\r\n", "\n"))) });
      else if (node.type === "atrule" && node.nodes) for (const child of node.nodes) visit(child, [...context, `@${node.name} ${node.params}`]);
      else throw stale(`unsupported utility node ${node.type}`);
    }
    for (const layer of layers) for (const node of layer.nodes || []) visit(node, []);
    if (sha256(entries.map(({ key, node }) => `${key}\n${node.toString().replaceAll("\r\n", "\n")}`).join("\n")) !== metadata.fullUtilityHash) throw stale("runtime utility declarations changed");
    if (!fs.existsSync(path.join(project, "public", metadata.href))) throw stale("missing immutable utility stylesheet");
    const critical = new Set(metadata.criticalSelectors);
    for (const { key, node } of entries) if (!critical.has(key)) node.remove();
    function prune(node) {
      for (const child of [...node.nodes || []]) if (child.type === "atrule" && child.nodes) { prune(child); if (!child.nodes.length) child.remove(); }
    }
    for (const layer of layers) prune(layer);
  },
});
module.exports.postcss = true;

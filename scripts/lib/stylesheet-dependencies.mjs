import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

/** Follow local runtime imports, retaining CSS modules' original file identity. */
export function stylesheetDependencies(entry, { root = process.cwd(), includeDynamic = true } = {}) {
  const visited = new Set();
  const styles = new Set();
  const extensions = ["", ".tsx", ".ts", ".jsx", ".js", ".mjs", "/index.tsx", "/index.ts", "/index.js"];
  function resolve(from, specifier) {
    if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return;
    const base = specifier.startsWith("@/")
      ? path.resolve(root, "src", specifier.slice(2))
      : path.resolve(path.dirname(from), specifier);
    return extensions.map(extension => base + extension)
      .find(filename => fs.existsSync(filename) && fs.statSync(filename).isFile());
  }
  function walk(filename) {
    if (visited.has(filename)) return;
    visited.add(filename);
    if (filename.endsWith(".css")) {
      styles.add(path.relative(root, filename).split(path.sep).join("/"));
      return;
    }
    if (!/\.[cm]?[jt]sx?$/.test(filename)) return;
    const source = ts.createSourceFile(filename, fs.readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true);
    function visit(node) {
      let specifier;
      if (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly) {
        const bindings = node.importClause?.namedBindings;
        if (!node.importClause?.name && bindings && ts.isNamedImports(bindings) && bindings.elements.every(item => item.isTypeOnly)) return;
        specifier = node.moduleSpecifier;
      } else if (ts.isExportDeclaration(node) && !node.isTypeOnly) {
        if (node.exportClause && ts.isNamedExports(node.exportClause) && node.exportClause.elements.every(item => item.isTypeOnly)) return;
        specifier = node.moduleSpecifier;
      } else if (includeDynamic && ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        specifier = node.arguments[0];
      }
      if (specifier && ts.isStringLiteral(specifier)) {
        const dependency = resolve(filename, specifier.text);
        if (dependency) walk(dependency);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  walk(path.resolve(root, entry));
  return [...styles].sort();
}

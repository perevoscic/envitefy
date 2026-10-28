import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

export const HOMEPAGE_RUNTIME_ROOTS = [
  "src/app/landing/LandingExperience.tsx",
  "src/app/AppShell.tsx",
  "src/app/providers.tsx",
  // These dynamic imports are available without leaving the homepage.
  "src/components/auth/AuthModal.tsx",
  "src/components/navigation/MenuBottomSheet.tsx",
  "src/components/navigation/ConciergeSheet.tsx",
  "src/components/landing/LandingLiveCardShowcase.tsx",
];
export const HOMEPAGE_DIRECT_SOURCES = ["src/app/layout.tsx", "src/app/landing/page.tsx", "src/components/FontCatalogStyles.tsx", "src/components/RuntimeUtilityStyles.tsx"];
// These root-shell dynamic imports activate only after authentication or another
// creation route; RuntimeUtilityStyles supplies their complete original styles.
export const NON_HOMEPAGE_DYNAMIC_IMPORTS = new Set([
  "src/app/AppShell.tsx:./left-sidebar",
  "src/app/AppShell.tsx:@/components/account/CategoryInterestOnboarding",
  "src/app/GlobalEventCreate.tsx:@/components/EventCreateModal",
]);
const extensions = [".tsx", ".ts", ".js", ".jsx", ".mjs", ".json", "/index.tsx", "/index.ts"];
const slash = (value) => value.replaceAll("\\", "/");
export const sha256 = (value) => createHash("sha256").update(value).digest("hex");
export const sourceHash = (value) => sha256(value.toString().replaceAll("\r\n", "\n"));

export async function homepageRuntimeSources(project) {
  const files = new Map();
  const dynamicImports = [];
  async function resolve(name, from) {
    if (!name.startsWith("@/") && !name.startsWith(".")) return;
    const base = name.startsWith("@/") ? path.join(project, "src", name.slice(2)) : path.resolve(path.dirname(from), name);
    for (const candidate of [base, ...extensions.map((extension) => base + extension)]) {
      try { if ((await fs.stat(candidate)).isFile()) return candidate; } catch {}
    }
    throw new Error(`Cannot resolve homepage runtime dependency ${name} from ${from}`);
  }
  async function visit(file, followImports = true) {
    const relative = slash(path.relative(project, file));
    if (files.has(relative) || file.endsWith(".css")) return;
    const content = await fs.readFile(file, "utf8");
    files.set(relative, content);
    if (!followImports || file.endsWith(".json")) return;
    const parsed = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
    const dependencies = [];
    function inspect(node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) && !node.importClause?.isTypeOnly && !node.isTypeOnly) dependencies.push(node.moduleSpecifier.text);
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        const name = node.arguments[0].text;
        if (name.startsWith("@/") || name.startsWith(".")) {
          dynamicImports.push({ file: relative, target: name });
          if (!NON_HOMEPAGE_DYNAMIC_IMPORTS.has(`${relative}:${name}`)) dependencies.push(name);
        }
      }
      ts.forEachChild(node, inspect);
    }
    inspect(parsed);
    for (const name of dependencies) {
      const target = await resolve(name, file);
      if (target) await visit(target);
    }
  }
  for (const source of HOMEPAGE_RUNTIME_ROOTS) await visit(path.join(project, source));
  for (const source of HOMEPAGE_DIRECT_SOURCES) await visit(path.join(project, source), false);
  return { files: new Map([...files].sort(([left], [right]) => left.localeCompare(right))), dynamicImports };
}

export function utilityNodes(root) {
  const layers = [];
  root.walkAtRules("layer", (layer) => { if (layer.params === "utilities") layers.push(layer); });
  return layers.flatMap((layer) => layer.nodes || []).filter((node) => node.type !== "comment");
}

export function utilityEntries(root) {
  const result = [];
  function visit(node, context) {
    if (node.type === "comment") return;
    if (node.type === "rule") result.push({ node, key: JSON.stringify([...context, node.selector].map((value) => value.replaceAll("\r\n", "\n"))) });
    else if (node.type === "atrule" && node.nodes) {
      for (const child of node.nodes) visit(child, [...context, `@${node.name} ${node.params}`]);
    } else throw new Error(`Unsupported utility node ${node.type}: ${node.toString().slice(0, 100)}`);
  }
  for (const node of utilityNodes(root)) visit(node, []);
  return result;
}

export function utilityDigest(entries) {
  return sha256(entries.map(({ key, node }) => `${key}\n${node.toString().replaceAll("\r\n", "\n")}`).join("\n"));
}

export function filterUtilityEntries(root, keys) {
  for (const entry of utilityEntries(root)) if (!keys.has(entry.key)) entry.node.remove();
  root.walkAtRules("layer", (layer) => {
    if (layer.params !== "utilities") return;
    const prune = (node) => {
      for (const child of [...node.nodes || []]) if (child.type === "atrule" && child.nodes) { prune(child); if (!child.nodes.length) child.remove(); }
    };
    prune(layer);
  });
}

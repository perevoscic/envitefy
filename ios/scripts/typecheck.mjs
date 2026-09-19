import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const configFile = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
if (configFile.error)
  throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
// Avoid loading every unrelated JS test and generated Next.js file in this large repository.
const entries = [
  "src/lib/mobile-auth-contract.ts",
  "src/lib/mobile-auth.ts",
  "src/lib/native-ios.ts",
  "src/lib/pwa/install-state.ts",
  "src/components/NativeIOSBridge.tsx",
  "src/app/api/mobile/auth/authorize/route.ts",
  "src/app/api/mobile/auth/exchange/route.ts",
  "src/app/mobile/sign-in/page.tsx",
  "src/app/mobile/sign-in/MobileSignIn.tsx",
  "src/components/auth/LoginForm.tsx",
  "src/components/auth/SignupForm.tsx",
];
const program = ts.createProgram(
  entries.map((file) => path.join(root, file)),
  { ...config.options, incremental: false, noEmit: true },
);
const diagnostics = ts.getPreEmitDiagnostics(program);
const entryPaths = new Set(entries.map((file) => path.normalize(path.join(root, file))));
const local = diagnostics.filter(
  (item) => !item.file || entryPaths.has(path.normalize(item.file.fileName)),
);
const external = diagnostics.length - local.length;
const format = {
  getCurrentDirectory: () => root,
  getCanonicalFileName: (file) => file,
  getNewLine: () => "\n",
};
if (local.length) console.error(ts.formatDiagnosticsWithColorAndContext(local, format));
console.log(
  `${local.length} diagnostics in iOS integration files; ${external} diagnostics in existing imported dependencies.`,
);
if (external) {
  const byFile = new Map();
  for (const item of diagnostics.filter(
    (item) => item.file && !entryPaths.has(path.normalize(item.file.fileName)),
  )) {
    const file = path.relative(root, item.file.fileName);
    byFile.set(file, (byFile.get(file) || 0) + 1);
  }
  console.log(JSON.stringify(Object.fromEntries(byFile), null, 2));
}
process.exitCode = local.length ? 1 : 0;

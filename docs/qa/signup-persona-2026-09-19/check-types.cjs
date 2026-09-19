const ts = require("typescript");
const path = require("node:path");
const files = [
  "src/lib/template-draft-storage.ts",
  "src/components/templates/TemplateEditorContext.tsx",
  "src/lib/signup-access.ts",
  "src/components/smart-signup-form/SignupSharing.tsx",
  "src/components/smart-signup-form/SignupPageRenderer.tsx",
  "src/components/smart-signup-form/SignupViewer.tsx",
  "src/components/smart-signup-form/Wizard.tsx",
  "src/lib/signup-validation.ts",
  "src/lib/signup-composer.ts",
  "src/components/smart-signup-form/SignupContentEditor.tsx",
  "src/components/smart-signup-form/SignupSectionRules.tsx",
  "src/types/signup.ts",
  "src/utils/signup.ts",
  "src/lib/signup-mutations.ts",
  "src/components/smart-signup-form/SignupSettingsEditor.tsx",
  "src/lib/public-template-catalog.ts",
  "src/components/templates/PublicTemplateGallery.tsx",
  "src/app/category-pages/SignupFormsEditorialSections.tsx",
  "src/components/landing/SignupFormsPhones.tsx",
  "src/app/category-pages/category-page-data.ts",
  "src/lib/signup-display.ts"
];
const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists);
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
const program = ts.createProgram({ rootNames: [...files, "next-env.d.ts"], options: { ...parsed.options, noEmit: true, incremental: false } });
const diagnostics = files.flatMap(file => { const source = program.getSourceFile(path.resolve(file)); return source ? [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)] : []; });
console.log(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: file => file, getCurrentDirectory: () => process.cwd(), getNewLine: () => "\n" }));
console.log(files.length + " changed files checked; " + diagnostics.length + " diagnostics.");
process.exitCode = diagnostics.length ? 1 : 0;

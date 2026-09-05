const ts = require('typescript');
const path = require('node:path');
const fs = require('node:fs');
const touched = ['src/components/branding/EnvitefySocialLinks.tsx','src/components/ConditionalFooter.tsx','src/app/left-sidebar.tsx','src/lib/product-marketing-catalog.ts'];
const config = ts.readConfigFile('tsconfig.json',ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config,ts.sys,process.cwd());
const program = ts.createProgram(parsed.fileNames,{...parsed.options,incremental:false,noEmit:true});
const diagnostics = [...program.getOptionsDiagnostics(),...program.getGlobalDiagnostics()];
for(const name of touched) {
  const file = program.getSourceFile(path.resolve(name));
  if(!file) throw new Error('Missing source '+name);
  diagnostics.push(...program.getSyntacticDiagnostics(file),...program.getSemanticDiagnostics(file));
}
const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n'});
fs.writeFileSync(path.join(__dirname,'typescript.log'),formatted || 'No TypeScript diagnostics in the four changed files.\n');
console.log(formatted || 'No TypeScript diagnostics in the four changed files.');
process.exitCode=diagnostics.length?1:0;

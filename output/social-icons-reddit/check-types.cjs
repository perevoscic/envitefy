const ts=require('typescript'),fs=require('node:fs'),path=require('node:path');
const touched=JSON.parse(fs.readFileSync(path.join(__dirname,'touched-files.json'),'utf8'));
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'original-sources.json'),'utf8'));
const normalize=name=>path.resolve(name).replaceAll('\\','/').toLowerCase();
const originals=new Map(Object.entries(original).map(([name,s])=>[normalize(name),s]));
const config=ts.readConfigFile('tsconfig.json',ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,process.cwd());
const options={...parsed.options,incremental:false,noEmit:true};
const roots=[...touched,'next-env.d.ts',...ts.sys.readDirectory('src/types',['.d.ts'])];
function inspect(baseline){
 const host=ts.createCompilerHost(options),read=host.readFile;
 if(baseline)host.readFile=name=>originals.get(normalize(name))??read(name);
 const program=ts.createProgram(roots,options,host);
 const diagnostics=[...program.getOptionsDiagnostics(),...program.getGlobalDiagnostics()];
 for(const name of touched){const source=program.getSourceFile(path.resolve(name));if(!source)throw new Error(name);diagnostics.push(...program.getSyntacticDiagnostics(source),...program.getSemanticDiagnostics(source));}
 return diagnostics.map(d=>({file:d.file?normalize(d.file.fileName):'',code:d.code,message:ts.flattenDiagnosticMessageText(d.messageText,'\n'),line:d.file&&d.start!==undefined?d.file.getLineAndCharacterOfPosition(d.start).line+1:0}));
}
console.log('Checking TypeScript for',touched.length,'changed files');
const current=inspect(false),signature=d=>JSON.stringify([d.file,d.code,d.message]);
const baseline=current.length?new Set(inspect(true).filter(d=>originals.has(d.file)).map(signature)):new Set();
const introduced=current.filter(d=>!baseline.has(signature(d)));
const result={changedFiles:touched.length,existingDiagnostics:current.length-introduced.length,newDiagnostics:introduced};
fs.writeFileSync(path.join(__dirname,'typescript.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));process.exitCode=introduced.length?1:0;

const fs=require('node:fs'),ts=require('typescript'),cp=require('node:child_process');
const files=cp.execFileSync('rg',['-l','social-facebook.svg','src'],{encoding:'utf8'}).trim().split(/\r?\n/);
const originals={};
for(const file of files){
 let s=fs.readFileSync(file,'utf8'); originals[file]=s;
 const p=ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),matches=[];
 function walk(node){
  if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(p)==='div'&&node.children.some(c=>ts.isJsxElement(c)&&c.openingElement.tagName.getText(p)==='a'&&c.openingElement.getText(p).includes('facebook.com/envitefy'))) matches.push(node);
  ts.forEachChild(node,walk);
 }
 walk(p);
 if(matches.length!==1)throw new Error(`Expected exactly one social row in ${file}, found ${matches.length}`);
 const node=matches[0],inverse=node.getText(p).includes('brightness-0 invert');
 s=s.slice(0,node.getStart(p))+`<EnvitefySocialLinks placement="event"${inverse?' inverse':''} />`+s.slice(node.end);
 const firstImport=p.statements.find(ts.isImportDeclaration);
 if(!firstImport)throw new Error('No import anchor '+file);
 const importText='import EnvitefySocialLinks from "@/components/branding/EnvitefySocialLinks";'+(s.includes('\r\n')?'\r\n':'\n');
 s=s.slice(0,firstImport.getStart(p))+importText+s.slice(firstImport.getStart(p));
 if((s.match(/\bImage\b/g)||[]).length===1)s=s.replace(/^import Image from "next\/image";\r?\n/m,'');
 fs.writeFileSync(file,s);
 console.log('Updated event social row:',file);
}
for(const [file,base,imp]of [['src/lib/email-template.ts','baseUrl','./envitefy-social-links'],['src/lib/email-templates/magazine-1.ts','base','@/lib/envitefy-social-links']]){
 let s=fs.readFileSync(file,'utf8'); originals[file]=s;
 const start=s.indexOf('  const socialIcons = ['); const end=s.indexOf('  ];',start)+4;
 if(start<0||end<4)throw new Error('Missing email social list '+file);
 const replacement='  const socialIcons = ENVITEFY_SOCIAL_LINKS.map(({ name, href, iconSrc }) => ({\n    title: name,\n    href,\n    src: `${'+base+'}${iconSrc}`,\n  }));';
 s=s.slice(0,start)+replacement.replaceAll('\n',s.includes('\r\n')?'\r\n':'\n')+s.slice(end);
 s='import { ENVITEFY_SOCIAL_LINKS } from "'+imp+'";'+(s.includes('\r\n')?'\r\n':'\n')+s;
 s=s.replace('target="_blank" title="${link.title}"','target="_blank" rel="noopener noreferrer" title="${link.title}"');
 fs.writeFileSync(file,s);
 console.log('Updated email social list:',file);
}
fs.writeFileSync('output/social-icons-reddit/original-sources.json',JSON.stringify(originals));
fs.writeFileSync('output/social-icons-reddit/touched-files.json',JSON.stringify([...files,'src/lib/email-template.ts','src/lib/email-templates/magazine-1.ts','src/lib/envitefy-social-links.ts','src/components/branding/EnvitefySocialLinks.tsx','src/app/left-sidebar.tsx','src/components/ConditionalFooter.tsx','src/lib/product-marketing-catalog.ts','src/app/layout.tsx'],null,2));

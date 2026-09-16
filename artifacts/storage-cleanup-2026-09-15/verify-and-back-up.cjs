const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {createRequire} = require('node:module');
const req = createRequire(path.resolve('package.json'));
const sharp = req('sharp');
const {list,get} = req('@vercel/blob');
Object.assign(process.env,req('dotenv').parse(fs.readFileSync('.env')));
const reportDirectory=__dirname;
const plan=JSON.parse(fs.readFileSync(path.join(reportDirectory,'replacement-plan.json')));
if(plan.replacements.length!==113)throw new Error('Cleanup scope must be exactly 113 files');
const backup=plan.proposedBackupDirectory;
for(const folder of ['originals','display','previews'])fs.mkdirSync(path.join(backup,folder),{recursive:true,mode:0o700});
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const checkpoint={startedAt:new Date().toISOString(),scopeCount:113,backupDirectory:backup,entries:[],failures:[]};
const flush=()=>{const temp=path.join(backup,'verification.json.tmp');fs.writeFileSync(temp,JSON.stringify(checkpoint,null,2),{mode:0o600});fs.renameSync(temp,path.join(backup,'verification.json'));};
async function bytesFor(blob,destination){
 if(fs.existsSync(destination)){
  const bytes=fs.readFileSync(destination);
  if(bytes.length===blob.size)return bytes;
  throw new Error('Existing backup has unexpected size: '+destination);
 }
 const result=await get(blob.pathname,{access:'private',abortSignal:AbortSignal.timeout(60000)});
 if(result?.statusCode!==200||!result.stream)throw new Error('Image response unavailable');
 const bytes=Buffer.from(await new Response(result.stream).arrayBuffer());
 if(bytes.length!==blob.size)throw new Error('Downloaded byte count differs from inventory');
 if(result.blob.etag!==blob.etag)throw new Error('Blob changed since inventory');
 fs.writeFileSync(destination,bytes,{flag:'wx',mode:0o600});
 if(digest(fs.readFileSync(destination))!==digest(bytes))throw new Error('Backup hash mismatch');
 return bytes;
}
async function main(){
 const inventory=[];let cursor;
 do{const page=await list({limit:1000,cursor});inventory.push(...page.blobs);cursor=page.hasMore?page.cursor:undefined;}while(cursor);
 const byPath=new Map(inventory.map(b=>[b.pathname,b]));checkpoint.storeBytesBefore=inventory.reduce((s,b)=>s+b.size,0);
 fs.writeFileSync(path.join(reportDirectory,'inventory-before.json'),JSON.stringify(inventory,null,2));
 let index=0,stop=false;
 async function worker(){while(index<plan.replacements.length&&!stop){const i=index++;const mapping=plan.replacements[i];const source=byPath.get(mapping.oldPath);const display=byPath.get(mapping.newPath);const id=String(i+1).padStart(3,'0');
 try{
 if(!source||!display)throw new Error('Original or display missing');
 if(mapping.newPath!==mapping.oldPath.split('/source/')[0]+'/display.webp')throw new Error('Replacement folder mismatch');
 if(source.etag!==mapping.originalEtag||display.etag!==mapping.replacementEtag)throw new Error('Image changed since authorized plan');
 const originalFile=path.join(backup,'originals',mapping.oldPath.split('/')[1]+'.png');
 const displayFile=path.join(backup,'display',mapping.oldPath.split('/')[1]+'.webp');
 const png=await bytesFor(source,originalFile);const webp=await bytesFor(display,displayFile);
 if(png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('Original is not PNG');
 if(webp.subarray(0,4).toString()!=='RIFF'||webp.subarray(8,12).toString()!=='WEBP')throw new Error('Replacement is not WebP');
 const pm=await sharp(png).metadata();const wm=await sharp(webp).metadata();
 await sharp(png,{failOn:'warning'}).raw().toBuffer();await sharp(webp,{failOn:'warning'}).raw().toBuffer();
 const sameDimensions=pm.width===wm.width&&pm.height===wm.height;
 const originalRaw=await sharp(png).rotate().resize({width:512,withoutEnlargement:true}).flatten({background:'#ffffff'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const displayRaw=await sharp(webp).rotate().resize({width:originalRaw.info.width,height:originalRaw.info.height,fit:'fill'}).flatten({background:'#ffffff'}).removeAlpha().raw().toBuffer();
 if(originalRaw.data.length!==displayRaw.length)throw new Error('Comparison pixel shapes differ');
 let absolute=0,squares=0;for(let j=0;j<displayRaw.length;j++){const d=originalRaw.data[j]-displayRaw[j];absolute+=Math.abs(d);squares+=d*d;}
 const mae=absolute/displayRaw.length;const mse=squares/displayRaw.length;const psnr=mse?10*Math.log10(255*255/mse):100;
 const previewFile=path.join(backup,'previews',id+'.webp');await sharp(png).resize({width:160,withoutEnlargement:true}).webp({quality:48,effort:6}).toFile(previewFile);
 const entry={id,oldPath:mapping.oldPath,newPath:mapping.newPath,oldUrl:source.url,newUrl:display.url,uploadedAt:source.uploadedAt,originalFile,displayFile,previewFile,originalBytes:png.length,displayBytes:webp.length,originalSha256:digest(png),displaySha256:digest(webp),originalEtag:source.etag,displayEtag:display.etag,originalWidth:pm.width,originalHeight:pm.height,displayWidth:wm.width,displayHeight:wm.height,sameDimensions,originalAlpha:!!pm.hasAlpha,displayAlpha:!!wm.hasAlpha,meanAbsolutePixelError:+mae.toFixed(4),psnr:+psnr.toFixed(3),automaticComparisonPassed:sameDimensions&&mae<=6&&psnr>=28};
 checkpoint.entries.push(entry);flush();if(checkpoint.entries.length%15===0)console.log('Backed up and compared',checkpoint.entries.length,'of 113');
 }catch(error){checkpoint.failures.push({id,oldPath:mapping.oldPath,error:error.message});flush();console.error('Paused verification:',id,error.message);stop=true;}
 }}
 await Promise.all(Array.from({length:4},worker));checkpoint.entries.sort((a,b)=>a.id.localeCompare(b.id));checkpoint.finishedAt=new Date().toISOString();checkpoint.complete=checkpoint.entries.length===113&&checkpoint.failures.length===0;flush();
 fs.writeFileSync(path.join(reportDirectory,'backup-verification.json'),JSON.stringify(checkpoint,null,2));
 console.log(JSON.stringify({complete:checkpoint.complete,backedUp:checkpoint.entries.length,backupBytes:checkpoint.entries.reduce((s,e)=>s+e.originalBytes,0),comparisonPassed:checkpoint.entries.filter(e=>e.automaticComparisonPassed).length,dimensionMismatch:checkpoint.entries.filter(e=>!e.sameDimensions).map(e=>({id:e.id,png:[e.originalWidth,e.originalHeight],webp:[e.displayWidth,e.displayHeight]})),worstComparisons:[...checkpoint.entries].sort((a,b)=>a.psnr-b.psnr).slice(0,8).map(e=>({id:e.id,mae:e.meanAbsolutePixelError,psnr:e.psnr})),failures:checkpoint.failures,backup},null,2));if(!checkpoint.complete)process.exitCode=1;
}
main().catch(e=>{console.error(e.message);process.exitCode=1});

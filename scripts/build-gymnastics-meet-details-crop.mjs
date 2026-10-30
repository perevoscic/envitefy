import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';

const root=process.cwd();
const source=path.join(root,'output/merch/gymnastics-meet-shirt-2026-10-30/gymnastics-meet-back-concept.svg');
const out=path.join(root,'output/merch/gymnastics-meet-details-registration-hotels-2026-10-30');
const plum='#98153f',cream='#f8f1e7';
await fs.mkdir(out,{recursive:true});
const sourceBuffer=await fs.readFile(source),sourceHash=createHash('sha256').update(sourceBuffer).digest('hex');
let full=sourceBuffer.toString('utf8');
const replaceOnce=(old,newText)=>{if(full.split(old).length!==2)throw new Error(`Expected exactly one source match: ${old.slice(0,90)}`);full=full.replace(old,newText);};
replaceOnce('>Sessions</text>','>Meet details</text>');
replaceOnce('>Directions</text>','>Registration</text>');
replaceOnce('>Updates</text>','>Hotels</text>');
const oldIcons='<path d="M590 441v21m-8-14h16M589 509c-9 0-10 8 0 18 10-10 9-18 0-18zM581 585l8-8 8 8-8 8z"/>';
const icons=`<g id="meet-details-calendar-icon" transform="translate(6 0)" stroke-linecap="round" stroke-linejoin="round">
  <rect x="580" y="438" width="22" height="23" rx="3"/>
  <path d="M580 446H602 M586 434V441 M596 434V441"/>
  <path d="M585 451h2 M591 451h2 M597 451h1 M585 456h2 M591 456h2" stroke-width="2"/>
</g>
<g id="registration-check-card-icon" transform="translate(6 0)" stroke-linecap="round" stroke-linejoin="round">
  <rect x="580" y="508" width="23" height="26" rx="3"/>
  <path d="M586 515H597 M585 524L589 528L598 520"/>
</g>
<g id="hotel-bed-icon" transform="translate(6 0)" stroke-linecap="round" stroke-linejoin="round">
  <path d="M580 576V600 M580 591H604V600 M580 584H600Q604 584 604 588V591"/>
  <rect x="584" y="578" width="8" height="6" rx="2"/>
</g>`;
replaceOnce(oldIcons,icons);
full=full.replaceAll('<text x="611"','<text x="620"');
const benefit='Meet details · Registration · Hotels and more.';
replaceOnce('Session times · Directions · Meet updates',benefit);
if(full.includes('M590 441v21m-8-14h16')||full.includes('>Sessions</text>')||full.includes('>Directions</text>')||full.includes('>Updates</text>'))throw new Error('Old row labels or cross symbol remain');
const start=full.indexOf(`<g fill="none" stroke="${plum}" stroke-width="5" stroke-linejoin="round">`);
const benefitStart=full.indexOf(benefit),end=full.indexOf('</text>',benefitStart)+7;
if(start<0||benefitStart<start||end<benefitStart)throw new Error('Crop source boundaries missing');
const cropBody=full.slice(start,end);
const crop=`<svg xmlns="http://www.w3.org/2000/svg" width="2295" height="1410" viewBox="60 290 765 470">${cropBody}</svg>`;
const cropSvg=path.join(out,'meet-details-registration-hotels-crop-v2.svg');
const fullSvg=path.join(out,'gymnastics-meet-back-source-updated-v2.svg');
await fs.writeFile(cropSvg,crop);await fs.writeFile(fullSvg,full);
const flatPng=path.join(out,'meet-details-registration-hotels-flat-v2.png');
const creamPng=path.join(out,'meet-details-registration-hotels-preview-v2.png');
const flatWebp=path.join(out,'meet-details-registration-hotels-flat-v2.webp');
const creamWebp=path.join(out,'meet-details-registration-hotels-preview-v2.webp');
await sharp(Buffer.from(crop)).png().toFile(flatPng);
await sharp(Buffer.from(crop)).flatten({background:cream}).png().toFile(creamPng);
for(const[src,dest]of[[flatPng,flatWebp],[creamPng,creamWebp]]){
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',src,'-c:v','libwebp','-quality','85','-compression_level','6',dest],{stdio:'pipe'});
  const m=await sharp(dest).metadata();if(m.format!=='webp'||m.width!==2295||m.height!==1410)throw new Error('WebP dimensions or format mismatch');
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',dest,'-f','null','-'],{stdio:'pipe'});
}
const fm=await sharp(flatWebp).metadata();if(!fm.hasAlpha)throw new Error('Flat crop lost transparency');
await fs.unlink(flatPng);await fs.unlink(creamPng);
if(createHash('sha256').update(await fs.readFile(source)).digest('hex')!==sourceHash)throw new Error('Original SVG changed');
const report={created:'2026-10-30',source:path.relative(root,source),originalSourceSha256:sourceHash,method:'Deterministic native SVG text and icon revision; no image generation',cropViewBox:[60,290,765,470],rasterSize:[2295,1410],phoneRows:['Meet details','Registration','Hotels'],icons:['Calendar','Registration card with check','Hotel bed'],removedIcons:['Cross/plus','Map pin','Diamond'],benefitLine:benefit,colors:{plum,coral:'#f24772',previewCream:cream},preserved:'Original PDF stack, coral arrow, phone proportions and all remaining full source content',files:{cropSvg,fullSvg,transparentWebp:flatWebp,creamPreviewWebp:creamWebp},verified:{originalUnchanged:true,webpDecode:true,alphaPreserved:true,oldCrossPathRemoved:true,exactRowAndBenefitText:true}};
await fs.writeFile(path.join(out,'revision-provenance.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));

import fs from 'node:fs/promises';
const dir='projects/john-space-disco';
const old=JSON.parse(await fs.readFile(`${dir}/brief.json`,'utf8'));
const brief={...old,formats:[{aspectRatio:'16:9',width:1920,height:1080}],request:'One actual moving 30-second horizontal 16:9 YouTube promotional video at 1920 × 1080. Five requested scenes and exact dialogue. Purpose-composed widescreen footage, large readable actual product UI, no portrait footage, no stretching or black sidebars.'};
brief.artDirection={...old.artDirection,style:old.artDirection.style.replace('Portrait 9:16.','Landscape 16:9, designed from the start for a full wide cinema frame.')};
for(const key of Object.keys(brief.shots)) {
  brief.shots[key]=brief.shots[key].replaceAll('Portrait 9:16.','Landscape 16:9. Native wide composition, use full width. No portrait framing or black bars.');
}
brief.shots.guests=brief.shots.guests.replace('Camera frames faces in upper quarter and hands naturally in bottom quarter leaving large quiet center for a composited real product screen.','Camera frames each guest in a warm medium shot on the LEFT HALF, with face, upper body, phone and hands comfortably visible; RIGHT HALF is a softly lit quiet violet wall for a product insert.');
brief.shots.create=brief.shots.create.replace('Camera starts in a warm medium two-shot, moves toward tablet by second 3; tablet is nearly front-on by second 4 and camera holds gently.','Widescreen medium two-shot: John and mother both occupy LEFT HALF with faces and hands visible. Camera gently moves sideways while RIGHT HALF is a softly lit quiet blue wall, reserved for a large composited real product screen. Do not move into close-up or fill right half with people.');
brief.shots.update=brief.shots.update.replace('Camera medium close, mother left and John right, faces in upper half, tablet in lower half.','Camera wide-medium, mother and John together in left half, right half quiet wall for an editing insert; faces and tablet clear and large.');
await fs.mkdir('out/john-space-disco',{recursive:true});
await fs.writeFile(`${dir}/brief-16x9.json`,JSON.stringify(brief,null,2));
let script=await fs.readFile('scripts/generate-john-assets.mjs','utf8');
script=script.replace("'brief.json'","'brief-16x9.json'").replace('`${mode}.${music?', '`${mode}-wide.${music?').replace('`${mode}-job.json`','`${mode}-wide-job.json`').replace("aspect_ratio:'9:16',resolution:'720p'","aspect_ratio:'16:9',resolution:'1080p'").replace("'hook-job.json'","'hook-wide-job.json'");
await fs.writeFile('scripts/generate-john-wide.mjs',script);
await fs.appendFile(`${dir}/feedback.md`,'\n2026-09-08: User specifies ONE horizontal 16:9 YouTube video, 1920 × 1080. Fresh wide footage and purpose-designed side-by-side UI layouts replace the unfinished vertical framing. Preserve previous source files; deliver only the horizontal export.\n');
console.log('Widescreen brief and separate provider state ready.');

import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';import crypto from 'node:crypto';import sharp from 'sharp';
const out='out/mom-just-snap-it',p='projects/mom-just-snap-it';
function run(bin,args){const r=spawnSync(bin,args,{encoding:'utf8',maxBuffer:20e6});if(r.status)throw Error(r.stderr||r.stdout);return r;}
const entries=[];const cuts=[0,1,2,3,4,8,12,15,23,30,60,68,75,83,98,120,143,150,158,165,173,188,208,209,210,211,310,311,312,313,479,480,481,521,522,563,564,581,582,605,606,619,620,634,635,666,667,698,699,779,780,781,928,929,930,931,1048,1049];
for(const [format,w,h] of [['16x9',1920,1080],['9x16',1080,1920]]){
 const file=out+`/envitefy-snap-anime-${format}-v2.mp4`;
 const probe=JSON.parse(run('ffprobe',['-v','error','-count_frames','-show_entries','stream=codec_name,width,height,r_frame_rate,nb_read_frames,sample_rate,channels,duration:format=duration,size','-of','json',file]).stdout);
 const video=probe.streams.find(s=>s.codec_name==='h264'),audio=probe.streams.find(s=>s.codec_name==='aac');
 if(video.width!==w||video.height!==h||video.r_frame_rate!=='30/1'||+video.nb_read_frames!==1050||Math.abs(+probe.format.duration-35)>.001||audio.channels!==2||audio.sample_rate!=='48000')throw Error(format+' failed format verification');
 run('ffmpeg',['-hide_banner','-v','error','-i',file,'-f','null','-']);
 const audioHash=run('ffmpeg',['-v','error','-i',file,'-map','0:a:0','-c:a','pcm_s16le','-f','hash','-hash','sha256','-']).stdout.trim();
 const black=run('ffmpeg',['-hide_banner','-i',file,'-vf','blackdetect=d=0.03:pic_th=0.98:pix_th=0.10','-an','-f','null','-']).stderr;
 const blackIntervals=black.split('\n').filter(s=>s.includes('black_start:'));if(blackIntervals.length)throw Error(format+' has black frames');
 const select=cuts.map(f=>'eq(n,'+f+')').join('+');run('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',file,'-vf',`select='${select}',scale=${format==='16x9'?384:216}:-1,tile=4x15`,'-frames:v','1',out+`/v2-final-boundaries-${format}.jpg`]);
 const info={format,file,width:w,height:h,fps:30,durationSeconds:+probe.format.duration,frames:+video.nb_read_frames,bytes:+probe.format.size,videoCodec:'h264',audioCodec:'aac',audioChannels:2,sampleRate:48000,audioDecodedHash:audioHash,sha256:crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'),fullDecodePassed:true,blackIntervals:[]};entries.push(info);console.log(info);
}
if(entries[0].audioDecodedHash!==entries[1].audioDecodedHash)throw Error('Audio mismatch');
const loudness=run('ffmpeg',['-hide_banner','-i',entries[0].file,'-af','loudnorm=I=-15:TP=-1.3:LRA=9:print_format=json','-f','null','-']).stderr;
await fs.writeFile(out+'/v2-final-loudness.txt',loudness);
const verification={verifiedAt:new Date().toISOString(),audioIdentical:true,oneSharedTimeline:true,entries,reviewedBoundaryFrames:cuts,pronunciationComparison:'pending user approval; no external audio upload performed'};
await fs.writeFile(p+'/export-verification-v2.json',JSON.stringify(verification,null,2));
await fs.writeFile(p+'/deliverables.json',JSON.stringify({campaign:'mom-just-snap-it',version:2,status:'opening invitation text fixed in both exports; technical checks passed; earlier magnet/style animation revision remains pending approval',userApproved:false,pronunciationVerified:false,sharedSourceComponent:'src/mom-just-snap-it/SnapAnime.tsx',sharedAudio:'public/projects/mom-just-snap-it/final-mix-v2.wav',editableProject:'out/mom-just-snap-it/envitefy-snap-anime-editable-v2.zip',exports:entries},null,2));
console.log('PASS: 35.000 seconds, 1050 frames, correct dimensions, full decode, no black intervals, identical decoded audio.');

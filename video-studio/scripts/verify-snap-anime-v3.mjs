import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const out='out/mom-just-snap-it',p='projects/mom-just-snap-it';
function run(cmd,args){const r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:8e6});if(r.status)throw Error(r.stderr||cmd+' failed');return r;}
const cuts=[0,1,4,8,14,15,30,60,98,120,135,150,153,155,165,180,194,209,210,311,312,479,480,514,515,521,522,539,540,551,552,575,576,596,597,614,615,634,635,666,667,698,699,779,780,809,822,850,890,929,930,945,980,1048,1049];
const entries=[];
for(const [format,w,h] of [['16x9',1920,1080],['9x16',1080,1920]]){
 const file=`${out}/envitefy-snap-anime-${format}-v3.mp4`;
 const probe=JSON.parse(run('ffprobe',['-v','error','-count_frames','-show_entries','stream=codec_name,width,height,r_frame_rate,nb_read_frames,sample_rate,channels:format=duration,size','-of','json',file]).stdout);
 const video=probe.streams.find(s=>s.codec_name==='h264'),audio=probe.streams.find(s=>s.codec_name==='aac');
 if(video?.width!==w||video.height!==h||video.r_frame_rate!=='30/1'||+video.nb_read_frames!==1050||Math.abs(+probe.format.duration-35)>.001||audio?.channels!==2||audio.sample_rate!=='48000')throw Error(format+' format verification failed');
 run('ffmpeg',['-v','error','-i',file,'-f','null','-']);
 const audioHash=run('ffmpeg',['-v','error','-i',file,'-map','0:a:0','-c:a','pcm_s16le','-f','hash','-hash','sha256','-']).stdout.trim();
 const black=run('ffmpeg',['-hide_banner','-i',file,'-vf','blackdetect=d=0.03:pic_th=0.98:pix_th=0.10','-an','-f','null','-']).stderr.split('\n').filter(s=>s.includes('black_start:'));
 if(black.length)throw Error(format+' black frame detected');
 run('ffmpeg',['-y','-v','error','-i',file,'-vf',`select='${cuts.map(f=>'eq(n,'+f+')').join('+')}',scale=${format==='16x9'?384:216}:-1,tile=5x11`,'-frames:v','1',`${out}/v3-final-boundaries-${format}.jpg`]);
 const canonicalFile=`${out}/envitefy-snap-anime-${format}.mp4`;
 const entry={format,file,canonicalFile,width:w,height:h,fps:30,durationSeconds:35,frames:1050,bytes:+probe.format.size,videoCodec:'h264',audioCodec:'aac',audioChannels:2,sampleRate:48000,audioDecodedHash:audioHash,sha256:crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'),fullDecodePassed:true,blackIntervals:[]};
 entries.push(entry);console.log(format+' specifications and full decode PASS');
}
if(entries[0].audioDecodedHash!==entries[1].audioDecodedHash)throw Error('Format audio mismatch');
const loudness=run('ffmpeg',['-hide_banner','-i',entries[0].file,'-af','loudnorm=I=-16:TP=-1.2:LRA=7:print_format=json','-f','null','-']).stderr;
await fs.writeFile(out+'/v3-final-loudness.txt',loudness);
const report={verifiedAt:new Date().toISOString(),audioIdentical:true,oneSharedTimeline:true,entries,reviewedBoundaryFrames:cuts,pronunciationMethod:'Local ONNX phoneme comparison against user acoustic reference; no audio uploads. See local-phoneme-review-v3.json.'};
await fs.writeFile(p+'/export-verification-v3.json',JSON.stringify(report,null,2));
await fs.writeFile(p+'/deliverables.json',JSON.stringify({campaign:'mom-just-snap-it',version:3,status:'Rendered; technical verification passed; final encoded visual review follows',userApproved:false,pronunciationVerified:true,pronunciationReviewType:'Offline acoustic phoneme comparison',sharedSourceComponent:'src/mom-just-snap-it/SnapAnime.tsx',sharedAudio:'public/projects/mom-just-snap-it/final-mix-v2.wav',editableProject:out+'/envitefy-snap-anime-editable-v3.zip',exports:entries},null,2));
console.log('Both MP4s: 35.000 seconds, 1050 frames, correct sizes, identical decoded audio.');

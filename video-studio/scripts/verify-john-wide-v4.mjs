import fs from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';
const out='out/john-space-disco/',project='projects/john-space-disco/';
const file=out+'john-space-disco-16x9-v4.mp4';
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_entries','stream=codec_name,width,height,r_frame_rate,nb_read_frames,sample_rate,channels:format=duration,size','-of','json',file],{encoding:'utf8'}));
const video=probe.streams.find(s=>s.width),audio=probe.streams.find(s=>s.channels);
if(video.width!==1920||video.height!==1080||video.r_frame_rate!=='30/1'||Number(video.nb_read_frames)!==900||Number(probe.format.duration)!==30||audio.channels!==2)throw Error('Unexpected V4 format');
const decode=spawnSync('ffmpeg',['-v','error','-xerror','-i',file,'-f','null','-'],{encoding:'utf8',windowsHide:true});
if(decode.status)throw Error(decode.stderr);
function streamHash(name){return execFileSync('ffmpeg',['-v','error','-i',out+name,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-'],{encoding:'utf8'}).trim();}
const originalHash=streamHash('john-space-disco-16x9-v3.mp4'),revisedHash=streamHash('john-space-disco-16x9-v4.mp4');
if(originalHash!==revisedHash)throw Error('Video stream unexpectedly changed');
const levels=spawnSync('ffmpeg',['-hide_banner','-i',file,'-vn','-af','ebur128=peak=true','-f','null','-'],{encoding:'utf8',windowsHide:true});
fs.writeFileSync(out+'wide-v4-loudness.txt',levels.stderr);
const production=JSON.parse(fs.readFileSync(project+'wide-v4-voice-production.json','utf8'));
if(!production.providerAlignedText.includes('@ay1@t@iy0'))throw Error('Expected primary VY stress not present in provider alignment');
const report={probe,fullDecodePassed:true,videoStreamUnchanged:true,videoStreamHash:revisedHash,visualReviewInheritedFrom:project+'wide-export-checks-v3.json',pronunciation:production,loudnessSummary:levels.stderr.slice(levels.stderr.lastIndexOf('Summary:')),localTranscript:project+'wide-v4-final-voice-review-local-transcript.json'};
fs.writeFileSync(project+'wide-export-checks-v4.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));

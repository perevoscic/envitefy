import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync,spawnSync} from 'node:child_process';
const p='projects/john-space-disco/',data=JSON.parse(fs.readFileSync(p+'brand-standard-revision.json','utf8')),reports=[];
const hash=f=>execFileSync('ffmpeg',['-v','error','-i',f,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-'],{encoding:'utf8',windowsHide:true}).trim();
for(const r of data.records){
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_entries','stream=codec_name,width,height,r_frame_rate,nb_read_frames,sample_rate,channels,duration:format=duration,size','-of','json',r.output],{encoding:'utf8',windowsHide:true}));
 const v=probe.streams.find(x=>x.codec_name==='h264'),a=probe.streams.find(x=>x.codec_name==='aac');
 if(!v||v.width!==r.width||v.height!==r.height||v.r_frame_rate!=='30/1'||Number(v.nb_read_frames)!==900||Number(v.duration)!==30||Number(probe.format.duration)!==30||!a||a.sample_rate!=='48000'||a.channels!==2||Number(a.duration)!==30)throw Error('Unexpected format: '+r.output);
 const videoHash=hash(r.output);if(videoHash!==hash(r.base))throw Error('Animation changed: '+r.output);
 execFileSync('ffmpeg',['-v','error','-xerror','-i',r.output,'-f','null','-'],{windowsHide:true});
 const sound=spawnSync('ffmpeg',['-hide_banner','-i',r.output,'-vn','-af','loudnorm=I=-15:TP=-1.5:LRA=9:print_format=json','-f','null','-'],{encoding:'utf8',windowsHide:true});if(sound.status)throw Error('Sound decode failed');
 const loudness=JSON.parse(sound.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
 if(Number(loudness.input_tp)>-.9||Number(loudness.input_i)<-19||Number(loudness.input_i)>-12)throw Error('Audio levels outside intended range');
 const bytes=fs.readFileSync(r.output);
 const report={aspectRatio:r.aspectRatio,path:r.output,base:r.base,probe,videoStreamUnchanged:true,videoPacketSha256:videoHash,fullDecodePassed:true,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),loudness,voice:r.voice,voiceSha256:r.voiceSha256,voiceStartSeconds:r.start,voiceDurationSeconds:r.voiceDurationSeconds,pronunciationAudioReview:r.audioReview};
 reports.push(report);console.log(JSON.stringify({path:r.output,duration:probe.format.duration,videoUnchanged:true,loudnessLUFS:loudness.input_i,truePeakDbTP:loudness.input_tp}));
}
fs.writeFileSync(p+'brand-standard-export-verification.json',JSON.stringify({date:new Date().toISOString(),reports},null,2)+'\n');

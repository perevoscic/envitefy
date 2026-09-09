import fs from 'node:fs/promises';import {execFileSync} from 'node:child_process';
const pub='public/projects/small-shower',out='out/small-shower',p='projects/small-shower';
const ff=a=>execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...a],{stdio:'inherit'});
ff(['-ss','0.15','-t','4.6','-i',pub+'/opening.mp4','-vn','-af','atempo=1.06976744186,apad,atrim=duration=4.3,loudnorm=I=-17:TP=-2:LRA=7','-ar','48000','-ac','2',out+'/opening-dialogue.wav']);
ff(['-ss',String(121/24),'-t','6.9','-i',pub+'/reveal.mp4','-vn','-af','loudnorm=I=-17:TP=-2:LRA=7','-ar','48000','-ac','2',out+'/reveal-dialogue.wav']);
const filters=["[0:a]loudnorm=I=-22:TP=-2:LRA=8,atrim=duration=30,afade=t=in:st=0:d=0.2,afade=t=out:st=29.2:d=0.8,volume='if(between(t,24.2,25.6),0,if(lt(t,5),0.4,if(between(t,21,26.8),0.45,0.9)))':eval=frame[music]",'[1:a]apad,atrim=duration=30[opening]','[2:a]adelay=21000|21000,apad,atrim=duration=30[reveal]','[music][opening][reveal]amix=inputs=3:duration=longest:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=8,aresample=48000,atrim=duration=30[mix]'];
ff(['-i',pub+'/music.mp3','-i',out+'/opening-dialogue.wav','-i',out+'/reveal-dialogue.wav','-filter_complex',filters.join(';'),'-map','[mix]','-ac','2','-c:a','pcm_s24le',pub+'/final-mix.wav']);
await fs.writeFile(p+'/edit-timing.json',JSON.stringify({fps:30,duration:30,opening:{sourceStart:.15,sourceDuration:4.6,targetDuration:4.3},trunk:{sourceStart:5.75,duration:.7},reveal:{sourceStart:121/24,timelineStart:21,duration:6},musicSilence:[24.2,25.6],product:[{name:'chat',from:5.8,to:8.2},{name:'card',from:8.2,to:10},{name:'details',from:10,to:11.8},{name:'share',from:11.8,to:14},{name:'rsvp',from:14,to:16.2},{name:'gift',from:16.2,to:17.8},{name:'calendar',from:17.8,to:19.5},{name:'directions',from:19.5,to:21}]},null,2));
console.log('All shared edit media and audio master prepared.');


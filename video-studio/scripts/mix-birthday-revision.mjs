import {spawnSync} from 'node:child_process';
const base='public/projects/birthday-second-job/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit'});if(r.status!==0)throw new Error('ffmpeg failed');}
ff(['-i',base+'chaos-wide.mp4','-filter_complex','[0:v]split=2[a][b];[a]trim=0:1.583333,setpts=PTS-STARTPTS,crop=590:1050:65:0,scale=1080:1920,fps=30,tpad=stop_mode=clone:stop_duration=0.05,trim=duration=1.6[v0];[b]trim=1.583333:10,setpts=PTS-STARTPTS,scale=1080:1920,fps=30,trim=duration=8.4[v1];[v0][v1]concat=n=2:v=1:a=0[v]','-map','[v]','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',base+'chaos-wide-prepared-v3.mp4']);
const volume="if(lt(t,3.5),0.29,if(lt(t,3.95),0.29-(t-3.5)*0.4777778,if(lt(t,7.55),0.075,if(lt(t,8),0.075+(t-7.55)*0.4777778,if(lt(t,22.3),0.29,if(lt(t,22.9),0.29-(t-22.3)*0.3583333,if(lt(t,25.7),0.075,if(lt(t,26),0.075*(26-t)/0.3,if(lt(t,27.05),0,if(lt(t,27.3),(t-27.05)*1.16,0.29))))))))))";
const filter="[0:a]atrim=0:30,asetpts=PTS-STARTPTS,volume='"+volume+"':eval=frame,afade=t=out:st=29.5:d=0.5[m];[1:a]atrim=0:10,asetpts=PTS-STARTPTS,volume=1.35,afade=t=out:st=9.8:d=0.2[c];[2:a]atrim=0:7,asetpts=PTS-STARTPTS,volume=1.35,afade=t=out:st=6.7:d=0.3,adelay=20000|20000[p];[3:a]volume=0.6[s];[m][c][p][s]amix=inputs=4:duration=longest:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=8,atrim=0:30[o]";
ff(['-i',base+'music.mp3','-i',base+'chaos-wide.mp4','-i',base+'payoff-smooth-v3.mp4','-i',base+'effects.wav','-filter_complex',filter,'-map','[o]','-ar','48000','-ac','2','-c:a','pcm_s16le',base+'final-mix-v3.wav']);
console.log('Prepared wider opening and smoothly ducked revision soundtrack.');


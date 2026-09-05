import {spawnSync} from 'node:child_process';
const base='public/projects/birthday-second-job/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit'});if(r.status!==0)throw new Error('ffmpeg failed');}
// Cut while Dad turns, before the child repeats her entrance across the source cut.
// Retain the entire spoken line and the native-speed wide reaction; no closeup or slowed ending.
const interp='minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none';
const f=`[0:v]split=2[a][b];[a]trim=start_frame=240:end_frame=290,setpts=PTS-STARTPTS,${interp},tpad=stop_mode=clone:stop_duration=0.1,trim=duration=2,settb=AVTB[pre];[b]trim=start_frame=311:end_frame=394,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=0.1,${interp},trim=duration=3.466667,settb=AVTB[line];[pre][line]concat=n=2:v=1:a=0,tpad=stop_mode=clone:stop_duration=0.4,fps=30:start_time=0,trim=end_frame=172,settb=1/30,setpts=N[v];[0:a]asplit=2[aa][ab];[aa]atrim=10:11.791667,asetpts=PTS-STARTPTS,afade=t=out:st=1.776667:d=0.015[room];[ab]atrim=12.75:16.425,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.015[voice];[room][voice]concat=n=2:v=0:a=1[aout]`;
ff(['-i',base+'payoff.mp4','-filter_complex',f,'-map','[v]','-map','[aout]','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-c:a','aac',base+'payoff-clean-v4-cfr.mp4']);
const vol="if(lt(t,3.5),0.29,if(lt(t,3.95),0.29-(t-3.5)*0.4777778,if(lt(t,7.55),0.075,if(lt(t,8),0.075+(t-7.55)*0.4777778,if(lt(t,21.4),0.29,if(lt(t,22),0.29-(t-21.4)*0.3583333,if(lt(t,24.65),0.075,if(lt(t,24.95),0.075*(24.95-t)/0.3,if(lt(t,25.3),0,if(lt(t,25.55),(t-25.3)*1.16,0.29))))))))))";
const mix="[0:a]atrim=0:30,asetpts=PTS-STARTPTS,volume='"+vol+"':eval=frame,afade=t=out:st=29.5:d=0.5[m];[1:a]atrim=0:10,asetpts=PTS-STARTPTS,volume=1.35,afade=t=out:st=9.8:d=0.2[c];[2:a]atrim=0:5.466667,asetpts=PTS-STARTPTS,volume=1.35,afade=t=out:st=5.266667:d=0.2,adelay=20000|20000[p];[3:a]volume=0.6[s];[m][c][p][s]amix=inputs=4:duration=longest:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=8,atrim=0:30[o]";
ff(['-i',base+'music.mp3','-i',base+'chaos-wide.mp4','-i',base+'payoff-clean-v4-cfr.mp4','-i',base+'effects.wav','-filter_complex',mix,'-map','[o]','-ar','48000','-ac','2','-c:a','pcm_s16le',base+'final-mix-v4.wav']);
console.log('Prepared continuous-rate V4 ending and aligned soundtrack.');

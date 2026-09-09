import {spawnSync} from 'node:child_process';
const b='public/projects/john-space-disco/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit',windowsHide:true});if(r.status)throw Error('FFmpeg failed');}
// Retain only original frames before the reversing camera shot; no mirroring.
ff(['-ss','4.5','-i',b+'payoff.mp4','-an','-vf','trim=end_frame=110,setpts=(PTS-STARTPTS)*12/11,scale=1080:1920:flags=lanczos,fps=30','-frames:v','120','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p',b+'vertical-payoff-v5-uncut.mp4']);
const filter="[0:a]atrim=0:30,asetpts=PTS-STARTPTS,volume='if(between(t,10,18.8),0.25,0.095)':eval=frame,afade=t=out:st=29.3:d=0.7[m];[1:a]atrim=0:6,asetpts=PTS-STARTPTS,atempo=1.2,afade=t=out:st=4.9:d=0.1,volume=1.2[h];[2:a]atrim=6:9.1,asetpts=PTS-STARTPTS,afade=t=out:st=3:d=0.1,volume=1.2,adelay=19000|19000[u];[3:a]atrim=6.3333333333:8.3,asetpts=PTS-STARTPTS,atempo=0.96,volume=1.1,adelay=28000|28000[p];[4:a]volume=1.1,adelay=5500|5500[c];[5:a]volume=1.1,adelay=22350|22350[v];[6:a]volume=1[s];[m][h][u][p][c][v][s]amix=inputs=7:duration=longest:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=9,apad,atrim=0:30,afade=t=out:st=29.985:d=0.015[a]";
ff(['-i',b+'music.mp3','-i',b+'hook.mp4','-i',b+'update.mp4','-i',b+'payoff.mp4','-i',b+'vo-create-v5.mp3','-i',b+'vo-update.mp3','-i',b+'vertical-effects.wav','-filter_complex',filter,'-map','[a]','-ar','48000','-ac','2','-c:a','pcm_s16le',b+'vertical-final-mix-v5.wav']);
console.log("Prepared V5 continuous ending audio and phonetic narration.");

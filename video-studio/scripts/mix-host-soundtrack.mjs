import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const studio=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const filter='[0:a]atrim=0:4.5,asetpts=PTS-STARTPTS,afade=t=out:st=4.12:d=0.16[a];[1:a]atrim=0.05:17.55,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.025,afade=t=out:st=16.9:d=0.6[b];[a][b]concat=n=2:v=0:a=1,loudnorm=I=-15:TP=-1.5:LRA=7[out]';
const result=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i','public/projects/host-mode/soundtrack.wav','-i','public/projects/host-mode/lyria-groove.mp3','-filter_complex',filter,'-map','[out]','-ar','48000','-c:a','pcm_s16le','public/projects/host-mode/final-mix.wav'],{cwd:studio,stdio:'inherit'});
if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status||1);
console.log('Mixed the 22-second soundtrack: original notification effects, Lyria instrumental, final fade.');

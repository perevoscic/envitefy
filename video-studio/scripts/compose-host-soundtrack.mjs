// Original, reproducible 120 BPM instrumental. No downloaded samples or voices.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const sr=44100,duration=22,size=sr*duration;
const left=new Float64Array(size),right=new Float64Array(size);
const wetL=new Float64Array(size),wetR=new Float64Array(size);
let seed=95126;
const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296*2-1;};
const midi=n=>440*2**((n-69)/12);
function sound(start,len,fn,gain=1,pan=0,send=0){
  const offset=Math.round(start*sr),n=Math.floor(len*sr);
  const gl=Math.sqrt((1-pan)/2)*gain,gr=Math.sqrt((1+pan)/2)*gain;
  for(let i=0;i<n&&offset+i<size;i++){
    if(offset+i<0)continue;
    const v=fn(i/sr,i)*Math.min(1,i/70,(n-i)/160);
    left[offset+i]+=v*gl;right[offset+i]+=v*gr;
    wetL[offset+i]+=v*gl*send;wetR[offset+i]+=v*gr*send;
  }
}
function kick(t,g=.72){sound(t,.45,x=>(Math.sin(2*Math.PI*(48*x+6.1*(1-Math.exp(-x*38))))*Math.exp(-x*9)+random()*.10*Math.exp(-x*260)),g);}
function hat(t,g=.08,open=false,pan=.35){
  let prev=0; sound(t,open?.18:.065,x=>{const r=random();const high=r-prev;prev=r;return high*Math.exp(-x*(open?23:72));},g,pan,.04);
}
function clap(t,g=.22){
  let p=0; sound(t,.20,x=>{const r=random(),h=r-p*.7;p=r;return h*(Math.exp(-x*28)+.7*Math.exp(-Math.abs(x-.013)*190)+.5*Math.exp(-Math.abs(x-.025)*190));},g,-.1,.15);
}
function bass(t,n,len=.27,g=.36){
  const f=midi(n);sound(t,len,x=>{
    const phase=2*Math.PI*f*x;
    return (Math.sin(phase)+.25*Math.sin(2*phase)*Math.exp(-x*12)+.12*Math.sin(3*phase)*Math.exp(-x*18))*Math.exp(-x*5);
  },g);
}
function chord(t,notes,g=.105,len=.9,pan=0){
  for(const n of notes){const f=midi(n);sound(t,len,x=>Math.sin(2*Math.PI*f*x+1.6*Math.sin(2*Math.PI*f*2*x)*Math.exp(-x*8))*Math.exp(-x*4.2),g,pan,.28);}
}
function pluck(t,n,g=.12,pan=.2){const f=midi(n);sound(t,.40,x=>Math.sin(2*Math.PI*f*x+Math.sin(2*Math.PI*f*3*x)*1.8*Math.exp(-x*16))*Math.exp(-x*12),g,pan,.38);}
function ping(t,n=87,g=.21){const f=midi(n);sound(t,.26,x=>(Math.sin(2*Math.PI*f*x)+.27*Math.sin(2*Math.PI*f*2.005*x))*Math.exp(-x*20),g,-.2,.12);}
// Notifications land on the animated chat bubbles.
for(const [t,n]of [[.4,86],[1.15,89],[1.85,91],[2.45,89],[2.88,93],[3.18,95],[3.48,98]])ping(t,n);
for(let b=0;b<8;b++){pluck(b*.5,57+(b%3)*3,.045,-.2);if(b%2)hat(b*.5,.026);}
sound(3.85,.3,x=>random()*.45*(x/.3)*Math.sin(Math.PI*x/.3),.30,0,.04);
sound(4,.14,x=>Math.sin(2*Math.PI*(95*x-25*x*x))*Math.exp(-x*30),.45);
// Four harmonic colors and a syncopated bass pattern, with a little swing.
const chords=[[57,60,64,67,71],[53,57,60,64,67],[50,57,60,64,65],[52,55,59,62,66]];
const roots=[33,29,26,28];
for(let bar=0;bar<10;bar++){
  const start=4.5+bar*2;if(start>=21.5)break;
  const root=roots[bar%4],notes=chords[bar%4];
  for(let beat=0;beat<4;beat++){
    const t=start+beat*.5;if(t>=21.5)break;
    kick(t,beat===0?.73:.65);
    if(beat%2)clap(t);
    hat(t+.25,.10,true,.35);
    hat(t+.135,.042,false,-.4);hat(t+.385,.035,false,-.3);
  }
  for(const [b,n,len]of [[0,root,.20],[.75,root,.16],[1.5,root+12,.18],[2,root,.24],[2.75,root+7,.16],[3.5,root+12,.16]])if(start+b*.5<21.5)bass(start+b*.5,n,len);
  for(const b of [.5,1.75,2.5,3.5])if(start+b*.5<21.5)chord(start+b*.5,notes,.071,.55,b%2?-.2:.2);
  if(bar>=3){
    const phrase=[76,79,81,83,79,76,74,76];
    for(let j=0;j<4;j++)if(start+j*.5+.25<21.5)pluck(start+j*.5+.25,phrase[(bar+j)%phrase.length],.095,j%2?.45:-.45);
  }
  if(bar%2===1&&start+1.8<21.5){hat(start+1.8,.07);hat(start+1.9,.075);}
}
// A tiny tactile click at the product panel cuts.
for(const t of [6.5,8.5,10.5])sound(t,.035,x=>random()*Math.exp(-x*130),.08,0,.05);
kick(21.5,.65);chord(21.5,[57,60,64,67,71],.10,.5);bass(21.5,33,.48,.40);
// Stereo early reflections and a restrained rhythmic delay.
for(const [delay,g,cross]of [[.061,.19,true],[.113,.16,false],[.173,.12,true],[.25,.21,true],[.375,.12,false],[.5,.08,true]]){
  const d=Math.round(delay*sr);
  for(let i=d;i<size;i++){left[i]+=(cross?wetR:wetL)[i-d]*g;right[i]+=(cross?wetL:wetR)[i-d]*g;}
}
let peak=0;
for(let i=0;i<size;i++){
  const fade=Math.min(1,(size-i)/(sr*.16));
  left[i]=Math.tanh(left[i]*1.12)*fade;right[i]=Math.tanh(right[i]*1.12)*fade;
  peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));
}
const data=Buffer.alloc(44+size*4);
data.write('RIFF',0);data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(2,22);data.writeUInt32LE(sr,24);data.writeUInt32LE(sr*4,28);data.writeUInt16LE(4,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(size*4,40);
for(let i=0;i<size;i++){data.writeInt16LE(Math.round(left[i]/peak*.84*32767),44+i*4);data.writeInt16LE(Math.round(right[i]/peak*.84*32767),46+i*4);}
const out=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public/projects/host-mode/soundtrack.wav');
await fs.writeFile(out,data);
console.log('Saved original 22-second instrumental and synchronized sound effects.');

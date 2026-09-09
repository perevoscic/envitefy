
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const dir='out/john-space-disco/',serveUrl=await bundle({entryPoint:'src/index.ts',outDir:process.cwd()+'/'+dir+'square-bundle'});
const composition=await selectComposition({serveUrl,id:'EnvitefyJohnSpaceDiscoSquare'});
fs.writeFileSync(dir+'square-render-composition.json',JSON.stringify(composition,null,2));
const frames=process.argv.slice(2).length?process.argv.slice(2).map(Number):[0,120,180,240,310,390,450,505,550,595,672,727,790,849,880,899];
for(let i=0;i<frames.length;i+=2)await Promise.all(frames.slice(i,i+2).map(async frame=>{
 const {buffer}=await renderStill({serveUrl,composition,frame,scale:.5,imageFormat:'png',output:null,logLevel:'error'});
 if(!buffer)throw Error('No frame returned');
 execFileSync('ffmpeg',['-y','-v','error','-i','pipe:0','-c:v','libwebp','-quality','85','-compression_level','6',dir+'square-frame-'+frame+'.webp'],{input:buffer,windowsHide:true});
 console.log('Reviewed frame prepared: '+frame);
}));
if(frames.length===16){
 const args=frames.flatMap(frame=>['-i',dir+'square-frame-'+frame+'.webp']);
 const filters=frames.map((f,i)=>'['+i+':v]scale=360:360,drawtext=fontfile=C\\\\:/Windows/Fonts/arial.ttf:text='+f+':x=8:y=8:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.6[v'+i+']');
 filters.push(frames.map((_,i)=>'[v'+i+']').join('')+'xstack=inputs=16:layout='+frames.map((_,i)=>((i%4)*360)+'_'+(Math.floor(i/4)*360)).join('|'));
 execFileSync('ffmpeg',['-y','-v','error',...args,'-filter_complex',filters.join(';'),'-frames:v','1','-c:v','libwebp','-quality','85','-compression_level','6',dir+'square-layout-contact.webp'],{windowsHide:true});
}
console.log('Square review images ready');


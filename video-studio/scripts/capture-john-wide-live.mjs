import {demoSession,out,a} from './john-wide-demo-session.mjs';
import {spawnSync,execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
const {page,context,browser,network}=await demoSession({view:'card',record:true,width:430,height:800});
try {
 const begin=Date.now();
 await page.waitForTimeout(2100);
 await page.getByRole('button',{name:'Overview',exact:true}).click();
 await page.waitForTimeout(1900);
 await page.getByRole('button',{name:'Close card details',exact:true}).click();
 await page.waitForTimeout(1000);
 const elapsed=(Date.now()-begin)/1000;
 const video=await page.video().path();
 await context.close();
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',video],{encoding:'utf8'}));
 const start=Math.max(0,Number(probe.format.duration)-elapsed);
 const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-ss',String(start),'-i',video,'-t','4.667','-vf','fps=30','-an','-c:v','libx264','-preset','fast','-crf','14','-pix_fmt','yuv420p',a+'/wide-ui-live.mp4'],{stdio:'inherit',windowsHide:true});
 if(r.status)throw Error('Live capture encode failed');
 await fs.writeFile('projects/john-space-disco/wide-live-capture.json',JSON.stringify({video,start,elapsed,actualSharedStudioCardPage:true,interaction:'Opened and closed Overview',network},null,2));
 console.log('Moving actual live card captured with Overview interaction.');
} finally {await browser.close();}

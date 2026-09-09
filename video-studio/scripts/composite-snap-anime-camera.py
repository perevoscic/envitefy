from pathlib import Path
import cv2, numpy as np, subprocess, json
root=Path(__file__).resolve().parents[1]; a=root/'public/projects/mom-just-snap-it'; out=root/'out/mom-just-snap-it'
# Select only the stable insert, excluding the generator's initial reference replay.
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-ss','2.4','-i',str(a/'camera-insert.mp4'),'-t','2.4','-vf','fps=30,tpad=stop_mode=clone:stop_duration=0.2','-an','-c:v','libx264','-crf','16',str(out/'camera-selected.mp4')],check=True)
cap=cv2.VideoCapture(str(out/'camera-selected.mp4'))
writer=cv2.VideoWriter(str(out/'camera-composite-intermediate.mp4'),cv2.VideoWriter_fourcc(*'mp4v'),30,(1920,1080))
flyer=cv2.imread(str(a/'flyer.webp')); canvas=np.full((640,360,3),(53,67,64),np.uint8)
small=cv2.resize(flyer,(286,350));canvas[55:405,37:323]=small
cv2.putText(canvas,'PHOTO',(135,31),cv2.FONT_HERSHEY_SIMPLEX,.45,(250,250,250),1,cv2.LINE_AA)
cv2.circle(canvas,(270,480),35,(245,245,245),3,cv2.LINE_AA);cv2.circle(canvas,(270,480),27,(245,245,245),-1,cv2.LINE_AA)
cv2.rectangle(canvas,(26,461),(77,521),(218,218,218),2);canvas[464:518,29:73]=cv2.resize(flyer,(44,54))
cv2.putText(canvas,'1x',(170,590),cv2.FONT_HERSHEY_SIMPLEX,.5,(250,250,250),1,cv2.LINE_AA)
records=[]; first=None
for index in range(78):
 ok,frame=cap.read()
 if not ok:
  if index>=70: frame=last.copy()
  else: raise RuntimeError('Missing frame '+str(index))
 last=frame.copy()
 roi=frame[:1000,300:1300];hsv=cv2.cvtColor(roi,cv2.COLOR_BGR2HSV)
 mask=cv2.inRange(hsv,np.array([0,0,58]),np.array([179,33,135]))
 n,labels,stats,centers=cv2.connectedComponentsWithStats(mask)
 candidates=[(stats[k,4],k) for k in range(1,n) if stats[k,4]>45000 and stats[k,3]>350 and stats[k,2]>150]
 if not candidates: raise RuntimeError('No screen at '+str(index))
 _,lab=max(candidates); x,y,w,h,area=stats[lab];x+=300
 # The glass is nearly rectangular. Its gray mask retains moving fingers and the bezel.
 screen=cv2.resize(canvas,(w,h),interpolation=cv2.INTER_CUBIC)
 if 34<=index<=38:
  alpha=[.25,.82,1,.55,.15][index-34];screen=np.uint8(screen*(1-alpha)+255*alpha)
 keep=np.uint8(labels[y:y+h,x-300:x-300+w]==lab)*255
 keep=cv2.GaussianBlur(keep,(3,3),.5).astype(float)/255
 region=frame[y:y+h,x:x+w];frame[y:y+h,x:x+w]=np.uint8(region*(1-keep[:,:,None])+screen*keep[:,:,None])
 writer.write(frame)
 records.append({'frame':index,'screen':[int(x),int(y),int(w),int(h)]})
 if index in [0,30,35,37,50,75]:cv2.imwrite(str(out/f'camera-ready-{index}.jpg'),frame)
cap.release();writer.release()
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(out/'camera-composite-intermediate.mp4'),'-an','-c:v','libx264','-crf','16','-pix_fmt','yuv420p','-frames:v','78',str(a/'camera-ready.mp4')],check=True)
(out/'camera-screen-tracking.json').write_text(json.dumps(records,indent=2))
print('78 shared camera frames composited; moving finger and bezel preserved.')

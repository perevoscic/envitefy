from pathlib import Path
import cv2,json,numpy as np
root=Path(__file__).resolve().parents[1]
cap=cv2.VideoCapture(str(root/'public/projects/mom-just-snap-it/opening-v3-base.mp4'))
rows=[]
for n in range(210):
 ok,f=cap.read()
 if not ok:break
 if n<125:continue
 hsv=cv2.cvtColor(f,cv2.COLOR_BGR2HSV)
 mask=cv2.inRange(hsv,np.array([73,65,65]),np.array([96,255,235]))
 mask[:230]=0;mask[940:]=0;mask[:,:650]=0;mask[:,1320:]=0
 contours,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
 points=[]
 for c in contours:
  area=cv2.contourArea(c);x,y,w,h=cv2.boundingRect(c);per=cv2.arcLength(c,True)
  circularity=4*np.pi*area/per**2 if per else 0
  if 150<area<4500 and .55<w/h<1.8 and circularity>.25:
   points.append({'xy':[x+w/2,y+h/2],'size':[w,h],'area':round(area),'circularity':round(circularity,2)})
 rows.append({'frame':n,'candidates':points})
 if n in [135,150,165,180]:
  for p in points:
   x,y=map(int,p['xy']);cv2.circle(f,(x,y),32,(0,0,255),2);cv2.putText(f,f'{x},{y}',(x-60,y-40),cv2.FONT_HERSHEY_SIMPLEX,.8,(0,0,255),2)
  cv2.imwrite(str(root/f'out/mom-just-snap-it/magnet-locate-{n}.jpg'),f)
(root/'out/mom-just-snap-it/magnet-candidates-v3.json').write_text(json.dumps(rows,indent=2))
print(json.dumps([r for r in rows if r['frame']%5==0],indent=2))

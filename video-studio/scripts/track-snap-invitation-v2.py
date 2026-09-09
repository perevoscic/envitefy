from pathlib import Path
import cv2, numpy as np, json
root=Path(__file__).resolve().parents[1]; assets=root/'public/projects/mom-just-snap-it'; out=root/'out/mom-just-snap-it'
cap=cv2.VideoCapture(str(assets/'discovery-edit.mp4'))
quad=np.float32([[840,551],[948,550],[972,644],[861,645]])
records=[]; prev=None; prevpoints=None; M=np.eye(3); current=quad.copy()
for i in range(270):
 ok,frame=cap.read()
 if not ok:break
 gray=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
 if i<=158:
  if prev is not None and prevpoints is not None:
   nextpts,status,err=cv2.calcOpticalFlowPyrLK(prev,gray,prevpoints,None,winSize=(25,25),maxLevel=3)
   valid=(status.reshape(-1)>0)&(err.reshape(-1)<24)
   if valid.sum()>=6:
    aff,inliers=cv2.estimateAffine2D(prevpoints[valid],nextpts[valid],method=cv2.RANSAC,ransacReprojThreshold=2)
    if aff is not None and .8<np.linalg.det(aff[:,:2])<1.2:
     step=np.vstack([aff,[0,0,1]]); M=step@M;current=cv2.perspectiveTransform(quad[None],M).reshape(4,2)
  mask=np.zeros_like(gray); surround=np.int32((current-current.mean(0))*1.45+current.mean(0));cv2.fillConvexPoly(mask,surround,255)
  prevpoints=cv2.goodFeaturesToTrack(gray,maxCorners=80,qualityLevel=.015,minDistance=4,mask=mask)
  prev=gray
  records.append({'frame':i,'quad':np.round(current,2).tolist(),'opacity':1 if i<148 else max(0,(158-i)/10)})
  if i%15==0:
   diagnostic=frame.copy();cv2.polylines(diagnostic,[np.int32(current)],True,(0,0,255),2);cv2.imwrite(str(out/f'discovery-track-{i}.jpg'),diagnostic)
 else:records.append({'frame':i,'quad':None,'opacity':0})
cap.release()
(root/'src/mom-just-snap-it/discovery-tracking.json').write_text(json.dumps(records,separators=(',',':')))
print('Saved separate frame-by-frame invitation plane tracking for 270 shared frames.')

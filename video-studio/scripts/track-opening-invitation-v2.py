from pathlib import Path
import cv2,numpy as np,json
root=Path(__file__).resolve().parents[1];a=root/'public/projects/mom-just-snap-it';out=root/'out/mom-just-snap-it'
anchors={0:[[274,267],[325,270],[355,324],[289,323]],8:[[245,246],[288,244],[325,307],[267,310]],15:[[180,166],[237,167],[239,243],[178,243]],23:[[145,151],[196,151],[198,228],[141,228]],30:[[100,222],[146,216],[210,253],[158,268]],38:[[100,222],[142,216],[205,248],[156,261]],60:[[110,225],[150,221],[205,257],[151,274]],68:[[71,201],[126,180],[192,218],[132,245]],75:[[165,124],[176,124],[163,176],[149,182]],83:[[153,92],[200,87],[184,166],[140,168]],90:[[149,86],[201,86],[186,151],[128,150]],98:[[150,88],[202,89],[189,165],[135,163]],120:[[147,91],[198,94],[190,173],[137,171]],128:[[142,90],[197,95],[187,174],[133,173]],135:[[156,92],[199,95],[199,171],[150,168]],143:[[163,96],[222,96],[224,170],[163,166]],150:[[191,139],[239,134],[259,205],[201,216]],158:[[232,64],[333,84],[295,109],[210,87]],165:[[264,86],[311,73],[304,158],[244,158]],173:[[284,179],[291,174],[277,218],[227,231]],180:[[142,210],[153,218],[236,251],[222,258]],188:[[59,214],[90,201],[109,264],[65,284]],194:[[35,198],[76,195],[110,260],[75,282]]}
anchors={k:np.float32(v)*[740/400,680/310]+[590,220] for k,v in anchors.items()}
cap=cv2.VideoCapture(str(a/'opening-lettering-base.mp4'));frames=[]
while True:
 ok,f=cap.read()
 if not ok:break
 frames.append(f)
cap.release();gray=[cv2.cvtColor(f,cv2.COLOR_BGR2GRAY) for f in frames]
def follow(start,end,q):
 result={start:q.copy()};prev=q.copy();direction=1 if end>start else -1
 for n in range(start,end,direction):
  mask=np.zeros_like(gray[n]);large=(prev-prev.mean(0))*1.45+prev.mean(0);cv2.fillConvexPoly(mask,np.int32(large),255)
  pts=cv2.goodFeaturesToTrack(gray[n],80,.015,4,mask=mask)
  current=prev.copy()
  if pts is not None:
   nxt,valid,err=cv2.calcOpticalFlowPyrLK(gray[n],gray[n+direction],pts,None,winSize=(27,27),maxLevel=3);keep=(valid.ravel()>0)&(err.ravel()<35)
   if keep.sum()>=7:
    mat,_=cv2.estimateAffine2D(pts[keep],nxt[keep],method=cv2.RANSAC,ransacReprojThreshold=3)
    if mat is not None:
     test=cv2.transform(prev.astype(np.float32)[None],mat).reshape(4,2)
     if np.linalg.norm(test.mean(0)-prev.mean(0))<150:current=test
  result[n+direction]=current;prev=current
 return result
quads={};keys=sorted(anchors)
for l,r in zip(keys[:-1],keys[1:]):
 forward=follow(l,r,anchors[l]);backward=follow(r,l,anchors[r])
 for n in range(l,r+1):
  t=(n-l)/(r-l);quads[n]=forward[n]*(1-t)+backward[n]*t
records=[];src=np.float32([[0,0],[400,0],[400,500],[0,500]])
for i,frame in enumerate(frames):
 if i not in quads:records.append({'frame':i,'matrix':None,'clip':'','opacity':0});continue
 q=quads[i].astype(np.float32);H=cv2.getPerspectiveTransform(src,q);h=H/H[2,2]
 matrix=[h[0,0],h[1,0],0,h[2,0],h[0,1],h[1,1],0,h[2,1],0,0,1,0,h[0,2],h[1,2],0,1]
 hsv=cv2.cvtColor(frame,cv2.COLOR_BGR2HSV);mask=cv2.inRange(hsv,np.array([9,0,190]),np.array([43,110,255]));area=np.zeros_like(mask);cv2.fillConvexPoly(area,np.int32(q),255);mask=cv2.bitwise_and(mask,area)
 mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8));contours,_=cv2.findContours(mask,cv2.RETR_LIST,cv2.CHAIN_APPROX_SIMPLE);paths=[]
 for c in contours:
  if cv2.contourArea(c)>5:
   pts=cv2.approxPolyDP(c,1.4,True).reshape(-1,2);paths.append('M'+'L'.join(f'{x} {y}' for x,y in pts)+'Z')
 records.append({'frame':i,'matrix':[round(float(v),8) for v in matrix],'clip':' '.join(paths),'opacity':1,'quad':np.round(q,2).tolist()})
 if i in anchors:
  d=frame.copy();cv2.polylines(d,[np.int32(q)],True,(0,0,255),2);cv2.imwrite(str(out/f'opening-track-{i}.jpg'),d)
(root/'src/mom-just-snap-it/opening-tracking.json').write_text(json.dumps(records,separators=(',',':')))
(root/'projects/mom-just-snap-it/opening-lettering-anchors.json').write_text(json.dumps({str(k):v.tolist() for k,v in anchors.items()},indent=2))
print('Opening: 210 frame shared perspective lettering, with masks to preserve hands and paper borders.')


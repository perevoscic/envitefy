from pathlib import Path
import cv2,numpy as np,json,subprocess
root=Path(__file__).resolve().parents[1];a=root/'public/projects/mom-just-snap-it';out=root/'out/mom-just-snap-it'
old=json.loads((root/'src/mom-just-snap-it/opening-tracking.json').read_text())
cap=cv2.VideoCapture(str(a/'opening-v3-corrected.mp4'));records=[];n=0
src=np.float32([[0,0],[400,0],[400,500],[0,500]])
enc=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','bgr24','-s','1920x1080','-r','30','-i','-','-an','-c:v','libx264','-crf','16','-pix_fmt','yuv420p',str(a/'opening-v3-final.mp4')],stdin=subprocess.PIPE)
while True:
 ok,f=cap.read()
 if not ok:break
 record=old[n].copy();quad=record.get('quad')
 if quad is not None:
  q=np.float32(quad);hsv=cv2.cvtColor(f,cv2.COLOR_BGR2HSV)
  rough=np.zeros(f.shape[:2],np.uint8);expanded=(q-q.mean(0))*1.65+q.mean(0);cv2.fillConvexPoly(rough,np.int32(expanded),255)
  cream=cv2.inRange(hsv,np.array([8,0,204]),np.array([44,100,255]));cream=cv2.bitwise_and(cream,rough)
  cream=cv2.morphologyEx(cream,cv2.MORPH_CLOSE,np.ones((7,7),np.uint8))
  contours,_=cv2.findContours(cream,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
  valid=[c for c in contours if cv2.contourArea(c)>500 and cv2.pointPolygonTest(c,tuple(map(float,q.mean(0))),True)>-35]
  paper=max(valid,key=cv2.contourArea) if valid else None
  if 128<=n<=154 and paper is not None:
   hull=cv2.convexHull(paper);approx=cv2.approxPolyDP(hull,.035*cv2.arcLength(hull,True),True).reshape(-1,2)
   if len(approx)==4:
    # Preserve ordering of the old four corners without moving the characters.
    from itertools import permutations
    q=min((np.float32(p) for p in permutations(approx.tolist())),key=lambda p:float(np.linalg.norm(p-np.float32(quad))))
  # Remove only the provider's dark printed glyphs inside the actual cream paper.
  # The final legible party details are an editable SVG in Remotion.
  if 50<=n<=154 and paper is not None:
   interior=np.zeros(f.shape[:2],np.uint8);cv2.drawContours(interior,[paper],-1,255,-1)
   interior=cv2.erode(interior,np.ones((9,9),np.uint8))
   dark=cv2.inRange(hsv,np.array([0,0,30]),np.array([179,145,194]));dark=cv2.bitwise_and(dark,interior)
   dark=cv2.dilate(dark,np.ones((3,3),np.uint8));f=cv2.inpaint(f,dark,4,cv2.INPAINT_TELEA)
  H=cv2.getPerspectiveTransform(src,q);h=H/H[2,2]
  matrix=[h[0,0],h[1,0],0,h[2,0],h[0,1],h[1,1],0,h[2,1],0,0,1,0,h[0,2],h[1,2],0,1]
  hsv=cv2.cvtColor(f,cv2.COLOR_BGR2HSV);mask=cv2.inRange(hsv,np.array([9,0,190]),np.array([43,110,255]));area=np.zeros_like(mask);cv2.fillConvexPoly(area,np.int32(q),255);mask=cv2.bitwise_and(mask,area)
  cs,_=cv2.findContours(mask,cv2.RETR_LIST,cv2.CHAIN_APPROX_SIMPLE);paths=[]
  for c in cs:
   if cv2.contourArea(c)>5:
    pts=cv2.approxPolyDP(c,1.4,True).reshape(-1,2);paths.append('M'+'L'.join(f'{x} {y}' for x,y in pts)+'Z')
  record={'frame':n,'matrix':[round(float(v),8) for v in matrix],'clip':' '.join(paths),'opacity':1 if n<=177 else 0,'quad':q.tolist()}
  if n in [15,60,98,135,143,150,165]:
   debug=f.copy();cv2.polylines(debug,[np.int32(q)],True,(0,0,255),2);cv2.imwrite(str(out/f'opening-v3-lettering-{n}.jpg'),debug)
 records.append(record);enc.stdin.write(f.tobytes());n+=1
enc.stdin.close();cap.release()
if enc.wait():raise RuntimeError('Lettering preparation failed')
(root/'src/mom-just-snap-it/opening-tracking-v3.json').write_text(json.dumps(records,separators=(',',':')))
print('V3 editable invitation geometry and corrected shared source prepared.')

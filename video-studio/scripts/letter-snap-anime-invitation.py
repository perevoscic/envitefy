from pathlib import Path
import cv2, numpy as np, subprocess, json
root=Path(__file__).resolve().parents[1];a=root/'public/projects/mom-just-snap-it';out=root/'out/mom-just-snap-it'
cap=cv2.VideoCapture(str(a/'camera-ready.mp4')); writer=cv2.VideoWriter(str(out/'camera-lettered-intermediate.mp4'),cv2.VideoWriter_fourcc(*'mp4v'),30,(1920,1080))
text=np.zeros((460,400,4),np.uint8)
for words,y,size in [("Mia's 8th",75,1.2),('Birthday',130,1.3),('OCTOBER 17, 2026',205,.64),('2:00 - 4:00 PM',253,.73),('Maple Park',320,.85),('820 W 7th Street',371,.60),('Austin, TX',410,.64)]:
 font=cv2.FONT_HERSHEY_SIMPLEX;tw=cv2.getTextSize(words,font,size,2)[0][0];cv2.putText(text,words,((400-tw)//2,y),font,size,(74,86,72,230),2,cv2.LINE_AA)
q=np.float32([[783,402],[1194,429],[1221,855],[759,828]]);src=np.float32([[0,0],[399,0],[399,459],[0,459]])
orb=cv2.ORB_create(nfeatures=1600);base=None;prevH=np.eye(3)
tracking=json.loads((out/'camera-screen-tracking.json').read_text())
for i in range(78):
 ok,frame=cap.read()
 if not ok:break
 gray=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
 if i==0:
  mask=np.zeros_like(gray);mask[245:1040,950:1440]=255;kp0,des0=orb.detectAndCompute(gray,mask)
 kp,des=orb.detectAndCompute(gray,None)
 if des is not None and des0 is not None:
  pairs=cv2.BFMatcher(cv2.NORM_HAMMING).knnMatch(des0,des,k=2);good=[m for m,n in pairs if m.distance<.75*n.distance]
  if len(good)>=9:
   matrix,inliers=cv2.estimateAffinePartial2D(np.float32([kp0[m.queryIdx].pt for m in good]),np.float32([kp[m.trainIdx].pt for m in good]),method=cv2.RANSAC,ransacReprojThreshold=5)
   if matrix is not None and .7<matrix[0,0]<1.4:prevH=np.vstack([matrix,[0,0,1]])
 target=cv2.perspectiveTransform(q.reshape(1,4,2),prevH.astype(float)).reshape(4,2)
 H=cv2.getPerspectiveTransform(src,target.astype(np.float32));warped=cv2.warpPerspective(text,H,(1920,1080))
 hsv=cv2.cvtColor(frame,cv2.COLOR_BGR2HSV);cream=cv2.inRange(hsv,np.array([8,5,170]),np.array([45,85,255])).astype(float)/255
 xg,yg,wg,hg=tracking[i]['screen'];cream[max(0,yg-95):min(1080,yg+hg+95),max(0,xg-50):min(1920,xg+wg+50)]=0
 alpha=warped[:,:,3].astype(float)/255*cream
 frame=np.uint8(frame*(1-alpha[:,:,None])+warped[:,:,:3]*alpha[:,:,None]);writer.write(frame)
 if i in [0,30,35,50,75]:cv2.imwrite(str(out/f'camera-lettered-{i}.jpg'),frame)
cap.release();writer.release()
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(out/'camera-lettered-intermediate.mp4'),'-an','-c:v','libx264','-crf','16','-pix_fmt','yuv420p',str(a/'camera-final.mp4')],check=True)
print('Shared readable party lettering tracked onto paper; phone and hands preserved.')

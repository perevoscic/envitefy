import cv2, numpy as np, json, subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
base=root/'public/projects/wedding-characters'
out=root/'out/wedding-characters'
cap=cv2.VideoCapture(str(base/'dancer-open-v2.mp4'))
poster=cv2.imread(str(base/'demo-details.png'))
if poster is None: raise RuntimeError('Missing actual invitation capture')
# Use the genuine wedding card including its overlaid actions.
poster=poster[30:637,16:414]
src=np.float32([[0,0],[poster.shape[1]-1,0],[poster.shape[1]-1,poster.shape[0]-1],[0,poster.shape[0]-1]])
writer=cv2.VideoWriter(str(out/'v2-phone-composite-intermediate.mp4'),cv2.VideoWriter_fourcc(*'mp4v'),30,(1080,1920))
records=[]
prev=None
for index in range(27):
    ok,frame=cap.read()
    if not ok: raise RuntimeError('Missing expected frame')
    roi=frame[890:1360,100:500]
    hsv=cv2.cvtColor(roi,cv2.COLOR_BGR2HSV)
    neutral=cv2.inRange(hsv,np.array([0,0,135]),np.array([179,25,245]))
    n,labels,stats,centroids=cv2.connectedComponentsWithStats(neutral)
    candidates=[]
    for label in range(1,n):
        x,y,w,h,area=stats[label]
        cx,cy=centroids[label]
        if area>5500 and h>150 and x>1 and y>1 and x+w<398 and y+h<468:
            candidates.append((area,label))
    if not candidates: raise RuntimeError(f'No isolated glass screen in frame {index}')
    _,label=max(candidates)
    screen=np.uint8(labels==label)*255
    if prev is not None:
        support=np.zeros_like(screen)
        cv2.fillConvexPoly(support,np.int32(prev-[100,890]),255)
        support=cv2.dilate(support,np.ones((15,15),np.uint8))
        screen=cv2.bitwise_and(neutral,support)
    contours,_=cv2.findContours(screen,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    hull=cv2.convexHull(np.concatenate(contours))
    approx=cv2.approxPolyDP(hull,.035*cv2.arcLength(hull,True),True).reshape(-1,2)
    if len(approx)!=4:
        if prev is None: raise RuntimeError('Initial screen contour not quadrilateral')
        approx=prev-[100,890]
    pts=approx.astype(np.float32)+[100,890]
    sums=pts.sum(axis=1);diff=np.diff(pts,axis=1).reshape(-1)
    quad=np.float32([pts[np.argmin(sums)],pts[np.argmin(diff)],pts[np.argmax(sums)],pts[np.argmax(diff)]])
    # The lower-right glass corner is occluded by a moving fingertip; retain its measured relationship to the visible upper-right bezel.
    progress=index/26
    quad[2]=quad[1]+np.float32([140+2*progress,283+4*progress])
    prev=quad.copy()
    matrix=cv2.getPerspectiveTransform(src,quad)
    warped=cv2.warpPerspective(poster,matrix,(1080,1920),flags=cv2.INTER_LINEAR)
    # Preserve original hands and the phone's bezel: composite only the neutral front glass.
    matte=np.zeros((1920,1080),np.uint8)
    cv2.fillConvexPoly(matte,np.int32(quad),255)
    matte=cv2.erode(matte,np.ones((5,5),np.uint8))
    channels=frame.astype(np.int16)
    skin=((channels[:,:,2]-channels[:,:,0])>22)&((channels[:,:,2]-channels[:,:,1])>8)
    dark=channels.max(axis=2)<65
    matte[skin|dark]=0
    alpha=cv2.GaussianBlur(matte,(3,3),0).astype(np.float32)[:,:,None]/255
    # Retain a little native window reflection for glass integration.
    display=warped*.92+frame*.08
    result=np.uint8(np.clip(display*alpha+frame*(1-alpha),0,255))
    writer.write(result)
    records.append({'frame':index,'screenCorners':quad.tolist()})
    if index in (0,13,26):
        cv2.imwrite(str(out/f'v2-composite-frame-{index}.jpg'),result,[cv2.IMWRITE_JPEG_QUALITY,92])
cap.release();writer.release()
(out/'v2-screen-tracking.json').write_text(json.dumps(records,indent=2))
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(out/'v2-phone-composite-intermediate.mp4'),'-c:v','libx264','-crf','17','-preset','fast','-pix_fmt','yuv420p','-an',str(base/'dancer-open-v2-composite.mp4')],check=True)
print('27 phone frames composited; fingertip preserved over real invitation.')






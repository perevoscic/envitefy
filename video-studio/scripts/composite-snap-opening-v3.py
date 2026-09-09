from pathlib import Path
import cv2,json,numpy as np,subprocess
root=Path(__file__).resolve().parents[1];a=root/'public/projects/mom-just-snap-it';out=root/'out/mom-just-snap-it'
cap=cv2.VideoCapture(str(a/'opening-v3-base.mp4'));frames=[]
while True:
 ok,f=cap.read()
 if not ok:break
 frames.append(f)
cap.release()
# The source is a provider edit of the same motion; the paper's shared projective
# tracking is retained and reviewed against the revised physical card.
tracking=json.loads((root/'src/mom-just-snap-it/opening-tracking.json').read_text())
centers={153:(1019,355),154:(1019,355),155:(983,367),156:(983,367),157:(983,367),158:(1009,362),159:(1009,362),160:None,161:None,162:None,163:(1134,321),164:(1134,321),165:(1075,368),166:(1075,368),167:(1075,368),168:(1046,429),169:(1047,429),170:(1003,501),171:(1003,501),172:(1003,501),173:(947,518),174:(947,518),175:(919,544),176:(919,544),177:(919,544),178:(886,577),179:(886,577),180:(831,599),181:(831,599),182:(831,599),183:(767,607),184:(767,607),185:(707,611),186:(707,611),187:(707,611)}
dest=a/'opening-v3-corrected.mp4'
encoder=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','bgr24','-s','1920x1080','-r','30','-i','-','-an','-c:v','libx264','-crf','16','-pix_fmt','yuv420p',str(dest)],stdin=subprocess.PIPE)
for i,f in enumerate(frames):
 if i in centers and centers[i]:
  x,y=centers[i];mask=np.zeros(f.shape[:2],np.uint8);cv2.ellipse(mask,(x,y),(31,32),0,0,360,255,-1)
  f=cv2.inpaint(f,mask,7,cv2.INPAINT_TELEA)
 # The released teal magnet remains at its last refrigerator contact position.
 # Preserve source occlusions by not replacing it while the hand/card covers it.
 if i>=155:
  layer=f.copy();cx,cy=891,400
  cv2.ellipse(layer,(cx+3,cy+4),(26,25),0,0,360,(61,80,65),-1,cv2.LINE_AA)
  cv2.circle(layer,(cx,cy),24,(95,155,117),-1,cv2.LINE_AA)
  cv2.circle(layer,(cx,cy),24,(59,106,79),2,cv2.LINE_AA)
  cv2.ellipse(layer,(cx-5,cy-6),(15,12),-30,190,340,(132,183,145),2,cv2.LINE_AA)
  # Show the magnet once the released invitation has cleared the contact spot.
  q=tracking[i].get('quad')
  occlusion=np.zeros(f.shape[:2],np.uint8)
  if q is not None:cv2.fillConvexPoly(occlusion,np.int32(q),255)
  visible=occlusion==0;f[visible]=layer[visible]
 if i in [0,15,75,98,120,150,165,180,195]:
  debug=f.copy();q=tracking[i].get('quad')
  if q is not None:cv2.polylines(debug,[np.int32(q)],True,(0,0,255),2)
  cv2.imwrite(str(out/f'opening-v3-corrected-track-{i}.jpg'),debug)
 encoder.stdin.write(f.tobytes())
encoder.stdin.close()
if encoder.wait():raise RuntimeError('Opening correction encode failed')
(root/'projects/mom-just-snap-it/opening-v3-composite.json').write_text(json.dumps({'source':'opening-v3-base.mp4','output':dest.name,'removedMagnetCenters':centers,'fixedMagnetCenter':[891,400],'sharedInBothFormats':True},indent=2))
print('Shared opening corrected locally; original and generated revision retained.')

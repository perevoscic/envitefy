from pathlib import Path
from PIL import Image,ImageDraw
import cv2
p=Path('out/mom-just-snap-it');cap=cv2.VideoCapture('public/projects/mom-just-snap-it/opening-lettering-base.mp4');samples=[0,8,15,23,30,38,45,53,60,68,75,83,90,98,105,113,120,128,135,143,150,158,165,173,180,188,195,203];sheet=Image.new('RGB',(1600,7*320),(245,238,225));draw=ImageDraw.Draw(sheet)
for k,i in enumerate(samples):
 cap.set(cv2.CAP_PROP_POS_FRAMES,i);ok,f=cap.read()
 if ok:
  im=Image.fromarray(cv2.cvtColor(f[220:900,590:1330],cv2.COLOR_BGR2RGB));im=im.resize((400,310));sheet.paste(im,((k%4)*400,(k//4)*320));draw.text(((k%4)*400+10,(k//4)*320+5),f'Frame {i}; crop x590 y220 w740 h680',fill='red');im.save(p/f'opening-card-{i}.jpg')
sheet.save(p/'opening-card-contact-v2.jpg');cap.release()

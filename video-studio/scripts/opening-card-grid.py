from PIL import Image,ImageDraw
from pathlib import Path
p=Path('out/mom-just-snap-it'); fs=[0,8,15,23,30,68,75,90,128,150,158,173];s=Image.new('RGB',(1600,930));d=ImageDraw.Draw(s)
for k,n in enumerate(fs):
 im=Image.open(p/f'opening-card-{n}.jpg');g=ImageDraw.Draw(im)
 for x in range(0,400,50):g.line((x,0,x,310),fill=(255,50,30),width=1);g.text((x+2,3),str(x),fill='red')
 for y in range(50,310,50):g.line((0,y,400,y),fill=(255,50,30),width=1);g.text((2,y+2),str(y),fill='red')
 s.paste(im,((k%4)*400,(k//4)*310));d.text(((k%4)*400+330,(k//4)*310+25),str(n),fill='blue')
s.save(p/'opening-card-grid.jpg')

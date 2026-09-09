from PIL import Image,ImageDraw
from pathlib import Path
root=Path.cwd(); files=sorted((root/'out/small-shower').glob('review-16x9-*.jpg'),key=lambda p:int(p.stem.split('-')[-1])); cols=4;w=480;h=288
sheet=Image.new('RGB',(w*cols,h*((len(files)+cols-1)//cols)), '#e9e6dd');draw=ImageDraw.Draw(sheet)
for i,p in enumerate(files):
 im=Image.open(p).convert('RGB');im.thumbnail((480,270));x=i%cols*w;y=i//cols*h;sheet.paste(im,(x,y));draw.text((x+5,y+271),p.stem,fill='#243528')
sheet.save(root/'out/small-shower/layout-wide.jpg',quality=80)

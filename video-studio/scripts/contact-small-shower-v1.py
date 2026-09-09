from PIL import Image,ImageDraw
from pathlib import Path
root=Path.cwd()/'out/small-shower'
for aspect in ['16x9','9x16']:
 files=sorted(root.glob('v1-review-'+aspect+'-*.jpg'),key=lambda p:int(p.stem.split('-')[-1]));cols=4;w,h=(480,288) if aspect=='16x9' else (270,498)
 if not files:continue
 sheet=Image.new('RGB',(w*cols,h*((len(files)+cols-1)//cols)), '#e9e6dd');d=ImageDraw.Draw(sheet)
 for i,p in enumerate(files):
  im=Image.open(p).convert('RGB');im.thumbnail((w,h-18));x=i%cols*w;y=i//cols*h;sheet.paste(im,(x,y));d.text((x+4,y+h-17),p.stem,fill='#243528')
 sheet.save(root/('v1-layout-'+aspect+'.jpg'),quality=83)

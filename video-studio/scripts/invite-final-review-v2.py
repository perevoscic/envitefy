from PIL import Image
from pathlib import Path
p=Path('out/mom-just-snap-it');a=Image.open(p/'fixed-lift-16x9-4.jpg');b=Image.open(p/'fixed-lift-16x9-12.jpg');s=Image.new('RGB',(1200,400));s.paste(a.crop((420,240,720,490)).resize((480,400)),(0,0));s.paste(b.crop((400,230,700,480)).resize((480,400)),(550,0));s.save(p/'lift-recheck-v2.jpg')

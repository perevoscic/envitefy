from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
root=Path.cwd();names=['chat','card','details','share','rsvp','confirmed','calendar','directions'];sheet=Image.new('RGB',(1292,1200),'white')
for i,n in enumerate(names):
 im=Image.open(root/'public/projects/small-shower'/f'demo-{n}.png').convert('RGB').resize((323,600));sheet.paste(im,((i%4)*323,(i//4)*600))
sheet.save(root/'out/small-shower/ui-contact.jpg',quality=80)

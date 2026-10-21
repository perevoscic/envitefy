"""Render the actual AI persona trial evidence; never invent missing outcomes."""
import json
import re
from pathlib import Path
from html import escape

from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
OUT = REPO / 'output' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
TMP = REPO / 'tmp' / 'pdfs' / 'livecard-personas'
TMP.mkdir(parents=True, exist_ok=True)

def clean(s):
    return str(s or '').replace('\u2014', '-').replace('\u2013', '-').replace('\u2011', '-').replace('\u2010', '-')

def p(c, text, x, y, width, size=9.5, leading=14, color='#322d43', bold=False):
    st = ParagraphStyle('body', fontName='SegoeBold' if bold else 'Segoe', fontSize=size,
                        leading=leading, textColor=colors.HexColor(color))
    para = Paragraph(escape(clean(text)).replace('\n', '<br/>'), st)
    _, h = para.wrap(width, 2000)
    para.drawOn(c, x, y-h)
    return y-h

def fit_image(c, path, x, y, w, h):
    im = Image.open(path).convert('RGB')
    iw, ih = im.size
    scale = min(w/iw, h/ih)
    dw, dh = iw*scale, ih*scale
    c.drawImage(ImageReader(im), x+(w-dw)/2, y+(h-dh)/2, dw, dh)

def screenshot_card(path, output):
    """Crop only the screenshot's black surrounding preview; preserve card pixels."""
    im = Image.open(path).convert('RGB')
    w, h = im.size
    # The full-screen preview is centered. Find the widest central non-black band.
    spans = []
    px = im.load()
    for yy in range(int(h*.08), int(h*.62), max(1, h//160)):
        runs = []
        start = None
        for xx in range(int(w*.15), int(w*.85)):
            r,g,b = px[xx, yy]
            on = max(r,g,b) > 36 and max(r,g,b)-min(r,g,b) > 7
            if on and start is None:
                start = xx
            elif not on and start is not None:
                if xx-start > w*.08: runs.append((start, xx))
                start = None
        if start is not None: runs.append((start, int(w*.85)))
        spans.extend((a,b) for a,b in runs if a < w/2 < b)
    if not spans:
        return path
    a,b = max(spans, key=lambda v:v[1]-v[0])
    # Locate card top along central image. Keep full 2:3 artwork, excluding save row.
    top = None
    for yy in range(h//4):
        sample = [px[xx,yy] for xx in range(a+10,b-10,max(1,(b-a)//30))]
        if sum(max(v)>35 for v in sample) > len(sample)*.65:
            top = yy
            break
    if top is None: return path
    bottom = min(h, top+round((b-a)*1.5))
    im.crop((a, top, b, bottom)).save(output)
    return output

for name, file in [('Segoe','segoeui.ttf'), ('SegoeBold','segoeuib.ttf'), ('Georgia','georgia.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path('C:/Windows/Fonts')/file)))

data = json.loads((ROOT/'report-manifest.json').read_text(encoding='utf-8-sig'))
trials = data['trials']
W,H = landscape(A4)
pdf = OUT/'live-card-ai-persona-trials-complete-2026-10-21.pdf'
c = canvas.Canvas(str(pdf), pagesize=(W,H))
c.setTitle('Live Card - 10 AI persona creation trials')
c.setAuthor('Envitefy - AI persona task testing')

def base(n, label):
    c.setFillColor(colors.HexColor('#fbf9f5')); c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(colors.HexColor('#7053ad')); c.rect(36,H-35,24,3,fill=1,stroke=0)
    p(c, label.upper(), 70,H-28,700,8,10,'#7053ad',True)
    c.setStrokeColor(colors.HexColor('#ded8e7')); c.line(36,30,W-36,30)
    p(c,'AI persona task testing - no human participants | October 21, 2026',36,22,700,7,9,'#756e83')
    p(c,str(n),W-55,22,20,7,9,'#756e83')

published = sum(t['published'] for t in trials)
base(1,'Live Card / creation flow evidence')
p(c,'Ten perspectives.\nOne creation flow.',36,H-70,720,34,39,'#251c39',True)
p(c,'Actual cards, exact design prompts and observed friction',38,H-164,720,14,18,'#75618c')
metrics = [(str(len(trials)),'distinct AI personas'),(str(published),'cards published'),('MON 26 OCT','event date in every trial')]
for i,(value,label) in enumerate(metrics):
    x=36+i*258
    c.setFillColor(colors.HexColor('#eee8f5'));c.roundRect(x,265,242,105,12,fill=1,stroke=0)
    p(c,value,x+18,348,210,25 if i<2 else 20,29,'#523487',True)
    p(c,label,x+18,302,210,10,14,'#62556f')
y=p(c,data['conclusion'],38,235,W-76,14,21,'#322840',True)-18
y=p(c,'Method and limits',38,y,W-76,11,15,'#7053ad',True)-7
p(c,data['method'],38,y,W-76,10,15)
c.showPage()

base(2,'Results / recommended simplification')
p(c,'Keep the parallel work. Remove ambiguity.',36,H-64,W-72,23,29,'#251c39',True)
y=H-113
cols=[36,205,460,585,695]
labels=['AI persona','Card','Result','Initial job','Extra work']
for x,lab in zip(cols,labels):p(c,lab,x,y,150,8,11,'#7053ad',True)
y-=22
for t in trials:
    c.setStrokeColor(colors.HexColor('#e3dcea'));c.line(36,y-25,W-36,y-25)
    vals=[f"{t['id']:02d}  {t['role']}",t['title'],'Published' if t['published'] else 'Blocked',t['initial'],t['extra']]
    for x,txt,width in zip(cols,vals,[161,247,117,102,105]):p(c,txt,x,y,width,8,11)
    y-=34
y-=12
p(c,'The next page separates observed friction from proposed improvements. All individual prompts and cards follow.',36,y,W-72,9,13,'#75618c')
c.showPage()
base(3,'Recommended flow / preserve productivity')
p(c,'Your card → Event details → Review',36,H-64,W-72,25,31,'#251c39',True)
y=p(c,'Keep the first step small: title, optional opening line, and the look. Start artwork immediately; collect logistics while it runs.',36,H-110,W-72,12,18)-28
for title,desc in data['priorities']:
    y=p(c,title,36,y,W-72,12,16,'#523487',True)-5
    y=p(c,desc,36,y,W-72,10,15)-20
c.showPage()

for i,t in enumerate(trials,4):
    base(i,f"{t['id']:02d} / {t['role']} / {'published' if t['published'] else 'publication blocked'}")
    y=p(c,t['title'],36,H-64,W-72,22,27,'#251c39',True)
    p(c,t['personaContext'],36,y-8,W-72,9,13,'#75618c')
    image = ROOT/t['image'] if t.get('image') else None
    if image and image.exists():
        if image.suffix.lower() in ['.jpg','.jpeg','.png'] and t.get('cropScreenshot'):
            image=screenshot_card(image,TMP/f"{t['id']:02d}-card-crop.jpg")
        fit_image(c,image,36,112,246,354)
    else:
        c.setFillColor(colors.HexColor('#eee8f5'));c.roundRect(36,112,246,354,10,fill=1,stroke=0)
        p(c,'No card was produced',54,310,210,16,21,'#523487',True)
        p(c,t['blocker'],54,270,210,10,15)
    p(c,'MONDAY, OCTOBER 26, 2026',36,94,246,8,11,'#7053ad',True)
    p(c,t['time']+' - online demo',36,77,246,9,12)
    p(c,'Initial: '+t['initial']+' | '+t['extra'],36,60,246,8,11,'#75618c')
    x=310;width=W-x-36;y=465
    y=p(c,'EXACT CARD WORDS',x,y,width,8,11,'#7053ad',True)-7
    y=p(c,'Title: '+t['title']+'\nOpening: '+(t['opening'] or '(omitted)'),x,y,width,10,14)-12
    y=p(c,'EXACT DESIGN PROMPT',x,y,width,8,11,'#7053ad',True)-7
    y=p(c,t['prompt'],x,y,width,9,13)-13
    y=p(c,'OBSERVED RESULT & FRICTION',x,y,width,8,11,'#7053ad',True)-7
    for observation in t['feedback']:
        y=p(c,'• '+observation,x,y,width,9,13)-5
    if t.get('revisedPrompt'):
        y=p(c,'Revised design prompt: '+t['revisedPrompt'],x,y-4,width,8,11)-8
    url=t.get('url')
    if url:
        y=p(c,'PUBLIC CARD',x,y-5,width,8,11,'#7053ad',True)-5
        link=Paragraph('<link href="'+escape(url)+'" color="#5d3b97">'+escape(url)+'</link>',ParagraphStyle('link',fontName='Segoe',fontSize=8.5,leading=12))
        _,lh=link.wrap(width,100);link.drawOn(c,x,y-lh);y-=lh+8
    elif t.get('blocker'):
        y=p(c,'Publication blocker: '+t['blocker'],x,y-4,width,8.5,12,'#93413a')-8
    p(c,'Full input/action record: '+t['source'],x,52,width,7,10,'#75618c')
    if y<64: raise RuntimeError(f"Page overflow for persona {t['id']}: y={y}")
    c.showPage()
c.save()

# A browsable visual index in the final chat, from the same real image evidence.
sheet=Image.new('RGB',(1600,1140),'#fbf9f5')
d=ImageDraw.Draw(sheet)
font=ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf',21)
small=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',15)
titlefont=ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf',32)
d.text((30,18),'Live Card trials - 10 AI personas',font=titlefont,fill='#251c39')
d.text((30,61),f'{published} published | Monday, October 26, 2026 | AI demos, not real events',font=small,fill='#75618c')
for k,t in enumerate(trials):
    x=30+(k%5)*314;y=110+(k//5)*507
    d.text((x,y),f"{t['id']:02d} {t['role']}",font=font,fill='#523487')
    src=TMP/f"{t['id']:02d}-card-crop.jpg"
    if not src.exists() and t.get('image'):src=ROOT/t['image']
    if src.exists():
        im=Image.open(src).convert('RGB');im.thumbnail((282,395))
        sheet.paste(im,(x+(282-im.width)//2,y+36+(395-im.height)//2))
    else:
        d.rounded_rectangle((x,y+36,x+282,y+431),radius=10,fill='#eee8f5')
        d.text((x+28,y+180),'No card produced',font=small,fill='#75618c')
    name=clean(t['title'])
    while d.textlength(name,font=small)>282:name=name[:-2]+'…'
    d.text((x,y+440),name,font=small,fill='#322d43')
    d.text((x,y+466),'Published' if t['published'] else 'Blocked - see report',font=small,fill='#3c725f' if t['published'] else '#93413a')
sheet.save(ROOT/'ten-persona-card-gallery.jpg',quality=94)
print(json.dumps({'pdf':str(pdf),'gallery':str(ROOT/'ten-persona-card-gallery.jpg'),'published':published,'pages':13}))

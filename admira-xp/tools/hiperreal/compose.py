"""compose.py TANDA "44 45 ..." -> /workspace/uploads/hiperreal-tanda<N>-comparativa.png + per-piece JPGs in catalog/<nn>/hiperreal/preview"""
import sys, os, json, shutil
from PIL import Image, ImageDraw, ImageFont
H=os.path.dirname(os.path.abspath(__file__)); N=sys.argv[1]; pieces=sys.argv[2].split(); CAT=os.environ.get('CAT','/tmp/xpz/inventario/assets/catalog')
cfg=json.load(open(H+'/pieces.json'))['pieces']; U='/workspace/uploads/'
F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',26); f2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
W=760; rows=[]
def tag(d,x,t):
    d.rounded_rectangle((x+14,14,x+14+d.textlength(t,font=F)+24,56),9,fill=(0,0,0)); d.text((x+26,20),t,font=F,fill=(255,255,255))
for n in pieces:
    a=Image.open(f'{H}/out/{n}/before.png').convert('RGB'); b=Image.open(f'{H}/out/{n}/after.png').convert('RGB')
    shutil.copy(f'{H}/out/{n}/before.png',U+f'hiperreal-{n}-antes.png'); shutil.copy(f'{H}/out/{n}/after.png',U+f'hiperreal-{n}-despues.png')
    h=int(a.height*W/a.width); a=a.resize((W,h),Image.LANCZOS); b=b.resize((W,h),Image.LANCZOS)
    row=Image.new('RGB',(2*W+10,h),(18,18,18)); row.paste(a,(0,0)); row.paste(b,(W+10,0)); d=ImageDraw.Draw(row)
    tag(d,0,'ANTES · Best'); tag(d,W+10,'DESPUÉS · Hiperreal')
    label=f'#{n} · {cfg.get(n,{}).get("name","")}'; d.rounded_rectangle((2*W+10-28-d.textlength(label,font=f2),h-48,2*W+10-8,h-10),8,fill=(0,0,0)); d.text((2*W+10-18-d.textlength(label,font=f2),h-42),label,font=f2,fill=(255,255,255))
    rows.append(row)
    pv=f'{CAT}/{int(n):02d}/hiperreal/preview/'; os.makedirs(pv,exist_ok=True); row.save(pv+f'hiperreal-{n}-comparativa.jpg',quality=86)
    Image.open(f'{H}/out/{n}/after.png').convert('RGB').save(pv+'despues.jpg',quality=88)
Ht=sum(r.height for r in rows)+10*(len(rows)-1)+64
c=Image.new('RGB',(2*W+10,Ht),(18,18,18)); d=ImageDraw.Draw(c)
d.text((16,16),f'Hiperreal · tanda {N} · Best → Hiperreal · Cycles (vista previa rápida, 32 muestras)',font=F,fill=(255,255,255)); y=64
for r in rows: c.paste(r,(0,y)); y+=r.height+10
c.save(U+f'hiperreal-tanda{N}-comparativa.png',optimize=True); print(c.size, os.path.getsize(U+f'hiperreal-tanda{N}-comparativa.png'))

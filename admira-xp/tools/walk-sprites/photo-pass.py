#!/usr/bin/env python3
"""Paso fotográfico de las hojas de caminata de Matrix (24-sep-2026).
Toma la hoja renderizada (9x2 fotogramas 192x288), manda cada vista (frente /
espaldas) como UNA rejilla 3x3 sobre croma a grok-imagine (xAI, edición de
imagen) para que las 9 poses salgan de la misma persona, recorta el croma,
realinea cada fotograma al render original (pies en la misma línea, eje del
torso en el mismo x, escala común) y escribe la hoja fotográfica.
Uso: photo-pass.py SRC_DIR OUT_DIR [ids...]   · clave: XAI_API_KEY en el entorno."""
import sys,os,json,base64,io,time,urllib.request,concurrent.futures as cf
import numpy as np
from scipy import ndimage
from PIL import Image
W,H,COLS=192,288,9
SRC,OUT=sys.argv[1],sys.argv[2];os.makedirs(OUT,exist_ok=True)
IDS=sys.argv[3:]
KEY=os.environ.get('XAI_API_KEY','')
sys.path.insert(0,os.path.dirname(__file__))
PROFILES=json.load(open(os.path.join(SRC,'manifest.json')))['profiles']
if not IDS:IDS=list(PROFILES)

def grid(sheet,row):
    g=Image.new('RGBA',(W*3,H*3),(0,255,0,255))
    for k in range(9):g.alpha_composite(sheet.crop((k*W,row*H,(k+1)*W,(row+1)*H)),((k%3)*W,(k//3)*H))
    return g.convert('RGB').resize((W*6,H*6),Image.LANCZOS)

def edit(img,label,view):
    buf=io.BytesIO();img.save(buf,'PNG')
    who=label.split('·')[0].strip()
    prompt=(f"Turn this 3x3 sprite grid of the same person ({who}) walking, seen from the {view} three-quarter view from above, "
      "into a hyperrealistic photograph of a real person: natural skin and hair, real fabric texture and folds, real shoes, "
      "soft warm indoor light from the upper left. Keep EXACTLY the same 9 poses, leg positions, positions in the grid, sizes, "
      "camera angle, clothing, accessories and clothing colours. Same person in all 9 cells. "
      "Do not add hats, caps, bags or any item that is not already in the input. "
      "Flat pure chroma green (#00FF00) background everywhere, no floor, no shadows, no text, no borders.")
    body=json.dumps({"model":"grok-imagine-image-quality","prompt":prompt,
      "image":{"url":"data:image/png;base64,"+base64.b64encode(buf.getvalue()).decode(),"type":"image_url"},"response_format":"b64_json"}).encode()
    for attempt in range(4):
        try:
            req=urllib.request.Request("https://api.x.ai/v1/images/edits",data=body,headers={"Authorization":"Bearer "+KEY,"content-type":"application/json"})
            d=json.load(urllib.request.urlopen(req,timeout=300))
            return Image.open(io.BytesIO(base64.b64decode(d['data'][0]['b64_json']))).convert('RGB')
        except Exception as e:
            print('  retry',label,view,attempt,str(e)[:120],flush=True);time.sleep(10*(attempt+1))
    raise RuntimeError('edit failed '+label+' '+view)

def key(rgb):
    a=np.asarray(rgb).astype(np.float32);r,g,b=a[...,0],a[...,1],a[...,2]
    green=g-np.maximum(r,b)
    alpha=1-np.clip((green-18)/(55-18),0,1)          # strong green → transparent
    g2=np.minimum(g,np.maximum(r,b)+6)               # despill
    out=np.dstack([r,g2,b,alpha*255]).clip(0,255).astype(np.uint8)
    return Image.fromarray(out,'RGBA')

def main_blob(cell):
    # Keep only the person: the largest connected opaque region (+ soft edge).
    a=np.asarray(cell).copy();solid=a[...,3]>60
    lab,n=ndimage.label(solid)
    if n>1:
        sizes=ndimage.sum(solid,lab,range(1,n+1));keep=lab==(1+int(np.argmax(sizes)))
        keep=ndimage.binary_dilation(keep,iterations=2)
        a[...,3]=np.where(keep,a[...,3],0)
    return Image.fromarray(a,'RGBA')

def bbox(alpha,thr=40):
    ys,xs=np.where(alpha>thr)
    if len(xs)<50:return None
    return xs.min(),ys.min(),xs.max(),ys.max()

def torso_cx(alpha,box):
    x0,y0,x1,y1=box;top=alpha[y0:y0+int((y1-y0)*.45),x0:x1+1]
    ys,xs=np.where(top>40);return x0+xs.mean() if len(xs) else (x0+x1)/2

def realign(ref_cells,out_cells):
    # common scale from median height ratio, per-frame translation on feet + torso axis
    ratios=[];pairs=[]
    for ref,out in zip(ref_cells,out_cells):
        ra=np.asarray(ref)[...,3];oa=np.asarray(out)[...,3]
        rb,ob=bbox(ra),bbox(oa);pairs.append((rb,ob,ra,oa))
        if rb and ob:ratios.append((rb[3]-rb[1])/(ob[3]-ob[1]))
    s=float(np.median(ratios)) if ratios else 1
    res=[]
    for (rb,ob,ra,oa),out in zip(pairs,out_cells):
        cell=Image.new('RGBA',(W,H),(0,0,0,0))
        if not(rb and ob):res.append(cell);continue
        own=(rb[3]-rb[1])/(ob[3]-ob[1]);k=own if abs(own/s-1)>.10 else s
        scaled=out.resize((max(1,round(out.width*k)),max(1,round(out.height*k))),Image.LANCZOS)
        sa=np.asarray(scaled)[...,3];sb=bbox(sa)
        if not sb:res.append(cell);continue
        dx=torso_cx(ra,rb)-torso_cx(sa,sb);dy=rb[3]-sb[3]
        canvas=Image.new('RGBA',(W+scaled.width*2,H+scaled.height*2),(0,0,0,0))
        ox,oy=scaled.width+int(round(dx)),scaled.height+int(round(dy))
        canvas.alpha_composite(scaled,(ox,oy))
        aligned=canvas.crop((scaled.width,scaled.height,scaled.width+W,scaled.height+H))
        # The render is the mould: anything outside its silhouette (+ margin for
        # hair and cloth) is the model's floor shadow or chroma residue.
        mould=ndimage.binary_dilation(ra>30,iterations=7)
        soft=ndimage.gaussian_filter(mould.astype(np.float32),1.2)
        arr=np.asarray(aligned).copy();arr[...,3]=(arr[...,3]*np.clip(soft,0,1)).astype(np.uint8)
        res.append(Image.fromarray(arr,'RGBA'))
    return res

def process(pid):
    sheet=Image.open(os.path.join(SRC,f'{pid}.webp')).convert('RGBA')
    out_sheet=Image.new('RGBA',(W*COLS,H*2),(0,0,0,0))
    label=PROFILES[pid]['label']
    for row,view in ((0,'front'),(1,'back')):
        raw=os.path.join(OUT,f'{pid}-{view}-raw.jpg')
        edited=(Image.open(raw).convert('RGB') if os.environ.get('FROM_RAW') and os.path.exists(raw) else edit(grid(sheet,row),label,view)).resize((W*3*2,H*3*2),Image.LANCZOS)
        keyed=key(edited)
        cw,ch=keyed.width//3,keyed.height//3
        out_cells=[main_blob(keyed.crop(((k%3)*cw,(k//3)*ch,(k%3+1)*cw,(k//3+1)*ch)).resize((W,H),Image.LANCZOS)) for k in range(9)]
        ref_cells=[sheet.crop((k*W,row*H,(k+1)*W,(row+1)*H)) for k in range(9)]
        for k,cell in enumerate(realign(ref_cells,out_cells)):out_sheet.alpha_composite(cell,(k*W,row*H))
        if not os.path.exists(raw):edited.save(raw,quality=88)
    out_sheet.save(os.path.join(OUT,f'{pid}.webp'),'WEBP',quality=86,method=6)
    out_sheet.save(os.path.join(OUT,f'{pid}.png'))
    return pid

with cf.ThreadPoolExecutor(4) as ex:
    for f in cf.as_completed([ex.submit(process,p) for p in IDS]):
        try:print('done',f.result(),flush=True)
        except Exception as e:print('FAIL',e,flush=True)

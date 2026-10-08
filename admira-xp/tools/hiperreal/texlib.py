"""Hiperreal texture library (system python: PIL+numpy).
Builds tinted CC0 PBR maps on demand so every catalog colour keeps its designed hue
but gains real grain, pores and wear. Usage: python3 texlib.py KIND HEX SIZE -> prints JSON of paths.
Sources (CC0): Poly Haven oak_veneer_01 (4K), marble_01, concrete_floor_02; ambientCG
Fingerprints002, Smear007, Metal049A, Cardboard004. Procedural maps (pastry, powder) are generated here.
"""
import sys, os, json, hashlib
import numpy as np
from PIL import Image, ImageFilter
T=os.path.join(os.path.dirname(os.path.abspath(__file__)),'tex')+'/'; LIB=T+'lib/'; GEN=T+'gen/'
os.makedirs(LIB,exist_ok=True)
def s2l(c): c=np.asarray(c,np.float32); return np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)
def l2s(c): c=np.clip(c,0,1); return np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055)
def hexrgb(h): h=h.lstrip('#'); return np.array([int(h[i:i+2],16)/255 for i in (0,2,4)],np.float32)
def load(path,size,mode='RGB'):
    im=Image.open(path).convert(mode)
    if im.size[0]!=size: im=im.resize((size,size),Image.LANCZOS)
    return np.asarray(im).astype(np.float32)/255
def save(a,path,q=88):
    Image.fromarray((np.clip(a,0,1)*255+.5).astype(np.uint8)).save(path,quality=q); return path
def tint(src,hexc,size,contrast,name):
    out=f'{LIB}{name}_{hexc.strip("#")}_{size}.jpg'
    if os.path.exists(out): return out
    lin=s2l(load(src,size)); lum=lin@np.array([.2126,.7152,.0722],np.float32)
    rel=lum/max(lum.mean(),1e-4); rel=1+(rel-1)*contrast
    # keep a little of the source hue variation (latewood vs earlywood) so it is not a flat duotone
    hue=lin/np.maximum(lum[...,None],1e-4); hue=hue/hue.reshape(-1,3).mean(0)
    col=s2l(hexrgb(hexc))[None,None,:]*rel[...,None]*(1+(hue-1)*.25)
    return save(l2s(col),out)
def noise(size,seed,octaves=5,base=8):
    r=np.random.default_rng(seed); acc=np.zeros((size,size),np.float32); amp=1; tot=0
    for o in range(octaves):
        n=base*2**o; g=r.random((n,n)).astype(np.float32)
        acc+=amp*np.asarray(Image.fromarray((g*255).astype(np.uint8)).resize((size,size),Image.BICUBIC)).astype(np.float32)/255
        tot+=amp; amp*=.5
    return acc/tot
def normal_from(h,strength):
    gy,gx=np.gradient(h*strength); n=np.stack([-gx,gy,np.ones_like(h)],-1); n/=np.linalg.norm(n,axis=-1,keepdims=True)
    return n*.5+.5
def blotch(seed,size,cells=6):
    r=np.random.default_rng(seed).random((cells,cells)).astype(np.float32)
    m=np.asarray(Image.fromarray((r*255).astype(np.uint8)).resize((size,size),Image.BICUBIC)).astype(np.float32)/255
    return np.clip((m-.45)*2.2,0,1)
def orm(name,rough,metal,size,ao=None):
    out=f'{LIB}{name}_orm_{size}.jpg'
    if os.path.exists(out): return out
    ao=np.ones_like(rough) if ao is None else ao
    return save(np.stack([ao,np.clip(rough,0,1),np.full_like(rough,metal)],-1),out,90)
def imperf(size):
    fp=load(T+'Fingerprints002/Fingerprints002_2K-JPG_Roughness.jpg',size,'L'); sm=load(T+'Smear007/Smear007_2K-JPG_Opacity.jpg',size,'L')
    return fp,sm
def resized(src,name,size):
    out=f'{LIB}{name}_{size}.jpg'
    if not os.path.exists(out): Image.open(src).convert('RGB').resize((size,size),Image.LANCZOS).save(out,quality=90)
    return out
def build(kind,hexc,size):
    size=int(size); r={}
    if kind in ('wood','wood_dark','wood_stained'):
        contrast={'wood':1.0,'wood_dark':.85,'wood_stained':.55}[kind]
        r['basecolor']=tint(T+'oak_veneer_01_Diffuse_4k.jpg',hexc,size,contrast,'oak')
        # HD keeps the 4K colour grain; data maps at 2K keep the master light (web LOD resizes again)
        r['orm']=resized(GEN+'oak_arm_4k.jpg','oak_arm',2048); r['normal']=resized(GEN+'oak_normal_4k.jpg','oak_normal',2048)
    elif kind=='stone':
        # honed limestone / quartz: concrete_floor_02 pores at low contrast (marble_01 is tiled)
        r['basecolor']=tint(T+'concrete_floor_02_Diffuse_2k.jpg',hexc,min(size,2048),.32,'stone')
        out=f'{LIB}stone_orm_2048.jpg'
        if not os.path.exists(out):
            arm=load(T+'concrete_floor_02_arm_2k.jpg',2048); fp,sm=imperf(2048)
            save(np.stack([arm[...,0],np.clip(.16+arm[...,1]*.25+fp*.30*blotch(5,2048)+sm*.05,0,1),np.zeros_like(fp)],-1),out,90)
        r['orm']=out; r['normal']=T+'concrete_floor_02_nor_gl_2k.jpg'
    elif kind=='pastry':
        out=f'{LIB}pastry_{hexc.strip("#")}_1024.jpg'
        h=noise(1024,int(hexc.strip('#'),16)%9973,6,6)
        if not os.path.exists(out):
            c=s2l(hexrgb(hexc)); spots=np.clip((noise(1024,77,4,40)-.62)*3,0,1)*.35
            shade=(.55+.9*h**1.3)[...,None]*(1-.45*spots[...,None])
            # glaze sheen and crumb: warmer highlights, darker caramelised valleys
            col=c[None,None,:]*shade*np.array([1.04,1.0,.92])[None,None,:]
            save(l2s(col),out)
        r['basecolor']=out
        nout=f'{LIB}pastry_normal_1024.jpg'
        if not os.path.exists(nout): save(normal_from(noise(1024,11,6,10),26),nout,92)
        r['normal']=nout
        r['orm']=orm('pastry',.48+.25*noise(1024,13,4,8),0,1024)
    elif kind=='powder':
        fp,sm=imperf(1024); n=noise(1024,21,3,64)
        r['orm']=orm('powder',.42+.10*n+fp*.10*blotch(7,1024)+sm*.03,0,1024)
        nout=f'{LIB}powder_normal_1024.jpg'
        if not os.path.exists(nout): save(normal_from(noise(1024,23,3,96),6),nout,92)
        r['normal']=nout
    elif kind=='metal': r['orm']=GEN+'metal_orm.jpg'
    elif kind=='metal_dark': r['orm']=GEN+'metal_dark_orm.jpg'
    elif kind=='ceramic': r['orm']=GEN+'ceramic_orm.jpg'
    elif kind=='plastic': r['orm']=GEN+'plastic_orm.jpg'
    elif kind=='paper': r['orm']=GEN+'paper_orm.jpg'; r['normal']=GEN+'cardboard_normal_2k.jpg'
    elif kind=='cardboard': r['orm']=GEN+'cardboard_orm.jpg'; r['normal']=GEN+'cardboard_normal_2k.jpg'
    return r
if __name__=='__main__':
    print(json.dumps(build(sys.argv[1],sys.argv[2] if len(sys.argv)>2 else '#808080',sys.argv[3] if len(sys.argv)>3 else 2048)))

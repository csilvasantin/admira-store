"""Deterministic PBR maps and interpreted printed graphics for the PG103 rack.
No photographic pixels or official packaging artwork are reproduced.
Run with system Python (Pillow/NumPy), output directory as first argument.
"""
import sys, pathlib, numpy as np
from PIL import Image, ImageDraw, ImageFont
out=pathlib.Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
size=1024;rng=np.random.default_rng(103)
font_path='/System/Library/Fonts/Supplemental/Arial.ttf'
bold_path='/System/Library/Fonts/Supplemental/Arial Bold.ttf'
def font(n,bold=False): return ImageFont.truetype(bold_path if bold else font_path,n)
noise=rng.normal(0,1,(size,size))
# Blue PET body colour with subtle injection/moulding variation.
blue=np.zeros((size,size,3)); blue[:]=[9,44,128]
blue+=noise[:,:,None]*1.2
body=Image.fromarray(np.uint8(np.clip(blue,0,255)))
body.save(out/'bottle-basecolor.png')
# Packaging reference shows the printed white collar, rather than a paper body label.
band=Image.new('RGB',(1024,256),'#edede3');draw=ImageDraw.Draw(band)
ink='#113c6b';cx=512
draw.ellipse((cx-30,30,cx+30,90),fill='#d7b954',outline=ink,width=3)
draw.line((cx-24,59,cx-12,79,cx,51,cx+12,79,cx+24,59),fill=ink,width=3)
draw.text((cx,121),'SOLÁN DE CABRAS',font=font(27,True),fill=ink,anchor='mm')
draw.text((cx,159),'AGUA MINERAL NATURAL',font=font(14),fill=ink,anchor='mm')
draw.rectangle((0,205,1024,256),fill='#124788')
draw.text((cx,232),'100% rPET',font=font(23,True),fill='#edf0e5',anchor='mm')
band.save(out/'neck-band-basecolor.png')
# glTF channel convention: R=occlusion (unused), G=roughness, B=metallic.
def orm(name,rough,metal,spread):
 a=np.zeros((size,size,3),dtype=np.uint8);a[:,:,0]=255
 a[:,:,1]=np.uint8(np.clip(255*rough+noise*spread,0,255));a[:,:,2]=int(255*metal)
 Image.fromarray(a).save(out/name)
orm('bottle-orm.png',.18,0,3)
orm('steel-orm.png',.35,.62,7)
# Finely grained powder coat normal, very small amplitude in the shader.
h=noise*.002;gx,gy=np.gradient(h);normal=np.stack((-gx,-gy,np.ones_like(h)),axis=-1)
normal/=np.linalg.norm(normal,axis=-1)[:,:,None]
Image.fromarray(np.uint8((normal*.5+.5)*255)).save(out/'steel-normal.png')
sign=Image.new('RGB',(512,1024),(17,19,20));d=ImageDraw.Draw(sign)
d.text((256,174),'AGUA',font=font(97,True),fill='#e6e5d9',anchor='mm')
d.text((256,249),'MINERAL',font=font(64,True),fill='#e6e5d9',anchor='mm')
d.line((55,297,457,297),fill='#787970',width=2)
sign.save(out/'water-sign.png')
print('Six deterministic texture maps written',out)

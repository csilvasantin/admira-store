"""Deterministic baked PBR texture library, PNG sRGB albedo and linear data maps."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parent/'textures';ROOT.mkdir(exist_ok=True)
rng=np.random.default_rng(471158)
def noise(n,k):
    a=rng.random((k,k)).astype(np.float32)
    return np.asarray(Image.fromarray(a,mode='F').resize((n,n),Image.Resampling.BICUBIC),dtype=np.float32)*2-1
def write(name,a):
    a=np.clip(a,0,1);Image.fromarray(np.uint8(a*255)).save(ROOT/(name+'.png'),compress_level=6)
def normal(h,strength):
    dx=(np.roll(h,-1,axis=1)-np.roll(h,1,axis=1))*strength
    dy=(np.roll(h,-1,axis=0)-np.roll(h,1,axis=0))*strength
    vec=np.stack((-dx,-dy,np.ones_like(h)),axis=-1);vec/=np.linalg.norm(vec,axis=-1,keepdims=True)
    return vec*.5+.5
n=2048;y,x=np.mgrid[0:1:complex(n),0:1:complex(n)]
broad=noise(n,12);mid=noise(n,64);fine=noise(n,512)
phase=y*157+np.sin(x*9)*.9+np.sin(x*23+y*9)*.28+mid*.17
for cx,cy in [(0.24,.42),(.77,.73)]:
    dist=((x-cx)/.09)**2+((y-cy)/.027)**2
    phase+=np.exp(-dist*.6)*4.2*np.sin(np.arctan2((y-cy)*3,x-cx)*2)
lines=np.sin(phase*2*np.pi)
pores=np.clip(np.sin(phase*2*np.pi*2.13)+fine*.45-.78,0,1)
h=.12*lines+.04*mid+.01*fine-.12*pores
color=np.stack((.76+.035*broad+.024*lines-.075*pores,.55+.030*broad+.024*lines-.065*pores,.31+.027*broad+.020*lines-.042*pores),axis=-1)
write('honey_oak_albedo',color);write('honey_oak_normal',normal(h,2.2));write('honey_oak_roughness',.37+.045*mid+.07*pores)
n=1024;y,x=np.mgrid[0:1:complex(n),0:1:complex(n)]
stripe=np.repeat(rng.normal(0,.5,(n,1)),n,axis=1);fine=noise(n,512);smooth=noise(n,32)
h=stripe*.014+fine*.002
steel=np.stack((.425+stripe*.008+smooth*.006,.445+stripe*.008+smooth*.006,.449+stripe*.008+smooth*.006),axis=-1)
write('graphite_steel_albedo',steel);write('graphite_steel_normal',normal(h,2.6));write('graphite_steel_roughness',.285+stripe*.018+fine*.018)
write('emerald_metal_normal',normal(h,2));write('emerald_metal_roughness',.245+stripe*.012+fine*.009)
paper=noise(n,256)*.012+noise(n,32)*.008+rng.normal(0,.003,(n,n))
write('kraft_paper_albedo',np.stack((.61+paper,.43+paper,.255+paper),axis=-1));write('kraft_paper_normal',normal(paper,3));write('kraft_paper_roughness',.70+paper*2)
glaze=noise(n,512)*.002+noise(n,128)*.0008
write('ceramic_glaze_normal',normal(glaze,1.2));write('ceramic_glaze_roughness',.19+glaze*4)
info={'quality':'matrix','generation':'deterministic procedural baked PBR','maps':[],'normal_convention':'OpenGL tangent space +Y','albedo_space':'sRGB','normal_roughness_space':'linear','wood_grain':'longitudinal U; oak tray UVs cover physical board length'}
for p in sorted(ROOT.glob('*.png')):
    with Image.open(p) as im:info['maps'].append({'file':p.name,'size':list(im.size),'usage':p.stem.rsplit('_',1)[-1]})
(ROOT/'texture-manifest.json').write_text(json.dumps(info,indent=2))
print('PBR_MAPS',len(info['maps']))

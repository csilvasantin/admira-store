from PIL import Image; import numpy as np
def L(f,size=2048): return np.asarray(Image.open(f).convert('L').resize((size,size),Image.LANCZOS)).astype(np.float32)/255
fp=L('Fingerprints002/Fingerprints002_2K-JPG_Roughness.jpg')
sm=L('Smear007/Smear007_2K-JPG_Opacity.jpg')
br=L('Metal049A/Metal049A_2K-JPG_Roughness.jpg')
cb=L('Cardboard004/Cardboard004_2K-JPG_Roughness.jpg')
rng=np.random.default_rng(47)
# low-frequency blotch mask so fingerprints appear in patches, not everywhere
def blotch(seed,size=2048,cells=6):
    r=np.random.default_rng(seed).random((cells,cells)).astype(np.float32)
    m=np.asarray(Image.fromarray((r*255).astype(np.uint8)).resize((size,size),Image.BICUBIC)).astype(np.float32)/255
    return np.clip((m-.45)*2.2,0,1)
def orm(name,rough,metal,ao=None):
    ao=np.ones_like(rough) if ao is None else ao
    a=np.stack([ao,np.clip(rough,0,1),np.full_like(rough,metal)],-1)
    Image.fromarray((a*255+.5).astype(np.uint8)).save(f'gen/{name}_orm.jpg',quality=92); print(name, rough.mean().round(3), np.percentile(rough,[5,95]).round(3))
b1,b2,b3=blotch(1),blotch(2),blotch(3)
orm('ceramic', .07+fp*.55*b1+sm*.06, 0)            # glossy glaze + fingerprints
orm('ceramic_matte', .30+fp*.35*b2+sm*.05, 0)
orm('metal', .20+(br-.03)*2.5+fp*.45*b3+sm*.05, .85) # brushed steel + smudges
orm('metal_dark', .26+(br-.03)*2.5+fp*.40*b1, .5)
orm('plastic', .26+fp*.40*b2+sm*.05, 0)
orm('frame', .42+fp*.25*b3+sm*.08, .6)
orm('cardboard', cb*1.15, 0)
orm('paper', .55+cb*.25, 0)

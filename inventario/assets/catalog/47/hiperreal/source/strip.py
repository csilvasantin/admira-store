import sys
from PIL import Image
pre=sys.argv[1]; out=sys.argv[2]; h=int(sys.argv[3]) if len(sys.argv)>3 else 420
ims=[Image.open(f'/workspace/hiperreal47/out/{pre}-{k}.png').convert('RGB') for k in ['front','tres-cuartos','detalle-tazas']]
ims=[i.resize((int(i.width*h/i.height),h)) for i in ims]
c=Image.new('RGB',(sum(i.width for i in ims),h)); x=0
for i in ims: c.paste(i,(x,0)); x+=i.width
c.save(out)

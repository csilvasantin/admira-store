import numpy as np; from PIL import Image
Image.MAX_IMAGE_PIXELS=None
a=np.asarray(Image.open('oak_veneer_01_Diffuse_4k.jpg').convert('RGB')).astype(np.float32)/255
lin=np.where(a<=.04045,a/12.92,((a+.055)/1.055)**2.4)
r,g,b=lin[...,0],lin[...,1],lin[...,2]; mx=lin.max(-1); mn=lin.min(-1); d=mx-mn+1e-8
h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))/6; s=np.where(mx>0,d/(mx+1e-8),0); v=mx
h=(h-.015)%1; s=np.clip(s*1.35,0,1); v=v*.82
i=np.floor(h*6).astype(int)%6; f=h*6-np.floor(h*6); p=v*(1-s); q=v*(1-f*s); t=v*(1-(1-f)*s)
out=np.zeros_like(lin)
for k,(R,G,B) in enumerate([(v,t,p),(q,v,p),(p,v,t),(p,q,v),(t,p,v),(v,p,q)]):
    m=i==k; out[...,0][m]=R[m]; out[...,1][m]=G[m]; out[...,2][m]=B[m]
srgb=np.where(out<=.0031308,out*12.92,1.055*np.power(np.clip(out,0,1),1/2.4)-.055)
Image.fromarray((np.clip(srgb,0,1)*255+.5).astype(np.uint8)).save('gen/oak_honey_basecolor_4k.jpg',quality=88)
for src,dst in [('oak_veneer_01_arm_4k.jpg','gen/oak_arm_4k.jpg'),('oak_veneer_01_nor_gl_4k.jpg','gen/oak_normal_4k.jpg'),('Cardboard004/Cardboard004_2K-JPG_NormalGL.jpg','gen/cardboard_normal_2k.jpg')]:
    Image.open(src).convert('RGB').save(dst,quality=88)
Image.open('gen/oak_honey_basecolor_4k.jpg').resize((512,512)).save('/tmp/oak_tint.png')

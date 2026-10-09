#!/usr/bin/env python3
"""Validate native photograph/magenta screenshots against independent angular aperture math."""
import argparse,json,math,pathlib
import numpy as np
from PIL import Image

def polygon_mask(x,y,polygon):
    # Standard even/odd crossings, independent of the JavaScript/GLSL implementations.
    p=np.asarray(polygon,float)
    midpoint=float(np.mean(p[:,0]))
    x=x+np.floor((midpoint-x)/2048+.5)*2048
    mask=np.zeros(x.shape,bool)
    for i in range(len(p)):
        ax,ay=p[i-1];bx,by=p[i]
        if by==ay: continue
        crossing=((ay>y)!=(by>y))&(x<(bx-ax)*(y-ay)/(by-ay)+ax)
        mask^=crossing
    return mask

def neighbours(mask,radius,operation):
    if radius==0:return mask.copy()
    padded=np.pad(mask,radius,constant_values=operation=='erode')
    result=np.ones_like(mask) if operation=='erode' else np.zeros_like(mask)
    for dy in range(-radius,radius+1):
        for dx in range(-radius,radius+1):
            shifted=padded[radius+dy:radius+dy+mask.shape[0],radius+dx:radius+dx+mask.shape[1]]
            result=result&shifted if operation=='erode' else result|shifted
    return result

def validate(original,mapped,metadata,tolerance=1,min_coverage=.95,canvas_only=False):
    images=[Image.open(original),Image.open(mapped)]
    if any(image.format!='PNG' for image in images):raise ValueError('Lossless PNG capture required. JPEG ringing/subsampling cannot establish one-pixel containment, regardless of filename.')
    a=np.asarray(images[0].convert('RGB'));b=np.asarray(images[1].convert('RGB'))
    if a.shape!=b.shape:raise ValueError('Screenshot dimensions changed between photograph and mapped mode')
    m=json.loads(pathlib.Path(metadata).read_text())
    if m.get('schema')!='panorama-fit-native-v1':raise ValueError('Expected visible fixture metadata')
    if m.get('mode')!='mapped':raise ValueError('Save metadata from the mapped screenshot')
    if sorted(m.get('masters',[]))!=sorted(['landscape','portrait','jordan','rear','strip','column','tablet']):raise ValueError('Missing campaign master')
    canvas=m['canvas'].copy()
    if canvas_only:
        if a.shape[1]!=canvas.get('pixelWidth',a.shape[1]) or a.shape[0]!=canvas.get('pixelHeight',a.shape[0]):raise ValueError('Lossless canvas pixel dimensions do not match visible metadata')
        canvas['x']=canvas['y']=0;vw,vh=canvas['width'],canvas['height']
    else:vw,vh=m['viewport']['width'],m['viewport']['height']
    scale_x=a.shape[1]/vw;scale_y=a.shape[0]/vh
    if abs(scale_x-scale_y)>.01:raise ValueError('Screenshot must contain the complete browser viewport; width/height scales differ')
    left=max(0,int(math.ceil(canvas['x']*scale_x)));top=max(0,int(math.ceil(canvas['y']*scale_y)));right=min(a.shape[1],int(math.floor((canvas['x']+canvas['width'])*scale_x)));bottom=min(a.shape[0],int(math.floor((canvas['y']+canvas['height'])*scale_y)))
    if right<=left or bottom<=top:raise ValueError('Canvas is outside screenshot')
    a=a[top:bottom,left:right];b=b[top:bottom,left:right]
    yy,xx=np.mgrid[top:bottom,left:right];xx=(xx+.5)/scale_x;yy=(yy+.5)/scale_y
    nx=2*(xx-canvas['x'])/canvas['width']-1;ny=1-2*(yy-canvas['y'])/canvas['height']
    yaw,pitch=float(m['yaw']),float(m['pitch']);forward=np.array([math.cos(pitch)*math.cos(yaw),math.sin(pitch),math.cos(pitch)*math.sin(yaw)])
    # Camera local right = forward × world-up. No translated camera is allowed in fake360.
    right_vector=np.cross(forward,[0,1,0]);right_vector/=np.linalg.norm(right_vector);up_vector=np.cross(right_vector,forward)
    tangent=math.tan(math.radians(float(m['fov']))/2);aspect=canvas['width']/canvas['height']
    ray=forward+nx[...,None]*tangent*aspect*right_vector+ny[...,None]*tangent*up_vector;ray/=np.linalg.norm(ray,axis=2)[...,None]
    photo_x=(np.arctan2(ray[:,:,2],ray[:,:,0])/(2*math.pi)%1)*2048;photo_y=np.arccos(np.clip(ray[:,:,1],-1,1))/math.pi*1024
    expected=np.zeros(nx.shape,bool);surfaces=[]
    for s in m['surfaces']:
        mask=polygon_mask(photo_x,photo_y,s['aperture']);expected|=mask;surfaces.append((s,mask))
    occluded=np.zeros(nx.shape,bool)
    for polygon in m['occluders']:occluded|=polygon_mask(photo_x,photo_y,polygon)
    expected&=~occluded
    allowed=neighbours(expected,tolerance,'dilate')
    delta=np.max(np.abs(a.astype(np.int16)-b.astype(np.int16)),axis=2);changed=delta>4
    bleed=changed&~allowed;solid=changed&(b[:,:,0]>=240)&(b[:,:,1]<=20)&(b[:,:,2]>=240)
    stable=neighbours(expected,max(2,tolerance+1),'erode');missing=stable&~solid
    coverage=float(np.count_nonzero(solid&stable)/max(1,np.count_nonzero(stable)))
    result={'pass':not bool(np.any(bleed)) and int(np.count_nonzero(solid))>100 and (coverage>=min_coverage if np.count_nonzero(stable)>100 else True),'capture':'gpu-canvas-lossless' if canvas_only else 'viewport-lossless','scene':m['scene'],'yaw':yaw,'pitch':pitch,'fov':m['fov'],'screenshot_scale':scale_x,'canvas_pixels':[a.shape[1],a.shape[0]],'changed_pixels':int(np.count_nonzero(changed)),'solid_magenta_pixels':int(np.count_nonzero(solid)),'bleed_pixels':int(np.count_nonzero(bleed)),'stable_aperture_pixels':int(np.count_nonzero(stable)),'missing_interior_pixels':int(np.count_nonzero(missing)),'interior_coverage':coverage,'tolerance_pixels':tolerance,'surfaces':[]}
    for s,mask in surfaces:
        stable_surface=neighbours(mask&~occluded,2,'erode');count=int(np.count_nonzero(stable_surface))
        if count:result['surfaces'].append({'installation':s['installation'],'screen':s.get('screen'),'interior_pixels':count,'magenta_pixels':int(np.count_nonzero(solid&stable_surface)),'coverage':float(np.count_nonzero(solid&stable_surface)/count)})
    if np.any(bleed):
        ys,xs=np.where(bleed);result['bleed_bounds']=[int(xs.min()+left),int(ys.min()+top),int(xs.max()+left),int(ys.max()+top)]
    return result,bleed,missing,(left,top,right,bottom)

def main():
    p=argparse.ArgumentParser();p.add_argument('original');p.add_argument('mapped');p.add_argument('metadata');p.add_argument('--tolerance',type=int,default=1);p.add_argument('--min-coverage',type=float,default=.95);p.add_argument('--canvas-only',action='store_true',help='Validate lossless canvas.toDataURL PNG pixels rather than a full viewport screenshot');p.add_argument('--output');p.add_argument('--diagnostic');args=p.parse_args()
    result,bleed,missing,bounds=validate(args.original,args.mapped,args.metadata,args.tolerance,args.min_coverage,args.canvas_only);output=json.dumps(result,indent=2);print(output)
    if args.output:pathlib.Path(args.output).write_text(output+'\n')
    if args.diagnostic:
        image=np.asarray(Image.open(args.mapped).convert('RGB')).copy();left,top,right,bottom=bounds;crop=image[top:bottom,left:right];crop[bleed]=[255,32,0];crop[missing]=[255,255,0];Image.fromarray(image).save(args.diagnostic)
    raise SystemExit(0 if result['pass'] else 1)
if __name__=='__main__':main()

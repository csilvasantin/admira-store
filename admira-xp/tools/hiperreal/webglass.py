"""webglass.py IN.glb [OUT.glb] [--max 0.35] [--dry]
Web LOD rule (Hiperreal): the web viewer has no reliable transmission, so a glass material (KHR_materials_transmission)
whose every mesh is a SMALL part (largest world-space side <= --max metres: headlamps, bottles, lenses) becomes an opaque
glossy lacquer with its original tint. Only materials the pipeline classed as
`glass` (extras.hiperreal_class) are touched; authored transmission ('keep': PET of 50, pilot 47) stays as it is (and a soft glow when it is a white lamp lens). Large glass (showcase panels,
windscreens above the limit) is left untouched. The HD LOD is never touched: it keeps the real glass for Unreal."""
import json,struct,sys,math
args=[a for a in sys.argv[1:] if not a.startswith('--')]; opt=sys.argv[1:]
MAX=float(opt[opt.index('--max')+1]) if '--max' in opt else .35; DRY='--dry' in opt
src=args[0]; dst=args[1] if len(args)>1 else src
b=open(src,'rb').read(); jl=struct.unpack_from('<I',b,12)[0]; J=json.loads(b[20:20+jl]); rest=b[20+jl:]
def mat4(n):
    if 'matrix' in n: m=n['matrix']; return [[m[c*4+r] for c in range(4)] for r in range(4)]
    t=n.get('translation',[0,0,0]); x,y,z,w=n.get('rotation',[0,0,0,1]); s=n.get('scale',[1,1,1])
    R=[[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]]
    return [[R[r][0]*s[0],R[r][1]*s[1],R[r][2]*s[2],t[r]] for r in range(3)]+[[0,0,0,1]]
def mul(a,b): return [[sum(a[r][k]*b[k][c] for k in range(4)) for c in range(4)] for r in range(4)]
I=[[float(r==c) for c in range(4)] for r in range(4)]
nodes=J.get('nodes',[]); world={}
def walk(i,M):
    W=mul(M,mat4(nodes[i])); world[i]=W
    for c in nodes[i].get('children',[]): walk(c,W)
for s in J.get('scenes',[]):
    for r in s['nodes']: walk(r,I)
size={}  # material -> largest side of any primitive using it
for i,W in world.items():
    n=nodes[i]
    if 'mesh' not in n: continue
    for p in J['meshes'][n['mesh']]['primitives']:
        if 'material' not in p: continue
        a=J['accessors'][p['attributes']['POSITION']]; mn,mx=a['min'],a['max']
        pts=[[W[r][0]*x+W[r][1]*y+W[r][2]*z+W[r][3] for r in range(3)] for x in (mn[0],mx[0]) for y in (mn[1],mx[1]) for z in (mn[2],mx[2])]
        side=max(max(q[k] for q in pts)-min(q[k] for q in pts) for k in range(3))
        size[p['material']]=max(size.get(p['material'],0),side)
changed=[]
for mi,m in enumerate(J.get('materials',[])):
    ext=m.get('extensions',{})
    if 'KHR_materials_transmission' not in ext: continue
    if m.get('extras',{}).get('hiperreal_class')!='glass': continue  # authored glass/PET ('keep', pilot 47) is left alone
    s=size.get(mi,0); small=s<=MAX
    print(('SMALL ' if small else 'LARGE ')+'%-28s %.3f m'%(m.get('name'),s))
    if not small or DRY: continue
    pbr=m.setdefault('pbrMetallicRoughness',{}); c=pbr.get('baseColorFactor',[1,1,1,1])
    # the pipeline lifted glass 78 % towards white: recover the design tint
    o=[min(1,max(0,(x-.78)/.22)) for x in c[:3]]
    lum=.2126*o[0]+.7152*o[1]+.0722*o[2]
    pbr['baseColorFactor']=[*o,1]; pbr['metallicFactor']=0; pbr['roughnessFactor']=.08
    for k in ('KHR_materials_transmission','KHR_materials_volume','KHR_materials_dispersion'): ext.pop(k,None)
    ext['KHR_materials_clearcoat']={'clearcoatFactor':1,'clearcoatRoughnessFactor':.03}
    if lum>.6: m['emissiveFactor']=[x*.35 for x in o]  # white lamp lens: soft glow so it reads as a lamp
    m.pop('alphaMode',None); m['extras']={**m.get('extras',{}),'hiperreal_web':'glass->gloss'}; changed.append(m.get('name'))
if changed and not DRY:
    used=set()
    for m in J['materials']: used|=set(m.get('extensions',{}))
    for k in ('KHR_materials_transmission','KHR_materials_volume','KHR_materials_dispersion'):
        if k not in used:
            for lst in ('extensionsUsed','extensionsRequired'):
                if k in J.get(lst,[]): J[lst].remove(k)
    if 'KHR_materials_clearcoat' not in J.setdefault('extensionsUsed',[]): J['extensionsUsed'].append('KHR_materials_clearcoat')
    js=json.dumps(J,separators=(',',':')).encode(); js+=b' '*((4-len(js)%4)%4)
    out=struct.pack('<III',0x46546C67,2,12+8+len(js)+len(rest))+struct.pack('<II',len(js),0x4E4F534A)+js+rest
    open(dst,'wb').write(out)
print('webglass',src,'->',dst if changed and not DRY else '(sin cambios)',changed)

import bpy, sys, math
sys.path.insert(0,'/workspace/hiperreal47'); from common import *
from mathutils import Vector
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
pct=int(argv[0]) if argv else 100; samples=int(argv[1]) if len(argv)>1 else 128
sc=bpy.context.scene
cycles(samples)
# Original Matrix studio from collection-matrix/source/build_scene.py: grey world + 3 area lights + light floor,
# rotated from collection orientation (front -Y) to catalog orientation (front +X).
w=B.worlds.new('MatrixStudio') if not sc.world else sc.world; sc.world=w; w.use_nodes=True
bg=w.node_tree.nodes.get('Background'); bg.inputs['Color'].default_value=(.22,.22,.22,1); bg.inputs['Strength'].default_value=1
c=Vector((0.46,-1.52,0))
def rot(p): return Vector((-p[1],p[0],p[2]))
for name,loc,power,size in [('Large softbox',(-3,-4,5),550,4),('Fill',(3,-2,3),350,3),('Rim',(1,3,4),650,3)]:
    ld=B.lights.new(name,'AREA'); ld.energy=power; ld.size=size; ob=B.objects.new(name,ld); sc.collection.objects.link(ob)
    ob.location=c+rot(loc)*1.16; look(ob,(c.x,c.y,1.1))
bpy.ops.mesh.primitive_plane_add(size=40,location=(0,-1.52,-0.001)); fl=bpy.context.object
m=B.materials.new('StudioFloor'); m.use_nodes=True; p=m.node_tree.nodes['Principled BSDF']; p.inputs['Base Color'].default_value=(.8,.8,.8,1); p.inputs['Roughness'].default_value=.8; fl.data.materials.append(m)
cams,_=cameras()
only=argv[2].split(',') if len(argv)>2 else list(cams)
for k,cam in cams.items():
    if k not in only: continue
    r=RES[k]; render(cam,f'/workspace/hiperreal47/out/before-{k}.png',(r[0]*pct//100,r[1]*pct//100))

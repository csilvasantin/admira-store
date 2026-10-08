import bpy, math
from mathutils import Vector
B=bpy.data
def products():
    return [o for o in B.objects if o.get('visual_only') and o.get('component_id','').startswith('47-P')]
def center_of(objs):
    pts=[o.matrix_world.translation for o in objs]
    return sum(pts,Vector())/len(pts)
def look(cam,target):
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
def add_camera(name,loc,target,lens,sensor=36):
    cd=B.cameras.new(name); cd.lens=lens; cd.sensor_width=sensor
    ob=B.objects.new(name,cd); bpy.context.scene.collection.objects.link(ob); ob.location=loc; look(ob,target); return ob
def cameras():
    # Catalog orientation: front faces +X, width along -Y (0..-3.04), height Z (0..2.53).
    c=Vector((0.46,-1.52,1.27))
    shelf3=[o for o in products() if o.get('shelf')==3 and o.get('bay')==1]
    t=center_of(shelf3)+Vector((0,0,0.09))
    cams={
      'front':add_camera('Cam_front',(c.x+6.0,c.y,1.36),(c.x,c.y,1.27),62),
      'tres-cuartos':add_camera('Cam_34',(c.x+4.5,c.y-3.65,1.95),(c.x,c.y+.05,1.2),55),
      'detalle-tazas':add_camera('Cam_detail',(t.x+1.45,t.y+0.55,t.z+0.38),(t.x+.05,t.y,t.z-.01),85),
    }
    return cams,t
def cycles(samples=128,thr=.015):
    sc=bpy.context.scene; sc.render.engine='CYCLES'; cy=sc.cycles
    cy.device='CPU'; cy.samples=samples; cy.use_adaptive_sampling=True; cy.adaptive_threshold=thr
    cy.use_denoising=True
    try: cy.denoiser='OPENIMAGEDENOISE'
    except Exception: pass
    cy.max_bounces=10; cy.transmission_bounces=10; cy.glossy_bounces=6; cy.diffuse_bounces=4; cy.transparent_max_bounces=12
    cy.caustics_reflective=False; cy.caustics_refractive=False; cy.blur_glossy=.5
    sc.render.use_persistent_data=True; sc.render.threads_mode='FIXED'; sc.render.threads=8
    sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_depth='8'
    sc.view_settings.view_transform='AgX'
def render(cam,path,res):
    sc=bpy.context.scene; sc.camera=cam; sc.render.resolution_x,sc.render.resolution_y=res; sc.render.resolution_percentage=100
    sc.render.filepath=path; bpy.ops.render.render(write_still=True); print('RENDERED',path,flush=True)
RES={'front':(1400,1180),'tres-cuartos':(1400,1180),'detalle-tazas':(1400,1000)}

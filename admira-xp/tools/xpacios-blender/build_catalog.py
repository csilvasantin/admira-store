"""Reproducible full-volume interpretations of inventory 2–43. Blender Python.
Run from repo root: Blender -b --python .../build_catalog.py -- --native /tmp/xpaceos-native.json
Original stock references and immutable IDs are retained. Units are grid units, not surveyed meters.
"""
import bpy, json, math, sys, argparse
from pathlib import Path
from mathutils import Matrix, Vector
p=argparse.ArgumentParser();p.add_argument('--native',required=True);p.add_argument('--references',default='/tmp/xpaceos-references');p.add_argument('--only',type=int);p.add_argument('--min-number',type=int,default=2);args=p.parse_args(sys.argv[sys.argv.index('--')+1:])
BASE=Path.cwd();OUT=BASE/'inventario/assets/catalog';OUT.mkdir(parents=True,exist_ok=True)
registry=json.loads((BASE/'inventario/registry.json').read_text())
natives=json.loads(Path(args.native).read_text());stock=json.loads((BASE/'inventario/pixeria-cache.json').read_text())['items']
LABELS={19:'Scooter retro',20:'Moto deportiva verde',21:'Sofá Cazafantasmas',22:'Sofá modular verde Matrix',23:'Moto custom',24:'Televisor de piedra',25:'Sofá futurista rojo',26:'Sofá dragón',27:'Sofá bárbaro',28:'Cactus',29:'Coche Cazafantasmas',30:'Pinball espacial',31:'Sofá murciélago',32:'Cuadro familia ogro',33:'Mesa sándwich',34:'Sofá familia amarilla',35:'Sofá amarillo',36:'Mesa casco espacial',37:'Mesa ogro',38:'Sillón gorila',39:'Sofá verde',40:'Chanclas azules',41:'Máquina arcade',42:'Caballo de madera',43:'Silla de madera'}
# Three's Y-up to Blender Z-up. glTF export reverses this exactly.
C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
root=None;mats={};quality='best'
def mat(name,color,metal=0,rough=.65):
 if name in mats:return mats[name]
 def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
 rgb=[linear(int(color.lstrip('#')[i:i+2],16)/255) for i in (0,2,4)]
 m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True;s=m.node_tree.nodes.get('Principled BSDF');s.inputs['Base Color'].default_value=(*rgb,1);s.inputs['Metallic'].default_value=metal;s.inputs['Roughness'].default_value=rough;mats[name]=m;return m
COL={'dark':'#202829','black':'#111719','green':'#254b34','lime':'#73c34b','red':'#b62229','white':'#eee9da','gold':'#bf974b','wood':'#977047','blue':'#2468b4','yellow':'#efbc35','grey':'#62646b','chrome':'#aeb8ba','brown':'#4c3b2c','skin':'#b8cb44','sand':'#b6a77b','purple':'#41323f'}
def material(key):return mat(key,COL.get(key,key),.72 if key in ('chrome','gold') else 0,.28 if key in ('chrome','gold') else .65)
def parent(o,name,key):
 o.name=name;o.parent=root;o.data.materials.append(material(key));return o
def box(name,loc,size,key='wood',bevel=.03):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(loc[0],-loc[2],loc[1]));o=parent(bpy.context.object,name,key);o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel and quality!='good':b=o.modifiers.new('Soft manufactured edges','BEVEL');b.width=min(bevel,min(size)*.25);b.segments=2 if quality=='better' else 3
 return o
def ball(name,loc,size,key='green'):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12 if quality=='good' else 20,ring_count=8 if quality=='good' else 12,location=(loc[0],-loc[2],loc[1]));o=parent(bpy.context.object,name,key);o.scale=(size[0],size[2],size[1]);
 for f in o.data.polygons:f.use_smooth=quality!='good'
 return o
def tube(name,a,b,r,key='chrome',r2=None):
 av=Vector((a[0],-a[2],a[1]));bv=Vector((b[0],-b[2],b[1]));d=bv-av
 bpy.ops.mesh.primitive_cone_add(vertices=10 if quality=='good' else 20,radius1=r,radius2=r if r2 is None else r2,depth=d.length,location=(av+bv)/2);o=parent(bpy.context.object,name,key);o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return o
def wheel(x,y,z,r=.27,width=.14):
 tube('Tyre',(x-width/2,y,z),(x+width/2,y,z),r,'black');tube('Rim',(x-width*.55,y,z),(x+width*.55,y,z),r*.64,'chrome');tube('Hub',(x-width*.58,y,z),(x+width*.58,y,z),r*.21,'dark')
 for a in range(0,360,60):
  t=math.radians(a);tube('Spoke',(x+width*.56,y,z),(x+width*.56,y+math.sin(t)*r*.6,z+math.cos(t)*r*.6),.009,'dark')
def legs(w=1,d=1,height=.7,key='wood'):
 for x in (.13,w-.13):
  for z in (.13,d-.13):box('Leg',(x,height/2,z),(.12,height,.12),key)
def sofa(n):
 cfg={21:('grey','red',4),22:('black','lime',3),25:('red','chrome',4),26:('green','gold',2),27:('brown','wood',2),31:('black','yellow',4),34:('yellow','yellow',4),35:('yellow','gold',2),39:('green','dark',2)}
 key,trim,seats=cfg[n];w=1.8 if seats>=3 else 1.25;d=.9
 box('Upholstered base',(w/2,.26,d/2),(w,.32,d),key,.1)
 for x in (.13,w-.13):
  for z in (.13,d-.13):box('Sofa foot',(x,.075,z),(.12,.15,.12),'dark')
 for i in range(seats):
  x=.18+(i+.5)*(w-.36)/seats;sw=(w-.39)/seats
  box('Seat cushion',(x,.5,.51),(sw,.19,.67),key,.075);back=box('Back cushion',(x,.84,.15),(sw,.58,.21),key,.08);back.rotation_euler.x=.10
  box('Upholstery piping',(x,.61,.82),(sw,.016,.018),trim,.004)
  if n in (21,31,34):
   ball('Decorative cushion',(x,.87,.285),(sw*.37,.16,.035),trim)
   if n==21:ball('Ghost motif',(x,.87,.328),(.052,.095,.012),'white')
   if n==31:
    for s in (-1,1):ball('Wing emblem',(x+s*.075,.9,.325),(.07,.026,.012),'yellow')
   if n==34:
    ball('Face',(x,.89,.326),(.067,.088,.018),'yellow')
    for dx in (-.026,.026):ball('Eyes',(x+dx,.925,.345),(.021,.024,.011),'white');ball('Pupil',(x+dx,.925,.355),(.009,.011,.007),'black')
 for x in (.09,w-.09):box('Armrest',(x,.59,.5),(.18,.55,.81),key,.08)
 if n==22:
  for x in (.09,w-.09):box('Green edge',(x,.874,.5),(.14,.013,.72),'lime')
 if n==25:
  for x in (.045,w-.045):box('Armoured rail',(x,.39,.49),(.06,.17,.87),'chrome');box('Light rail',(x,.49,.52),(.07,.035,.7),'blue')
 if n==27:
  for x in (.07,w-.07):
   box('Timber post',(x,.58,.14),(.2,1.02,.22),'wood')
   for y in (.19,.48,.83):box('Iron strap',(x,y,.14),(.21,.045,.23),'dark')
  for i in range(20):box('Fur tufts',(.13+i*(w-.26)/20,.63,.74),(.07,.04,.2+(.06 if i%2 else 0)),'sand',.01)
 if n==26:
  # Sculpted head, neck, tail, claws and crest: geometry from every angle.
  for j in range(6):ball('Dragon neck',(.1,.64+j*.13,.22-j*.016),(.14,.18,.14),'green')
  ball('Dragon head',(.13,1.49,.26),(.2,.15,.19),'green');ball('Muzzle',(.13,1.43,.42),(.17,.09,.2),'green')
  for x in (-.015,.275):ball('Amber eye',(x,1.52,.33),(.035,.035,.025),'gold');tube('Horn',(x,1.57,.19),(x,1.83,.05),.035,'gold',.002)
  for j in range(10):tube('Back spike',(.28+j*.09,1.06,.12),(.28+j*.09,1.22,.08),.035,'gold',0)
  for j in range(12):a=j*.24;ball('Curved tail',(w-.01+.15*math.sin(a),.38-j*.018,.2+j*.075),(.12-j*.006,.11-j*.005,.14),'green')
  for x in (.06,w-.06):
   ball('Dragon paw',(x,.19,.91),(.17,.1,.16),'green')
   for dx in (-.08,0,.08):tube('Claw',(x+dx,.19,1.01),(x+dx,.16,1.14),.025,'gold',.002)
 return w,d

def custom(n):
 if n in (21,22,25,26,27,31,34,35,39):return sofa(n)
 if n in (19,20,23):
  key={19:'white',20:'green',23:'black'}[n]
  for z in (.3,1.4):wheel(.5,.3,z)
  tube('Frame',(.5,.43,.3),(.5,.47,1.33),.055,'chrome');tube('Fork',(.5,.3,1.4),(.5,.94,1.21),.055,'chrome');tube('Handlebar',(.19,1.07,1.15),(.81,1.07,1.15),.035,'dark')
  box('Saddle',(.5,.83,.57),(.38,.14,.66),'black',.07);ball('Fuel tank',(.5,.72,.94),(.25,.2,.28),key)
  box('Engine',(.5,.48,.79),(.36,.28,.34),'chrome');tube('Exhaust',(.76,.33,.22),(.76,.39,.9),.055,'chrome')
  ball('Headlight',(.5,.95,1.31),(.13,.11,.07),'white');box('Rear light',(.5,.76,.21),(.19,.065,.04),'red')
  if n==19:box('Scooter apron',(.5,.68,1.19),(.5,.68,.11),'blue',.06);box('Footboard',(.5,.37,.99),(.49,.075,.44),'white');box('Windshield',(.5,1.23,1.18),(.42,.33,.035),'grey')
  if n==20:
   for x in (.28,.72):ball('Sport fairing',(x,.62,1.04),(.14,.3,.34),'green')
   box('Windshield',(.5,1.01,1.18),(.31,.24,.04),'black')
  if n==23:
   for x in (.24,.76):box('Saddle bag',(x,.61,.43),(.18,.26,.38),'brown')
  return 1,1.75
 if n==24:
  box('Stone TV cabinet',(.55,.83,.3),(1.1,.9,.57),'sand',.08);box('CRT bezel',(.43,.84,.6),(.74,.58,.05),'dark',.09);ball('Curved CRT',(.43,.84,.635),(.34,.25,.04),'grey')
  for y in (.76,1.03):tube('Tuning dial',(.98,y,.6),(.98,y,.67),.08,'brown')
  legs(1.1,.6,.42)
  for x in (.15,.43,.72,.97):box('Stone joint',(x,1.22,.612),(.012,.14,.018),'brown',0)
  return 1.1,.6
 if n==28:
  tube('Cactus trunk',(.5,0,.5),(.5,1.8,.5),.19,'green');ball('Cactus tip',(.5,1.8,.5),(.19,.17,.19),'green')
  for s,h in ((-1,1.1),(1,.8)):
   tube('Branch',(.5,h*.65,.5),(.5+s*.36,h*.65,.5),.13,'green');tube('Branch tip',(.5+s*.36,h*.65,.5),(.5+s*.36,h,.5),.13,'green');ball('Rounded arm',(.5+s*.36,h,.5),(.13,.13,.13),'green')
  for i in range(24):a=i*2.4;y=.15+(i%8)*.21;tube('Spine',(.5+.19*math.cos(a),y,.5+.19*math.sin(a)),(.5+.23*math.cos(a),y+.025,.5+.23*math.sin(a)),.012,'yellow',0)
  return 1,1
 if n==29:
  box('Car chassis',(.5,.36,1),(.9,.21,1.9),'chrome');box('White body',(.5,.6,1),(.96,.32,1.9),'white',.08);box('Cabin',(.5,.94,.83),(.86,.54,1.06),'white',.08)
  for x in (.055,.945):box('Windows',(x,1.02,.81),(.025,.3,.9),'black');box('Red side stripe',(x,.68,1),(.03,.08,1.85),'red')
  for z in (.35,1.62):
   for x in (.03,.97):wheel(x,.32,z,.25,.13)
  box('Windscreen',(.5,1.02,1.38),(.74,.3,.026),'black');box('Rear window',(.5,1.01,.28),(.72,.31,.03),'black')
  for x in (.17,.83):ball('Headlamp',(x,.58,1.97),(.08,.065,.035),'white');tube('Roof beacon',(x,1.22,.66),(x,1.38,.66),.06,'red')
  box('Roof rack',(.5,1.25,.86),(.7,.09,.66),'chrome');box('Equipment',(.5,1.35,.98),(.35,.16,.25),'yellow');return 1,2
 if n==30:
  legs(.8,1.45,.55,'chrome');box('Pinball cabinet',(.4,.73,.73),(.8,.5,1.45),'blue');play=box('Playfield',(.4,1.01,.87),(.69,.025,1.09),'dark');play.rotation_euler.x=-.10
  for j in range(12):ball('Bumper',(.13+(j%3)*.26,1.08+(j//3)*.02,.41+(j//3)*.22),(.06,.035,.06),['red','gold','blue'][j%3])
  box('Backbox',(.4,1.47,.13),(.87,.83,.22),'grey');box('Backglass',(.4,1.48,.252),(.73,.65,.02),'black');ball('Planet',(.4,1.52,.27),(.2,.2,.018),'blue');return .8,1.45
 if n==32:
  box('Solid picture back',(.6,.85,.14),(1.2,1.7,.12),'wood')
  for x in (.045,1.155):box('Carved vertical frame',(x,.85,.24),(.09,1.7,.15),'gold')
  for y in (.045,1.655):box('Carved horizontal frame',(.6,y,.24),(1.2,.09,.15),'gold')
  # Keep the original illustration as a packed image on a physical framed canvas.
  o=box('Original Pixeria illustration',(.6,.85,.218),(1.06,1.55,.014),'white',0)
  m=bpy.data.materials.new('Original reference illustration');m.use_nodes=True;img=bpy.data.images.load(str(Path(args.references)/'32.png'));img.pack();t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=img;m.node_tree.links.new(t.outputs['Color'],m.node_tree.nodes['Principled BSDF'].inputs['Base Color']);o.data.materials.clear();o.data.materials.append(m)
  return 1.2,.4
 if n in (33,36,37):
  key={33:'wood',36:'black',37:'skin'}[n];legs(1.2,1,.72,key);box('Table top',(.6,.77,.5),(1.3,.13,1.1),key)
  if n==33:
   for y,k in ((.79,'red'),(.84,'lime'),(.88,'yellow')):box('Sandwich layer',(.6,y,.5),(1.29,.045,1.07),k)
   for j in range(4):
    for k in range(3):tube('Cucumber slice',(.15+j*.3,.91,.16+k*.34),(.15+j*.3,.94,.16+k*.34),.13,'green');tube('Tomato',(.3+j*.25,.94,.23+k*.32),(.3+j*.25,.96,.23+k*.32),.09,'red')
  if n==36:
   ball('Helmet dome',(.6,.48,.54),(.4,.31,.39),'black');box('Visor',(.6,.45,.91),(.54,.1,.05),'grey');tube('Mask',(.6,.2,.89),(.6,.43,.89),.14,'dark',.09)
   for x in (.41,.79):box('Cheek armor',(x,.29,.88),(.18,.3,.13),'black')
  if n==37:
   ball('Ogre face',(.6,.56,1.06),(.25,.22,.08),'skin')
   for x in (.39,.81):tube('Ogre ear',(x,.65,1.06),(x+(-.08 if x<.6 else .08),.75,1.06),.035,'skin')
   for x in (.5,.7):ball('Eye',(x,.6,1.14),(.047,.035,.015),'white');ball('Pupil',(x,.6,1.155),(.013,.021,.008),'black')
   box('Smile',(.6,.45,1.142),(.23,.035,.02),'white')
  return 1.3,1.1
 if n==38:
  box('Armchair base',(.55,.25,.5),(1.1,.4,.95),'purple');box('Seat',(.55,.52,.58),(.73,.16,.67),'grey');box('Backrest',(.55,.89,.14),(.87,.75,.22),'purple')
  for x in (.09,1.01):box('Armrest',(x,.64,.53),(.18,.48,.83),'purple')
  ball('Gorilla chest',(.55,.82,.48),(.28,.34,.19),'brown');ball('Gorilla head',(.55,1.22,.44),(.23,.27,.19),'brown');ball('Gorilla muzzle',(.55,1.16,.62),(.18,.12,.08),'grey')
  for x in (.44,.66):ball('Eye',(x,1.3,.611),(.036,.029,.015),'red')
  for x in (.17,.93):ball('Gorilla arm',(x,.79,.61),(.15,.24,.18),'brown');ball('Hand',(x,.68,.76),(.14,.085,.13),'grey')
  return 1.1,1
 if n==40:
  for x in (.27,.75):
   ball('Flip-flop sole',(x,.065,.62),(.22,.065,.56),'blue')
   for s in (-1,1):tube('Sandal strap',(x,.26,.86),(x+s*.16,.13,.42),.045,'blue');tube('White stripe',(x,.288,.85),(x+s*.16,.157,.42),.013,'white')
  return 1,1.2
 if n==41:
  box('Arcade cabinet',(.45,.6,.42),(.9,1.2,.8),'yellow');box('Upper housing',(.45,1.5,.18),(.9,.7,.36),'yellow');box('Monitor surround',(.45,1.36,.386),(.74,.62,.032),'black');box('Game screen',(.45,1.38,.411),(.59,.45,.02),'blue');box('Marquee',(.45,1.84,.32),(.93,.24,.55),'yellow');box('Control deck',(.45,1.06,.6),(.9,.08,.63),'dark')
  for x in (.2,.7):tube('Joystick',(x,1.11,.64),(x,1.21,.64),.02,'chrome');ball('Joystick ball',(x,1.23,.64),(.043,.043,.043),'red')
  for x in (.42,.53):tube('Button',(x,1.1,.7),(x,1.135,.7),.032,'yellow')
  box('Coin door',(.45,.5,.833),(.35,.5,.025),'black');return .9,.9
 if n==42:
  box('Horse body',(.46,.7,.62),(.48,.44,.94),'wood');legs(.9,1.2,.58,'wood');neck=box('Horse neck',(.46,1.12,.98),(.32,.7,.3),'wood');neck.rotation_euler.x=-.25;ball('Horse head',(.46,1.4,1.1),(.2,.23,.27),'wood');box('Muzzle',(.46,1.31,1.34),(.3,.23,.32),'wood')
  for x in (.33,.59):tube('Ear',(x,1.56,1.03),(x,1.78,1.02),.06,'wood',.012);ball('Horse eye',(x,1.46,1.23),(.013,.026,.025),'black')
  tube('Tail',(.46,.79,.18),(.46,.38,.02),.065,'brown');return .9,1.6
 if n==43:
  legs(.8,.8,.78);box('Seat',(.4,.82,.4),(.85,.1,.85),'wood')
  for x in (.08,.72):box('Back upright',(x,1.08,.07),(.09,.76,.1),'wood')
  for y in (1.12,1.31,1.5):box('Back slat',(.4,y,.07),(.78,.15,.09),'wood')
  return .8,.8
 raise ValueError(n)

def native(asset):
 gm={};mm={};hinge=None
 if asset['type']=='door':hinge=bpy.data.objects.new('Door hinge',None);bpy.context.collection.objects.link(hinge);hinge.parent=root;hinge.location=(.08,-.025,0);hinge['doorHinge']=True
 for key,g in asset['geometries'].items():
  mesh=bpy.data.meshes.new(key);pos=g['positions'];idx=g['indices'];mesh.from_pydata([pos[i:i+3] for i in range(0,len(pos),3)],[],[idx[i:i+3] for i in range(0,len(idx),3)]);mesh.update();gm[key]=mesh
 for key,d in asset['materials'].items():
  m=bpy.data.materials.new('Native finish');m.use_nodes=True;s=m.node_tree.nodes['Principled BSDF'];s.inputs['Base Color'].default_value=(*d['color'],d['opacity']);s.inputs['Metallic'].default_value=d['metalness'];s.inputs['Roughness'].default_value=d['roughness'];s.inputs['Alpha'].default_value=d['opacity'];s.inputs['Emission Color'].default_value=(*(d.get('emissive') or [0,0,0]),1);mm[key]=m
 for j,d in enumerate(asset['parts']):
  mesh=gm[d['geometry']].copy();mesh.materials.append(mm[d['material']]);o=bpy.data.objects.new('Native component '+str(j),mesh);bpy.context.collection.objects.link(o);o.parent=hinge if d['door'] else root
  # C transforms local Three vertices too; exported child matrix remains correct.
  vals=d['matrix'];m=Matrix([vals[i::4] for i in range(4)]);o.matrix_local=(Matrix.Translation((-.08,.025,0)) if d['door'] else Matrix.Identity(4)) @ C @ m
  if d['media']:o['mediaSurface']='existing_shared_player'
  for line in asset['materials'][d['material']]['text']:
   font=bpy.data.curves.new('Editable signage','FONT');font.body=line['text'];font.align_x='CENTER';font.align_y='CENTER';font.size=min(.24,1.6/max(1,len(line['text'])));font.extrude=.001
   sign=bpy.data.objects.new('Sign '+line['text'],font);bpy.context.collection.objects.link(sign);sign.parent=root;sign.matrix_local=C @ m @ Matrix.Translation((0,.5-line['y']/160,.006));font.materials.append(mat('Sign ink '+line['color'],line['color']))
  if quality!='best' and len(mesh.polygons)>30:mod=o.modifiers.new('Detail profile','DECIMATE');mod.ratio=.28 if quality=='good' else .68
 # Join static geometry by material to bound render calls; keep media and hinges separate.
 buckets={}
 for o in list(root.children_recursive):
  if o.type=='MESH' and not o.get('mediaSurface'):buckets.setdefault((o.parent.name,o.data.materials[0].name),[]).append(o)
 for group in buckets.values():
  if len(group)<2:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in group:
   o.select_set(True);bpy.context.view_layer.objects.active=o
   for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
  bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join()
 return asset['fp']

assets=[dict(a,number=registry['numbers'][a['id']]) for a in natives]+[dict(a,id='pixeria:'+a['id'],number=registry['numbers']['pixeria:'+a['id']]) for a in stock]
for a in assets:
 n=a['number']
 if n<args.min_number or (args.only and n!=args.only):continue
 folder=OUT/f'{n:02}';folder.mkdir(exist_ok=True)
 for quality in ('good','better','best'):
  bpy.ops.wm.read_factory_settings(use_empty=True);mats={};root=bpy.data.objects.new('inventory_'+str(n),None);bpy.context.collection.objects.link(root)
  root['inventoryId']=a['id'];root['inventoryNumber']=n;root['quality']=quality;root['units']='uncalibrated_grid_units';root['referenceStatus']='interpreted_not_measured'
  fp=native(a) if n<=18 else custom(n)
  # Fit custom geometry to the original logical footprint; no collision changes.
  if n>18:
   scale=min(a['fp'][0]/fp[0],a['fp'][1]/fp[1]);root.scale=(scale,scale,scale)
  bpy.context.view_layer.update();points=[o.matrix_world@Vector(v) for o in root.children_recursive if o.type=='MESH' for v in o.bound_box]
  lo=[min(p[i] for p in points) for i in range(3)];hi=[max(p[i] for p in points) for i in range(3)]
  bpy.context.scene['description']='Full-volume design interpretation. Real physical measurements not provided.'
  bpy.context.preferences.filepaths.save_version=0
  bpy.ops.wm.save_as_mainfile(filepath=str(folder/f'{quality}.blend'),compress=True)
  # Sources retain editable parts/text; delivery meshes are joined by finish.
  for o in list(bpy.context.scene.objects):
   if o.type=='FONT':
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
  groups={}
  for o in list(root.children_recursive):
   if o.type=='MESH' and not o.get('mediaSurface'):groups.setdefault((o.parent.name,o.data.materials[0].name),[]).append(o)
  for group in groups.values():
   if len(group)<2:continue
   bpy.ops.object.select_all(action='DESELECT')
   for o in group:
    o.select_set(True);bpy.context.view_layer.objects.active=o
    for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
   bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join()
  bpy.ops.object.select_all(action='SELECT')
  bpy.ops.export_scene.gltf(filepath=str(folder/f'{quality}.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_extras=True,export_cameras=False,export_lights=False)
  manifest={'schema_version':1,'inventory_id':a['id'],'inventory_number':n,'name':LABELS.get(n,a.get('name')),'quality':quality,'blender_version':bpy.app.version_string,'reference':a.get('url','admira-xp/scripts/life-scene.mjs'),'measured':False,'source_editable':True,'full_volume':True,'footprint':a['fp'],'bounds_gltf':{'min':[lo[0],lo[2],-hi[1]],'max':[hi[0],hi[2],-lo[1]]},'files':{'source':f'{quality}.blend','web':f'{quality}.glb'},'bytes':(folder/f'{quality}.glb').stat().st_size}
  (folder/f'{quality}.manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
  print('CATALOG_EXPORTED',n,quality,manifest['bytes'],flush=True)

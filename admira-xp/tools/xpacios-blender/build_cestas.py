"""PG103 · tres cestas trenzadas del Starbucks de Paseo de Gràcia, desde las fotos de Carlos del 17-10-2026.
Three woven baskets of the Paseo de Gràcia Starbucks, from Carlos's 17-10-2026 photos.

53 · cesta baja de vasos reutilizables con el cartel BE GREEN / low basket of reusable cups with the BE GREEN sign
54 · cesta alta de snacks con el cartel REFRIGERIS · SNACKS / tall snack basket with its sign
55 · cesta alta de café Starbucks 1971 Dark Roast con su cartel / tall 1971 Dark Roast coffee basket with its sign

Blender --background --factory-startup --python-exit-code 1 --python THIS -- REPO [53 54 55]
Metros nominales para proporciones; no es una medición de la tienda. Los vasos y los snacks se dejan caer
con física (Bullet, determinista); las bolsas de café se colocan de pie, en filas, como en la foto.
Nominal metres for proportions, not a store survey. Cups and snacks are dropped with rigid-body physics.
"""
import bpy, math, json, pathlib, sys, random
from mathutils import Vector, Euler

args = sys.argv[sys.argv.index('--') + 1:]
root = pathlib.Path(args[0]); only = {int(a) for a in args[1:]}
tex = root / 'inventario/assets/catalog/cestas/textures'
LOW = dict(rim_z=.50, rim_r=.30, base_z=.24, base_r=.14)
TALL = dict(rim_z=.84, rim_r=.30, base_z=.58, base_r=.14)

def wall_radius(s, z):
    """Cono algo abombado, ancho arriba y estrecho abajo. / Slightly bellied cone."""
    q = min(1, max(0, (z - s['base_z']) / (s['rim_z'] - s['base_z'])))
    return s['base_r'] + (s['rim_r'] - s['base_r']) * (.35 * q + .65 * math.sin(q * math.pi / 2))

def wall_profile(s, steps=12):
    return [(z, wall_radius(s, z)) for z in (s['base_z'] + i / steps * (s['rim_z'] - s['base_z']) for i in range(steps + 1))]
SPECS = {
    53: dict(id='native:starbucksCupBasket', name='Cesta de vasos reutilizables BE GREEN', name_en='BE GREEN reusable cup basket',
             size=LOW, contents='cups', reference='PG103-012'),
    54: dict(id='native:starbucksSnackBasket', name='Cesta de snacks Starbucks', name_en='Starbucks snack basket',
             size=TALL, contents='snacks', reference='PG103-013'),
    55: dict(id='native:starbucksCoffeeBasket', name='Cesta de café Starbucks 1971 Dark Roast', name_en='Starbucks 1971 Dark Roast coffee basket',
             size=TALL, contents='coffee', reference=None),
}
FOOTPRINT = .64  # huella cuadrada en metros; el cesto mide .60 de borde a borde / square footprint, .60 rim
TIERS = {'best': dict(seg=64, rod=12), 'better': dict(seg=32, rod=8), 'good': dict(seg=16, rod=6)}

def linear(c): return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4

def material(name, color, rough=.5, metal=0, transmission=0, image=None, normal=None, orm=None, clip=False, normal_strength=1):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes.get('Principled BSDF')
    rgba = tuple(linear(c) for c in color) + (1,); m.diffuse_color = rgba; b.inputs['Base Color'].default_value = rgba
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    b.inputs['Transmission Weight'].default_value = transmission; b.inputs['IOR'].default_value = 1.46
    def img(file, colorspace='sRGB'):
        im = bpy.data.images.load(str(tex / file), check_existing=True); im.colorspace_settings.name = colorspace; im.pack()
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = im; return n
    if image:
        n = img(image); nt.links.new(n.outputs['Color'], b.inputs['Base Color'])
        if clip:  # recorte por alfa: glTF alphaMode MASK / alpha clip exported as MASK
            r = nt.nodes.new('ShaderNodeMath'); r.operation = 'ROUND'
            nt.links.new(n.outputs['Alpha'], r.inputs[0]); nt.links.new(r.outputs[0], b.inputs['Alpha'])
    if normal:
        n = img(normal, 'Non-Color'); nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = normal_strength
        nt.links.new(n.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    if orm:
        n = img(orm, 'Non-Color'); s = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(n.outputs['Color'], s.inputs['Color'])
        nt.links.new(s.outputs['Green'], b.inputs['Roughness']); nt.links.new(s.outputs['Blue'], b.inputs['Metallic'])
    return m

def tag(obj, number, identity, part, item=None):
    obj['inventoryNumber'] = number; obj['inventoryId'] = identity; obj['inventory_asset'] = identity
    obj['part'] = part; obj['geometry_basis'] = 'interpretive_nominal_metres_not_field_measurements'
    obj['texture_source'] = 'photos_carlos_2026-10-17' if part in ('cup', 'coffee_bag', 'sign_print', 'sign') else 'procedural'
    if item: obj['item_instance'] = item; obj['stock_quantity_verified'] = False
    if obj.type == 'MESH':
        for poly in obj.data.polygons: poly.use_smooth = True
    return obj

def mesh_obj(name, verts, faces, uvs=None, mats=(), mat_index=None):
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    if uvs:
        uv = me.uv_layers.new(name='UVMap')
        for p, coords in zip(me.polygons, uvs):
            for loop, co in zip(p.loop_indices, coords): uv.data[loop].uv = co
    for m in mats: me.materials.append(m)
    if mat_index:
        for p, i in zip(me.polygons, mat_index): p.material_index = i
    return o

def lathe(name, profile, seg, mat, u_repeat=1, cap_bottom=False, cap_top=False):
    """Superficie de revolución; la cara impresa mira a -Y en u=.5. / Revolved surface; print faces -Y at u=.5."""
    verts = []; z0 = profile[0][0]; z1 = profile[-1][0] if profile[-1][0] != profile[0][0] else profile[0][0] + 1
    for z, r in profile:
        for j in range(seg):
            a = math.tau * j / seg; verts.append((r * math.sin(a), -r * math.cos(a), z))
    faces = []; uvs = []
    for i in range(len(profile) - 1):
        v0 = (profile[i][0] - z0) / (z1 - z0); v1 = (profile[i + 1][0] - z0) / (z1 - z0)
        for j in range(seg):
            k = (j + 1) % seg; faces.append((i * seg + j, i * seg + k, (i + 1) * seg + k, (i + 1) * seg + j))
            u0 = j / seg * u_repeat + .5; u1 = (j + 1) / seg * u_repeat + .5
            uvs.append(((u0, v0), (u1, v0), (u1, v1), (u0, v1)))
    if cap_bottom: faces.append(tuple(reversed(range(seg)))); uvs.append([(.5, .02)] * seg)
    if cap_top: n = len(profile) - 1; faces.append(tuple(n * seg + j for j in range(seg))); uvs.append([(.5, .98)] * seg)
    return mesh_obj(name, verts, faces, uvs, (mat,))

def rod(name, a, b, r, mat, seg):
    delta = Vector(b) - Vector(a); mid = (Vector(a) + Vector(b)) / 2
    bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=r, depth=delta.length, location=mid)
    o = bpy.context.object; o.name = name; o.rotation_euler = delta.to_track_quat('Z', 'Y').to_euler(); o.data.materials.append(mat); return o

def torus(name, R, r, z, mat, seg):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=seg, minor_segments=max(8, seg // 6), location=(0, 0, z))
    o = bpy.context.object; o.name = name; o.data.materials.append(mat); return o

def box(name, w, d, h, mats, face_mats=(0, 1, 2, 3, 4, 4)):
    """Caja con base en z=0; caras: frente(-Y), dorso(+Y), derecha(+X), izquierda(-X), tapa, fondo."""
    x, y = w / 2, d / 2
    quads = [((-x, -y, 0), (x, -y, 0), (x, -y, h), (-x, -y, h)), ((x, y, 0), (-x, y, 0), (-x, y, h), (x, y, h)),
             ((x, -y, 0), (x, y, 0), (x, y, h), (x, -y, h)), ((-x, y, 0), (-x, -y, 0), (-x, -y, h), (-x, y, h)),
             ((-x, -y, h), (x, -y, h), (x, y, h), (-x, y, h)), ((-x, y, 0), (x, y, 0), (x, -y, 0), (-x, -y, 0))]
    verts = [v for q in quads for v in q]; faces = [tuple(range(i * 4, i * 4 + 4)) for i in range(6)]
    uv = [((0, 0), (1, 0), (1, 1), (0, 1))] * 6
    return mesh_obj(name, verts, faces, uv, mats, face_mats)

def join(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); o = bpy.context.object; o.name = name; o.data.name = name; return o

def instance(src, name):
    o = src.copy(); o.data = src.data; o.name = name; bpy.context.collection.objects.link(o); return o

def basket(spec, mats, t):
    s = spec['size']; seg = t['seg']; parts = []
    prof = wall_profile(s)
    wall = lathe('Basket woven cord wall', prof, seg * 2, mats['weave'], u_repeat=4); parts.append(wall)
    bottom = lathe('Basket woven bottom', [(s['base_z'], 0.0001), (s['base_z'], s['base_r'])], seg * 2, mats['bottom']); parts.append(bottom)
    parts.append(torus('Basket rolled rope rim', s['rim_r'] + .004, .017, s['rim_z'], mats['rope'], seg * 2))
    parts.append(torus('Basket lower rope ring', s['base_r'] + .002, .009, s['base_z'] + .004, mats['rope'], seg * 2))
    ring_r = s['base_r'] * .82; ring_z = s['base_z'] - .012; foot_r = s['rim_r'] * .86
    parts.append(torus('Stand top ring', ring_r, .0055, ring_z, mats['steel'], seg))
    feet = []
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2; top = (ring_r * math.cos(a), ring_r * math.sin(a), ring_z); foot = (foot_r * math.cos(a), foot_r * math.sin(a), .012)
        feet.append(foot); parts.append(rod('Stand leg %d' % k, top, foot, .0062, mats['steel'], t['rod']))
        bpy.ops.mesh.primitive_cylinder_add(vertices=t['rod'], radius=.009, depth=.012, location=(foot[0], foot[1], .006))
        f = bpy.context.object; f.name = 'Stand foot %d' % k; f.data.materials.append(mats['steel']); parts.append(f)
    # Cruceta en X a ras de suelo entre pies opuestos. / X cross brace between opposite feet at floor level.
    parts.append(rod('Stand floor cross A', feet[0], feet[2], .0055, mats['steel'], t['rod']))
    fb = [(feet[1][0], feet[1][1], .02), (feet[3][0], feet[3][1], .02)]
    parts.append(rod('Stand floor cross B', fb[0], fb[1], .0055, mats['steel'], t['rod']))
    for o in parts: tag(o, spec['number'], spec['id'], 'basket' if 'Stand' not in o.name else 'stand')
    return wall, bottom, parts

def sign_board(spec, name, w, h, face, edge, at, lean, part='sign'):
    o = box(name, w, .006, h, (face, edge), (0, 1, 1, 1, 1, 1)); o.location = at; o.rotation_euler = (-math.radians(lean), 0, 0)
    return tag(o, spec['number'], spec['id'], part)

def cup_meshes(spec, mats, t):
    seg = max(16, t['seg'] // 2)
    hot = lathe('Hot cup body', [(0, .0285), (.003, .031), (.150, .0445), (.153, .0452)], seg, mats['cup_hot'], cap_bottom=True)
    lid = lathe('Hot cup lid', [(.150, .0462), (.161, .0468), (.164, .0455), (.170, .041), (.172, .030), (.1725, .001)], seg, mats['lid'], cap_top=True)
    hot = join([hot, lid], 'Reusable hot cup')
    cold = lathe('Cold cup body', [(0, .029), (.004, .031), (.180, .0475), (.183, .048)], seg, mats['cup_cold'], cap_bottom=True)
    dome = [(.183 + .034 * math.sin(math.radians(a)), .049 * math.cos(math.radians(a))) for a in range(0, 81, 10)] + [(.2175, .006)]
    lid = lathe('Cold cup dome lid', dome, seg, mats['dome'])
    cold = join([cold, lid], 'Reusable cold cup with dome lid')
    for o in (hot, cold):  # centro de masas en el centro del vaso, no en su base / mass centre mid-cup, not at its base
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS'); o.location = (0, 0, -8)  # fuente fuera de escena / parked off scene
    return hot, cold

def coffee_bag(mats):
    bag = box('1971 Dark Roast bag', .115, .065, .215, (mats['bag_front'], mats['bag_back'], mats['bag_side_a'], mats['bag_side_b'], mats['bag_plain']))
    fin = box('Bag folded top seal', .104, .004, .02, (mats['bag_plain'],), (0, 0, 0, 0, 0, 0)); fin.location = (0, 0, .213)
    bpy.ops.object.select_all(action='DESELECT'); fin.select_set(True); bpy.context.view_layer.objects.active = fin
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    bag = join([bag, fin], 'Starbucks 1971 Dark Roast 250 g bag')
    mod = bag.modifiers.new('Soft folds', 'BEVEL'); mod.width = .003; mod.segments = 2
    bag.location = (0, 0, -8); return bag

def pillow(name, mat, w=.17, h=.25, bulge=.032, nx=10, ny=14):
    """Bolsa almohada: frente y dorso abombados que comparten el borde. / Pillow bag sharing its perimeter."""
    verts = []; idx = {}
    def f(u, v):
        crimp = 0 if v < .07 or v > .93 else 1
        return bulge * crimp * (math.sin(math.pi * u) ** .6) * (math.sin(math.pi * min(1, max(0, (v - .07) / .86))) ** .5)
    for side in (-1, 1):
        for j in range(ny + 1):
            for i in range(nx + 1):
                u, v = i / nx, j / ny
                edge = i in (0, nx) or j in (0, ny)
                if side == 1 and edge: idx[(1, i, j)] = idx[(-1, i, j)]; continue
                idx[(side, i, j)] = len(verts); verts.append(((u - .5) * w, side * f(u, v), v * h - h / 2))
    faces = []; uvs = []
    for side in (-1, 1):
        for j in range(ny):
            for i in range(nx):
                q = [idx[(side, i, j)], idx[(side, i + 1, j)], idx[(side, i + 1, j + 1)], idx[(side, i, j + 1)]]
                uv = [(i / nx, j / ny), ((i + 1) / nx, j / ny), ((i + 1) / nx, (j + 1) / ny), (i / nx, (j + 1) / ny)]
                if side == -1: uvs.append([(x * .5, y) for x, y in uv]); faces.append(tuple(q))
                else: uvs.append([(1 - x * .5, y) for x, y in reversed(uv)]); faces.append(tuple(reversed(q)))
    o = mesh_obj(name, verts, faces, uvs, (mat,)); o.location = (0, 0, -8); return o

def collider(spec, guard=4):
    """Cuenco macizo e invisible solo para la física. / Solid invisible bowl, physics only."""
    s = spec['size']; prof = [(s['base_z'], .0001)] + wall_profile(s)
    prof += [(s['rim_z'] + .1, s['rim_r'] + .02), (s['rim_z'] + guard, s['rim_r'] + .02)]  # tubo de guarda: nada sale volando / guard tube
    o = lathe('Physics bowl', prof, 48, bpy.data.materials.new('physics'))
    m = o.modifiers.new('Thick', 'SOLIDIFY'); m.thickness = .04; m.offset = 1
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier='Thick'); return o

def simulate(spec, dynamic, colliders, frames=260, guard=4):
    """Deja caer los objetos con Bullet y devuelve sus matrices finales. / Drop with Bullet; return final matrices."""
    scene = bpy.context.scene; bowl = collider(spec, guard); colliders = [bowl] + list(colliders)
    bpy.ops.rigidbody.world_add(); world = scene.rigidbody_world
    world.substeps_per_frame = 20; world.solver_iterations = 30
    world.point_cache.frame_start = 1; world.point_cache.frame_end = frames; scene.frame_start = 1; scene.frame_end = frames
    def add(o, kind, shape, mass=.06, friction=.7):
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.rigidbody.object_add(type=kind); rb = o.rigid_body; rb.collision_shape = shape
        rb.use_margin = True; rb.collision_margin = .0015; rb.friction = friction; rb.restitution = .05
        rb.linear_damping = .25; rb.angular_damping = .35
        if kind == 'ACTIVE': rb.mass = mass
    for o in colliders: add(o, 'PASSIVE', 'MESH' if o is bowl else 'CONVEX_HULL')
    for o in dynamic: add(o, 'ACTIVE', 'CONVEX_HULL')
    for f in range(1, frames + 1): scene.frame_set(f)
    result = {o.name: o.matrix_world.copy() for o in dynamic}
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.rigidbody.objects_remove(); bpy.ops.rigidbody.world_remove()
    scene.frame_set(1); bpy.data.objects.remove(bowl, do_unlink=True)
    s = spec['size']; lost = [n for n, m in result.items() if m.translation.z < s['base_z'] - .02 or m.translation.z > s['rim_z'] + .3
                               or Vector((m.translation.x, m.translation.y)).length > s['rim_r'] + .02]
    print('physics', spec['number'], len(result), 'dropped,', len(lost), 'outside', [(n, tuple(round(c, 2) for c in result[n].translation)) for n in lost])
    if lost: raise SystemExit('objects outside the basket: %s' % lost)
    return result

def simulate_batches(spec, dynamic, colliders, batch, place):
    """Echa los objetos por tandas desde poca altura; lo ya caído hace de apoyo. / Drop in small batches onto the settled pile."""
    poses = {}; settled = []
    for start in range(0, len(dynamic), batch):
        group = dynamic[start:start + batch]
        for o in settled: o.matrix_world = poses[o.name]
        bpy.context.view_layer.update()
        top = max([(o.matrix_world @ Vector(c)).z for o in settled for c in o.bound_box], default=spec['size']['base_z'])
        for k, o in enumerate(group): place(o, k, top)
        poses.update(simulate(spec, group, list(colliders) + settled, frames=150, guard=max(.3, top + .55 - spec['size']['rim_z'])))
        settled += group
    return poses

def studio(scene, height):
    c = bpy.data.collections.new('STUDIO_RENDER_ONLY'); scene.collection.children.link(c)
    def move(o):
        for coll in list(o.users_collection): coll.objects.unlink(o)
        c.objects.link(o)
    floor = material('Studio grey porcelain tile', (.62, .62, .60), .55)
    bpy.ops.mesh.primitive_plane_add(size=200); o = bpy.context.object; o.name = 'Studio floor'; o.data.materials.append(floor); move(o)
    target = Vector((0, 0, height * .5))
    for name, loc, energy, size in [('Key', (-2.2, -3, 4), 260, 3), ('Fill', (3, -1.5, 2), 130, 2), ('Rim', (1, 3, 3.2), 300, 2)]:
        bpy.ops.object.light_add(type='AREA', location=loc); o = bpy.context.object; o.name = name; o.data.energy = energy; o.data.shape = 'DISK'; o.data.size = size
        o.rotation_euler = (target - o.location).to_track_quat('-Z', 'Y').to_euler(); move(o)
    d = height * 1.9; cam = target + Vector((.48, -.80, .42)).normalized() * d
    bpy.ops.object.camera_add(location=cam); o = bpy.context.object; o.name = 'Studio camera'
    o.rotation_euler = (target - o.location).to_track_quat('-Z', 'Y').to_euler(); o.data.lens = 50; scene.camera = o; move(o)

def build(number, tier, poses):
    spec = dict(SPECS[number], number=number); t = TIERS[tier]; s = spec['size']
    bpy.ops.wm.read_factory_settings(use_empty=True); scene = bpy.context.scene; scene.unit_settings.system = 'METRIC'
    rich = tier != 'good'
    mats = {
        'weave': material('Black PVC woven cord · open weave', (.05, .05, .05), .5, image='tejido-basecolor.png', clip=True,
                          normal='tejido-normal.png' if rich else None, orm='tejido-orm.png' if rich else None, normal_strength=.9),
        'bottom': material('Black PVC woven cord · basket floor', (.035, .035, .035), .55, normal='tejido-normal.png' if rich else None),
        'rope': material('Black twisted rope rim', (.06, .06, .06), .5, image='cuerda-basecolor.jpg', normal='cuerda-normal.png' if rich else None),
        'steel': material('Black powder-coated steel stand', (.03, .032, .034), .38, .55, orm='acero-orm.png' if rich else None),
    }
    wall, bottom, parts = basket(spec, mats, t)
    model = list(parts); counts = {}
    if spec['contents'] == 'cups':
        mats.update(cup_hot=material('Reusable hot cup · siren print', (.93, .93, .9), .42, image='vaso-caliente.jpg'),
                    lid=material('White polypropylene lid', (.93, .93, .9), .4),
                    cup_cold=material('Reusable cold cup · frosted PP, siren print', (.94, .95, .94), .5, transmission=.18, image='vaso-frio.jpg'),
                    dome=material('Clear PET dome lid', (.97, .98, .98), .12, transmission=.75),
                    sign=material('BE GREEN sign · photo print', (1, 1, 1), .55, image='cartel-be-green.jpg'),
                    sign_edge=material('Sign board edge', (.92, .92, .9), .6))
        board = sign_board(spec, 'BE GREEN sign board', .40, 1.15, mats['sign'], mats['sign_edge'], (0, .10, s['base_z'] + .12), 7)
        model.append(board)
        hot, cold = cup_meshes(spec, mats, t); rnd = random.Random(103)
        cups = [instance(hot if i % 2 == 0 else cold, '%s %02d' % ('Hot cup' if i % 2 == 0 else 'Cold cup', i + 1)) for i in range(28)]
        def place(o, k, top):  # dos vasos tumbados por capa, de lado / two side-by-side lying cups per layer
            layer, side = divmod(k, 2); yaw = rnd.uniform(0, math.tau)
            rot = Euler((math.pi / 2 + rnd.uniform(-.25, .25), rnd.uniform(0, math.tau), yaw))
            side_off = Euler((0, 0, yaw)).to_matrix() @ Vector((.066 * (1 if side else -1), 0, 0))
            centre = Vector((rnd.uniform(-.06, .06), -.07 + rnd.uniform(-.05, .05), max(top, s['base_z']) + .08 + layer * .16)) + side_off
            o.location = centre; o.rotation_euler = rot
        if poses is None: poses = simulate_batches(spec, cups, [board], 4, place)
        for o in cups: o.matrix_world = poses[o.name]; tag(o, number, spec['id'], 'cup', o.name.lower().replace(' ', '-'))
        bpy.data.objects.remove(hot, do_unlink=True); bpy.data.objects.remove(cold, do_unlink=True)
        model += cups; counts = {'visual_cup_count': len(cups), 'hot_cups': 14, 'cold_cups': 14}
    elif spec['contents'] == 'snacks':
        mats.update(sign=material('REFRIGERIS · SNACKS sign', (1, 1, 1), .5, image='cartel-snacks.jpg'),
                    sign_edge=material('Black sign board', (.03, .03, .03), .45))
        designs = [material('Snack bag · interpreted %s' % k, (1, 1, 1), .32, .15, image='snack-%s.jpg' % k) for k in 'abc']
        pole = rod('Sign pole', (0, .12, s['base_z']), (0, .12, 1.18), .004, mats['steel'], t['rod'])
        board = sign_board(spec, 'REFRIGERIS SNACKS sign board', .10, .32, mats['sign'], mats['sign_edge'], (0, .115, 1.0), 0)
        model += [tag(pole, number, spec['id'], 'sign'), board]
        sources = [pillow('Snack bag source %s' % k, m) for k, m in zip('abc', designs)]
        rnd = random.Random(54); bags = []
        for i in range(26):  # capas de dos bolsas casi planas / layers of two nearly flat bags
            o = instance(sources[i % 3], 'Snack bag %02d' % (i + 1)); layer, side = divmod(i, 2); yaw = (layer % 2) * math.pi / 2
            off = Euler((0, 0, yaw)).to_matrix() @ Vector((.15 * (1 if side else -1), 0, 0))
            o.location = (off.x + rnd.uniform(-.01, .01), off.y - .03 + rnd.uniform(-.01, .01), s['base_z'] + .1 + layer * .17)
            o.rotation_euler = (math.pi / 2 + rnd.uniform(-.35, .35), rnd.uniform(-.35, .35), yaw + math.pi / 2); bags.append(o)
        if poses is None: poses = simulate(spec, bags, [pole])
        for o in bags: o.matrix_world = poses[o.name]; tag(o, number, spec['id'], 'snack_bag', o.name.lower().replace(' ', '-'))
        for o in sources: bpy.data.objects.remove(o, do_unlink=True)
        model += bags; counts = {'visual_bag_count': len(bags), 'snack_brands_confirmed': False}
    else:
        green = (.07, .42, .33)
        mats.update(bag_front=material('1971 Dark Roast bag · front photo', (1, 1, 1), .34, .12, image='bolsa-1971-frontal.jpg'),
                    bag_back=material('1971 Dark Roast bag · back photo', (1, 1, 1), .34, .12, image='bolsa-1971-trasera.jpg'),
                    bag_side_a=material('1971 Dark Roast bag · brewing side photo', (1, 1, 1), .34, .12, image='bolsa-1971-lateral-a.jpg'),
                    bag_side_b=material('1971 Dark Roast bag · story side photo', (1, 1, 1), .34, .12, image='bolsa-1971-lateral-b.jpg'),
                    bag_plain=material('1971 Dark Roast bag · plain foil', green, .34, .12),
                    sign=material('Discover 1971 Dark Roast sign · photo print', (1, 1, 1), .55, image='cartel-1971.jpg'),
                    sign_edge=material('Green sign board edge', green, .6))
        board = sign_board(spec, 'Discover 1971 sign board', .28, .98, mats['sign'], mats['sign_edge'], (0, .105, s['base_z'] + .09), 4)
        model.append(board)
        src = coffee_bag(mats); rnd = random.Random(55); bags = []; top = s['rim_z'] - .075
        r_fill = wall_radius(s, top - .004) - .008
        fill = lathe('Hidden stock under the visible bags', [(top - .004, .0001), (top - .004, r_fill)], t['seg'], mats['bag_plain'])
        model.append(tag(fill, number, spec['id'], 'coffee_bag'))
        filler = []
        rows = [(.045, .035, [-.18, -.06, .06, .18]), (-.045, .018, [-.18, -.06, .06, .18]), (-.135, 0, [-.12, 0, .12])]
        for y, lift, xs in rows:  # once bolsas de pie, abiertas en abanico como en la foto / eleven standing bags fanning out
            for x in xs:
                o = instance(src, 'Coffee bag %02d' % (len(bags) + 1))
                o.location = (x + rnd.uniform(-.006, .006), y + rnd.uniform(-.005, .005), top + lift + rnd.uniform(-.01, .01))
                o.rotation_euler = (math.radians(-y / .135 * 7 + rnd.uniform(-2, 2)), math.radians(x / .18 * 7 + rnd.uniform(-2, 2)), math.radians(rnd.uniform(-14, 14))); bags.append(o)
        bpy.data.objects.remove(src, do_unlink=True)
        for o in bags: tag(o, number, spec['id'], 'coffee_bag', o.name.lower().replace(' ', '-'))
        model += bags; counts = {'visual_bag_count': len(bags), 'product': 'Starbucks 1971 Dark Roast 250 g whole bean'}
    out = root / 'inventario/assets/catalog' / str(number); out.mkdir(parents=True, exist_ok=True)
    # Origen en la esquina de la huella, como el resto de piezas del Starbucks (X=columna, Z=fila en glTF).
    # Footprint-corner origin like the other placed Starbucks pieces: glTF x = col, z = row.
    corner = Vector((FOOTPRINT / 2, -FOOTPRINT / 2, 0))
    for o in model:
        if o.parent is None: o.location += corner
    bpy.ops.object.select_all(action='DESELECT')
    for o in model: o.select_set(True)
    bpy.ops.wm.save_as_mainfile(filepath=str(out / (tier + '.blend')))
    bpy.ops.export_scene.gltf(filepath=str(out / (tier + '.glb')), export_format='GLB', use_selection=True, export_extras=True, export_apply=True)
    for o in model:
        if o.parent is None: o.location -= corner
    manifest = {'number': number, 'id': spec['id'], 'name': spec['name'], 'name_en': spec['name_en'], 'tier': tier,
                'reference': spec['reference'], 'geometry_basis': 'interpretive_photo', 'source_photos': 'Carlos · Starbucks Paseo de Gràcia · 2026-10-17',
                'measured': False, 'nominal_units': 'metres_for_proportions_only', 'stock_quantity_verified': False,
                'rim_height_m': s['rim_z'], 'rim_diameter_m': round(2 * s['rim_r'], 3), 'footprint_m': [FOOTPRINT, FOOTPRINT],
                'origin': 'footprint_corner', 'front': '+Z glTF (Blender -Y)', **counts,
                'mesh_count': sum(1 for o in model if o.type == 'MESH')}
    (out / (tier + '.manifest.json')).write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    if tier == 'best':
        height = max((o.matrix_world @ Vector(c)).z for o in model for c in o.bound_box)
        studio(scene, height); scene.render.engine = 'CYCLES'; scene.cycles.samples = 64; scene.cycles.use_denoising = True
        try:
            prefs = bpy.context.preferences.addons['cycles'].preferences; prefs.compute_device_type = 'METAL'; prefs.get_devices()
            for d in prefs.devices: d.use = True
            scene.cycles.device = 'GPU'
        except Exception as error: print('CPU render', error)
        scene.render.resolution_x = 1000; scene.render.resolution_y = 1300; scene.view_settings.view_transform = 'Standard'; scene.view_settings.exposure = -.25
        scene.world = bpy.data.worlds.new('Studio neutral world'); scene.world.color = (.25, .25, .25)
        scene.render.image_settings.file_format = 'PNG'; scene.render.filepath = str(out / 'preview.png'); bpy.ops.render.render(write_still=True)
    print(number, tier, 'exported', manifest['mesh_count'], 'meshes')
    return poses

for number in sorted(SPECS):
    if only and number not in only: continue
    poses = None
    for tier in ('best', 'better', 'good'): poses = build(number, tier, poses)
print('Cestas PG103: GLB, maestros .blend, manifiestos y render de revisión')

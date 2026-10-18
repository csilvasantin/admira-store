"""Taller 3D · de una receta a piezas del catálogo / 3D workshop · from a recipe to catalogue pieces.

Una receta (recetas/*.json) describe un encargo: las fotos de una visita, sus texturas y las piezas que salen.
Cada pieza combina familias: un mueble (cesta trenzada), carteles y un contenido (vasos, bolsas, botellas…)
con su colocación (caída con física, filas, anillos). Este guion construye cada pieza en Good, Better y Best
(y Hiperreal si la receta lo pide), con GLB, maestro .blend, manifiesto y render de revisión.
A recipe describes one job: the photos of a visit, their textures and the pieces they produce. Each piece combines
families (a fixture, signs and contents) and a placement (physics drop, rows, rings).

Blender --background --factory-startup --python-exit-code 1 --python taller.py -- RECETA [--piezas 53,54] [--salida CARPETA] [--texturas CARPETA]
Metros nominales para proporciones; no es una medición de la tienda. / Nominal metres, not a store survey.
"""
import bpy, math, json, pathlib, sys, random
from mathutils import Vector, Euler

ARGS = sys.argv[sys.argv.index('--') + 1:]
RECETA_PATH = pathlib.Path(ARGS[0]).resolve(); RECETA = json.loads(RECETA_PATH.read_text())
def _arg(name, default=None): return ARGS[ARGS.index(name) + 1] if name in ARGS else default
REPO = RECETA_PATH
while not (REPO / '.git').exists() and REPO.parent != REPO: REPO = REPO.parent
TEX = pathlib.Path(_arg('--texturas')).resolve() if _arg('--texturas') else REPO / RECETA['texturas_dir']; HIPER_TEX = REPO / 'inventario/assets/hiperreal-tex'
SALIDA = pathlib.Path(_arg('--salida')).resolve() if _arg('--salida') else REPO / 'inventario/assets/catalog'
SOLO = {int(n) for n in _arg('--piezas', '').split(',') if n}
TIERS = {'best': dict(seg=64, rod=12), 'better': dict(seg=32, rod=8), 'good': dict(seg=16, rod=6), 'hiperreal': dict(seg=64, rod=12)}

# ── utilidades de Blender / Blender helpers ───────────────────────────────────────────────────────────────
def linear(c): return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4

def material(name, color, rough=.5, metal=0, transmission=0, image=None, normal=None, orm=None, clip=False, normal_strength=1, coat=0, folder=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes.get('Principled BSDF')
    rgba = tuple(linear(c) for c in color) + (1,); m.diffuse_color = rgba; b.inputs['Base Color'].default_value = rgba
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    b.inputs['Transmission Weight'].default_value = transmission; b.inputs['IOR'].default_value = 1.46
    if coat: b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = .12
    def img(file, colorspace='sRGB'):
        path = (folder or TEX) / file if not str(file).startswith('hiperreal:') else HIPER_TEX / file.split(':', 1)[1]
        im = bpy.data.images.load(str(path), check_existing=True); im.colorspace_settings.name = colorspace; im.pack()
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

def lathe(name, profile, seg, mat, u_repeat=1, cap_bottom=False, cap_top=False, squared_below=None):
    """Superficie de revolución; la cara impresa mira a -Y en u=.5. Con `squared_below`, la sección se cuadra
    por debajo de esa altura (cuerpo de botella). / Revolved surface; print faces -Y at u=.5; optional squarish base."""
    verts = []; z0 = profile[0][0]; z1 = profile[-1][0] if profile[-1][0] != profile[0][0] else profile[0][0] + 1
    for z, r in profile:
        for j in range(seg):
            a = math.tau * j / seg; s, c = math.sin(a), math.cos(a)
            e = .88 if squared_below is not None and z < squared_below else 1
            verts.append((r * math.copysign(abs(s) ** e, s), -r * math.copysign(abs(c) ** e, c), z))
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
    return mesh_obj(name, verts, faces, [((0, 0), (1, 0), (1, 1), (0, 1))] * 6, mats, face_mats)

def join(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); o = bpy.context.object; o.name = name; o.data.name = name; return o

def instance(src, name):
    o = src.copy(); o.data = src.data; o.name = name; bpy.context.collection.objects.link(o); return o

def select_only(o):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o

# ── la pieza en construcción / the piece being built ─────────────────────────────────────────────────────
class Pieza:
    def __init__(self, spec, tier):
        self.spec = spec; self.tier = tier; self.t = TIERS[tier]; self.n = spec['numero']; self.id = spec['id']
        m = spec['mueble']; self.s = dict(rim_z=m['borde'][0], rim_r=m['borde'][1], base_z=m['fondo'][0], base_r=m['fondo'][1])
        self.rich = tier != 'good'; self.model = []; self.counts = {}; self.mats = {}; self.colliders = []

    def tag(self, obj, part, item=None, fuente=None):
        obj['inventoryNumber'] = self.n; obj['inventoryId'] = self.id; obj['inventory_asset'] = self.id
        obj['part'] = part; obj['geometry_basis'] = 'interpretive_nominal_metres_not_field_measurements'
        obj['texture_source'] = fuente or 'procedural'
        if item: obj['item_instance'] = item; obj['stock_quantity_verified'] = False
        if obj.type == 'MESH':
            for poly in obj.data.polygons: poly.use_smooth = True
        return obj

    def wall_radius(self, z):
        """Cono algo abombado, ancho arriba y estrecho abajo. / Slightly bellied cone."""
        s = self.s; q = min(1, max(0, (z - s['base_z']) / (s['rim_z'] - s['base_z'])))
        return s['base_r'] + (s['rim_r'] - s['base_r']) * (.35 * q + .65 * math.sin(q * math.pi / 2))

    def wall_profile(self, steps=12):
        s = self.s; return [(z, self.wall_radius(z)) for z in (s['base_z'] + i / steps * (s['rim_z'] - s['base_z']) for i in range(steps + 1))]

    # ── familia: cesta trenzada sobre soporte con cruceta / family: woven basket on an X-braced stand ──────
    def cesta_trenzada(self):
        s, t, rich, hiper = self.s, self.t, self.rich, self.tier == 'hiperreal'
        self.mats.update(
            weave=material('Black PVC woven cord · open weave', (.05, .05, .05), .5, image='tejido-basecolor.png', clip=True,
                           normal='tejido-normal.png' if rich else None, orm='tejido-orm.png' if rich else None, normal_strength=.9, coat=.25 if hiper else 0),
            bottom=material('Black PVC woven cord · basket floor', (.035, .035, .035), .55, normal='tejido-normal.png' if rich else None),
            rope=material('Black twisted rope rim', (.06, .06, .06), .5, image='cuerda-basecolor.jpg', normal='cuerda-normal.png' if rich else None, coat=.25 if hiper else 0),
            steel=material('Black powder-coated steel stand', (.03, .032, .034), .38, .55,
                           orm='hiperreal:powder_orm_1024.jpg' if hiper else 'acero-orm.png' if rich else None,
                           normal='hiperreal:powder_normal_1024.jpg' if hiper else None, normal_strength=.3))
        parts = []; mats = self.mats
        self.wall = lathe('Basket woven cord wall', self.wall_profile(), t['seg'] * 2, mats['weave'], u_repeat=self.spec['mueble'].get('repeticion', 4)); parts.append(self.wall)
        self.bottom = lathe('Basket woven bottom', [(s['base_z'], 0.0001), (s['base_z'], s['base_r'])], t['seg'] * 2, mats['bottom']); parts.append(self.bottom)
        parts.append(torus('Basket rolled rope rim', s['rim_r'] + .004, .017, s['rim_z'], mats['rope'], t['seg'] * 2))
        parts.append(torus('Basket lower rope ring', s['base_r'] + .002, .009, s['base_z'] + .004, mats['rope'], t['seg'] * 2))
        ring_r = s['base_r'] * .82; ring_z = s['base_z'] - .012; foot_r = s['rim_r'] * self.spec['mueble'].get('pie', .86)
        parts.append(torus('Stand top ring', ring_r, .0055, ring_z, mats['steel'], t['seg']))
        feet = []
        for k in range(4):
            a = math.pi / 4 + k * math.pi / 2; top = (ring_r * math.cos(a), ring_r * math.sin(a), ring_z); foot = (foot_r * math.cos(a), foot_r * math.sin(a), .012)
            feet.append(foot); parts.append(rod('Stand leg %d' % k, top, foot, .0062, mats['steel'], t['rod']))
            bpy.ops.mesh.primitive_cylinder_add(vertices=t['rod'], radius=.009, depth=.012, location=(foot[0], foot[1], .006))
            f = bpy.context.object; f.name = 'Stand foot %d' % k; f.data.materials.append(mats['steel']); parts.append(f)
        # Cruceta en X a ras de suelo entre pies opuestos. / X cross brace between opposite feet at floor level.
        parts.append(rod('Stand floor cross A', feet[0], feet[2], .0055, mats['steel'], t['rod']))
        parts.append(rod('Stand floor cross B', (feet[1][0], feet[1][1], .02), (feet[3][0], feet[3][1], .02), .0055, mats['steel'], t['rod']))
        for o in parts: self.tag(o, 'basket' if 'Stand' not in o.name else 'stand')
        self.model += parts

    # ── familia: cartel (placa con cara impresa, de pie o en poste) / family: sign board ────────────────────
    def cartel(self, c):
        s = self.s; fuente = c.get('fuente_textura')
        face = material(c['material'], (1, 1, 1), c.get('rugosidad', .55), image=c['textura'])
        edge = material(c['material_canto'], tuple(c['canto']), c.get('rugosidad_canto', .6),
                        orm='hiperreal:powder_orm_1024.jpg' if self.tier == 'hiperreal' and c.get('canto_polvo') else None)
        z = c['z'] if 'z' in c else s['base_z'] + c['sobre_fondo']
        if c.get('poste'):
            p = c['poste']; pole = rod('Sign pole', (p['x'], p['y'], s['base_z']), (p['x'], p['y'], p['alto']), .004, self.mats['steel'], self.t['rod'])
            self.model.append(self.tag(pole, 'sign'))
        o = box(c['nombre'], c['ancho'], c.get('grueso', .006), c['alto'], (face, edge), (0, 1, 1, 1, 1, 1))
        o.location = (c['pos'][0], c['pos'][1], z); o.rotation_euler = (-math.radians(c.get('inclinacion', 0)), 0, 0)
        self.model.append(self.tag(o, 'sign', fuente=fuente)); self.colliders.append(o)

    # ── física / physics ─────────────────────────────────────────────────────────────────────────────────
    def collider(self, guard=4):
        """Cuenco macizo e invisible solo para la física. / Solid invisible bowl, physics only."""
        s = self.s; prof = [(s['base_z'], .0001)] + self.wall_profile()
        prof += [(s['rim_z'] + .1, s['rim_r'] + .02), (s['rim_z'] + guard, s['rim_r'] + .02)]  # tubo de guarda / guard tube
        o = lathe('Physics bowl', prof, 48, bpy.data.materials.new('physics'))
        m = o.modifiers.new('Thick', 'SOLIDIFY'); m.thickness = .04; m.offset = 1
        select_only(o); bpy.ops.object.modifier_apply(modifier='Thick'); return o

    def simulate(self, dynamic, colliders, frames=260, guard=4):
        """Deja caer los objetos con Bullet y devuelve sus matrices finales. / Drop with Bullet; return final matrices."""
        scene = bpy.context.scene; bowl = self.collider(guard); colliders = [bowl] + list(colliders)
        bpy.ops.rigidbody.world_add(); world = scene.rigidbody_world
        world.substeps_per_frame = 20; world.solver_iterations = 30
        world.point_cache.frame_start = 1; world.point_cache.frame_end = frames; scene.frame_start = 1; scene.frame_end = frames
        def add(o, kind, shape, mass=.06, friction=.7):
            select_only(o); bpy.ops.rigidbody.object_add(type=kind); rb = o.rigid_body; rb.collision_shape = shape
            rb.use_margin = True; rb.collision_margin = .0015; rb.friction = friction; rb.restitution = .05
            rb.linear_damping = .25; rb.angular_damping = .35
            if kind == 'ACTIVE': rb.mass = mass
        for o in colliders: add(o, 'PASSIVE', 'MESH' if o is bowl else 'CONVEX_HULL')
        for o in dynamic: add(o, 'ACTIVE', 'CONVEX_HULL')
        for f in range(1, frames + 1): scene.frame_set(f)
        result = {o.name: o.matrix_world.copy() for o in dynamic}
        bpy.ops.object.select_all(action='SELECT'); bpy.ops.rigidbody.objects_remove(); bpy.ops.rigidbody.world_remove()
        scene.frame_set(1); bpy.data.objects.remove(bowl, do_unlink=True)
        s = self.s; lost = [n for n, m in result.items() if m.translation.z < s['base_z'] - .02 or m.translation.z > s['rim_z'] + .3
                            or Vector((m.translation.x, m.translation.y)).length > s['rim_r'] + .02]
        print('physics', self.n, len(result), 'dropped,', len(lost), 'outside', [(n, tuple(round(c, 2) for c in result[n].translation)) for n in lost])
        if lost: raise SystemExit('objects outside the basket: %s' % lost)
        return result

    def simulate_batches(self, dynamic, colliders, batch, place):
        """Echa los objetos por tandas desde poca altura; lo ya caído hace de apoyo. / Drop in small batches onto the pile."""
        poses = {}; settled = []
        for start in range(0, len(dynamic), batch):
            group = dynamic[start:start + batch]
            for o in settled: o.matrix_world = poses[o.name]
            bpy.context.view_layer.update()
            top = max([(o.matrix_world @ Vector(c)).z for o in settled for c in o.bound_box], default=self.s['base_z'])
            for k, o in enumerate(group): place(o, k, top)
            poses.update(self.simulate(group, list(colliders) + settled, frames=150, guard=max(.3, top + .55 - self.s['rim_z'])))
            settled += group
        return poses

    # ── familias de contenido / content families ──────────────────────────────────────────────────────────
    def vasos(self, c, poses):
        """Vasos reutilizables (caliente y frío con cúpula) que caen por tandas. / Reusable cups dropped in batches."""
        s = self.s; seg = max(16, self.t['seg'] // 2); m = c['materiales']
        cup_hot = material(m['caliente'][0], (.93, .93, .9), .42, image=m['caliente'][1])
        lid_mat = material('White polypropylene lid', (.93, .93, .9), .4)
        cup_cold = material(m['frio'][0], (.94, .95, .94), .5, transmission=.18, image=m['frio'][1])
        dome_mat = material('Clear PET dome lid', (.97, .98, .98), .12, transmission=.75)
        hot = lathe('Hot cup body', [(0, .0285), (.003, .031), (.150, .0445), (.153, .0452)], seg, cup_hot, cap_bottom=True)
        lid = lathe('Hot cup lid', [(.150, .0462), (.161, .0468), (.164, .0455), (.170, .041), (.172, .030), (.1725, .001)], seg, lid_mat, cap_top=True)
        hot = join([hot, lid], 'Reusable hot cup')
        cold = lathe('Cold cup body', [(0, .029), (.004, .031), (.180, .0475), (.183, .048)], seg, cup_cold, cap_bottom=True)
        dome = [(.183 + .034 * math.sin(math.radians(a)), .049 * math.cos(math.radians(a))) for a in range(0, 81, 10)] + [(.2175, .006)]
        cold = join([cold, lathe('Cold cup dome lid', dome, seg, dome_mat)], 'Reusable cold cup with dome lid')
        for o in (hot, cold):  # centro de masas en el centro del vaso, no en su base / mass centre mid-cup
            select_only(o); bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS'); o.location = (0, 0, -8)
        rnd = random.Random(c['semilla']); n = c['cantidad']
        cups = [instance(hot if i % 2 == 0 else cold, '%s %02d' % ('Hot cup' if i % 2 == 0 else 'Cold cup', i + 1)) for i in range(n)]
        def place(o, k, top):  # dos vasos tumbados por capa, de lado / two side-by-side lying cups per layer
            layer, side = divmod(k, 2); yaw = rnd.uniform(0, math.tau)
            rot = Euler((math.pi / 2 + rnd.uniform(-.25, .25), rnd.uniform(0, math.tau), yaw))
            side_off = Euler((0, 0, yaw)).to_matrix() @ Vector((.066 * (1 if side else -1), 0, 0))
            o.location = Vector((rnd.uniform(-.06, .06), -.07 + rnd.uniform(-.05, .05), max(top, s['base_z']) + .08 + layer * .16)) + side_off
            o.rotation_euler = rot
        if poses is None: poses = self.simulate_batches(cups, self.colliders, c.get('tanda', 4), place)
        for o in cups: o.matrix_world = poses[o.name]; self.tag(o, 'cup', o.name.lower().replace(' ', '-'), c.get('fuente_textura'))
        bpy.data.objects.remove(hot, do_unlink=True); bpy.data.objects.remove(cold, do_unlink=True)
        self.model += cups; self.counts = {'visual_cup_count': n, 'hot_cups': (n + 1) // 2, 'cold_cups': n // 2}
        return poses

    def pillow(self, name, mat, w=.17, h=.25, bulge=.032, nx=10, ny=14):
        """Bolsa almohada: frente y dorso abombados que comparten el borde. / Pillow bag sharing its perimeter."""
        verts = []; idx = {}
        def f(u, v):
            crimp = 0 if v < .07 or v > .93 else 1
            return bulge * crimp * (math.sin(math.pi * u) ** .6) * (math.sin(math.pi * min(1, max(0, (v - .07) / .86))) ** .5)
        for side in (-1, 1):
            for j in range(ny + 1):
                for i in range(nx + 1):
                    u, v = i / nx, j / ny
                    if side == 1 and (i in (0, nx) or j in (0, ny)): idx[(1, i, j)] = idx[(-1, i, j)]; continue
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

    def bolsas_almohada(self, c, poses):
        """Bolsas almohada que caen en capas de dos. / Pillow bags dropped in layers of two."""
        s = self.s
        designs = [material('Snack bag · interpreted %s' % k, (1, 1, 1), .32, .15, image=img) for k, img in zip('abcdefgh', c['disenos'])]
        sources = [self.pillow('Snack bag source %s' % k, mm) for k, mm in zip('abcdefgh', designs)]
        rnd = random.Random(c['semilla']); bags = []
        for i in range(c['cantidad']):  # capas de dos bolsas casi planas / layers of two nearly flat bags
            o = instance(sources[i % len(sources)], 'Snack bag %02d' % (i + 1)); layer, side = divmod(i, 2); yaw = (layer % 2) * math.pi / 2
            off = Euler((0, 0, yaw)).to_matrix() @ Vector((.15 * (1 if side else -1), 0, 0))
            o.location = (off.x + rnd.uniform(-.01, .01), off.y - .03 + rnd.uniform(-.01, .01), s['base_z'] + .1 + layer * .17)
            o.rotation_euler = (math.pi / 2 + rnd.uniform(-.35, .35), rnd.uniform(-.35, .35), yaw + math.pi / 2); bags.append(o)
        if poses is None: poses = self.simulate(bags, [o for o in self.model if o.name == 'Sign pole'])
        for o in bags: o.matrix_world = poses[o.name]; self.tag(o, 'snack_bag', o.name.lower().replace(' ', '-'))
        for o in sources: bpy.data.objects.remove(o, do_unlink=True)
        self.model += bags; self.counts = {'visual_bag_count': len(bags), 'snack_brands_confirmed': False}
        return poses

    def bolsas_de_pie(self, c, poses):
        """Bolsas de café de pie en filas, abiertas en abanico, sobre un relleno oculto. / Standing coffee bags in rows."""
        s = self.s; green = tuple(c['color_liso']); caras = c['caras']
        fm = lambda k, label: material('1971 Dark Roast bag · %s' % label, (1, 1, 1), .34, .12, image=caras[k])
        plain = material('1971 Dark Roast bag · plain foil', green, .34, .12)
        mats = (fm('frente', 'front photo'), fm('dorso', 'back photo'), fm('lado_a', 'brewing side photo'), fm('lado_b', 'story side photo'), plain)
        w, d, h = c['medidas']
        bag = box('1971 Dark Roast bag', w, d, h, mats)
        fin = box('Bag folded top seal', w - .011, .004, .02, (plain,), (0, 0, 0, 0, 0, 0)); fin.location = (0, 0, h - .002)
        select_only(fin); bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
        src = join([bag, fin], c['nombre_producto']); mod = src.modifiers.new('Soft folds', 'BEVEL'); mod.width = .003; mod.segments = 2; src.location = (0, 0, -8)
        rnd = random.Random(c['semilla']); bags = []; top = s['rim_z'] - c['bajo_borde']
        fill = lathe('Hidden stock under the visible bags', [(top - .004, .0001), (top - .004, self.wall_radius(top - .004) - .008)], self.t['seg'], plain)
        self.model.append(self.tag(fill, 'coffee_bag'))
        for y, lift, xs in c['filas']:
            for x in xs:
                o = instance(src, 'Coffee bag %02d' % (len(bags) + 1))
                o.location = (x + rnd.uniform(-.006, .006), y + rnd.uniform(-.005, .005), top + lift + rnd.uniform(-.01, .01))
                o.rotation_euler = (math.radians(-y / .135 * 7 + rnd.uniform(-2, 2)), math.radians(x / .18 * 7 + rnd.uniform(-2, 2)), math.radians(rnd.uniform(-14, 14))); bags.append(o)
        bpy.data.objects.remove(src, do_unlink=True)
        for o in bags: self.tag(o, 'coffee_bag', o.name.lower().replace(' ', '-'), c.get('fuente_textura'))
        self.model += bags; self.counts = {'visual_bag_count': len(bags), 'product': c['producto']}
        return poses

    def botellas(self, c, poses):
        """Botellas de PET de pie en anillos, cada una con su identidad editable. / Standing PET bottles in rings."""
        t, hiper = self.t, self.tier == 'hiperreal'; m = c['materiales']
        pet = material(m['pet'][0], tuple(m['pet'][2]), .18, 0, .22, image=m['pet'][1], orm=m['pet_orm'], coat=.38)
        cap = material('White ribbed polypropylene cap', (.91, .91, .865), .32, orm='hiperreal:plastic_orm.jpg' if hiper else None)
        seal = material('White tamper band', (.88, .88, .84), .30)
        collar = material(m['collar'][0], (.93, .93, .90), .36, image=m['collar'][1])
        k = c.get('escala_alto', .8); kr = c.get('escala_radio', 1.091)
        profile = [(z * k, r * kr) for z, r in c['perfil']]
        parts = []
        def part(o, kind):
            self.tag(o, kind); o['bottle_instance'] = 'bottle-01'; o['stock_quantity_verified'] = False; parts.append(o); return o
        body = part(lathe('PET blue bottle body', profile, t['seg'], pet, cap_bottom=True, cap_top=True, squared_below=.142), 'bottle_body')
        if self.tier in ('best', 'hiperreal'):
            mod = body.modifiers.new('PET thin wall', 'SOLIDIFY'); mod.thickness = .001; mod.offset = -1
        part(lathe('White tamper seal', [(.222 * k, .0168), (.224 * k, .0175), (.229 * k, .0175), (.230 * k, .0168)], t['seg'], seal), 'bottle_tamper_band')
        part(lathe('Printed white neck band', [(.203 * k, .019), (.213 * k, .0168), (.223 * k, .0168)], t['seg'], collar), 'bottle_printed_collar')
        cap_mesh = part(lathe('White screw cap', [(.229 * k, .0175), (.231 * k, .0185), (.241 * k, .0185), (.245 * k, .018), (.246 * k, .0165)], t['seg'], cap), 'bottle_cap')
        if self.tier != 'good':
            for j in range(36):
                a = math.tau * j / 36; r = .0186
                part(rod('Cap grip rib %02d' % j, (r * math.cos(a), r * math.sin(a), .232 * k), (r * math.cos(a), r * math.sin(a), .241 * k), .00042, cap, 6), 'bottle_cap_rib')
        if self.tier == 'best' and c.get('producto_suelto'):  # botella suelta: producto reutilizable fuera del CI / standalone product
            out = self.out_dir(); bpy.ops.object.select_all(action='DESELECT')
            for p in parts: p.select_set(True)
            bpy.ops.export_scene.gltf(filepath=str(out / 'bottle.glb'), export_format='GLB', use_selection=True, export_extras=True, export_apply=True)
            others = [o for o in bpy.context.scene.objects if o not in parts]; scene = bpy.context.scene
            for o in others: scene.collection.objects.unlink(o)
            scene.name = c['producto_suelto']; bpy.ops.wm.save_as_mainfile(filepath=str(out / 'bottle.blend'))
            for o in others: scene.collection.objects.link(o)
            scene.name = 'Scene'
        positions = []
        for count, radius, offset in c['anillos']:
            positions += [(radius * math.cos(math.tau * j / count + offset), radius * math.sin(math.tau * j / count + offset)) for j in range(count)]
        z0 = self.s['base_z'] + c.get('sobre_fondo', .003)
        for i, (x, y) in enumerate(positions):  # cada botella con nombre e identidad propios / each bottle named and editable
            group = bpy.data.objects.new('%s %02d' % (c['nombre_botella'], i + 1), None); bpy.context.collection.objects.link(group)
            group['bottle_instance'] = 'bottle-%02d' % (i + 1); group['stock_quantity_verified'] = False
            for source in parts:
                o = source.copy(); o.data = source.data; bpy.context.collection.objects.link(o); o.name = 'Bottle %02d · %s' % (i + 1, source.name)
                o.parent = group; o['bottle_instance'] = 'bottle-%02d' % (i + 1)
            group.location = (x, y, z0); group.rotation_euler.z = ((i * 17) % 37 - 18) * math.pi / 180
            self.model.append(group); self.model += list(group.children)
        for source in parts: bpy.data.objects.remove(source, do_unlink=True)
        self.counts = {'visual_bottle_count': len(positions), 'bottles_individually_editable': True, 'reference_visible_caps': c.get('tapones_visibles')}
        return poses

    def out_dir(self):
        out = SALIDA / ('%02d' % self.n if self.n < 10 else str(self.n)); out.mkdir(parents=True, exist_ok=True); return out

# ── estudio de revisión / review studio ──────────────────────────────────────────────────────────────────
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
    cam = target + Vector((.48, -.80, .42)).normalized() * height * 1.9
    bpy.ops.object.camera_add(location=cam); o = bpy.context.object; o.name = 'Studio camera'
    o.rotation_euler = (target - o.location).to_track_quat('-Z', 'Y').to_euler(); o.data.lens = 50; scene.camera = o; move(o)

def render_preview(scene, model, path):
    height = max((o.matrix_world @ Vector(c)).z for o in model if o.type == 'MESH' for c in o.bound_box)
    studio(scene, height); scene.render.engine = 'CYCLES'; scene.cycles.samples = 64; scene.cycles.use_denoising = True
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences; prefs.compute_device_type = 'METAL'; prefs.get_devices()
        for d in prefs.devices: d.use = True
        scene.cycles.device = 'GPU'
    except Exception as error: print('CPU render', error)
    scene.render.resolution_x = 1000; scene.render.resolution_y = 1300; scene.view_settings.view_transform = 'Standard'; scene.view_settings.exposure = -.25
    scene.world = bpy.data.worlds.new('Studio neutral world'); scene.world.color = (.25, .25, .25)
    scene.render.image_settings.file_format = 'PNG'; scene.render.filepath = str(path); bpy.ops.render.render(write_still=True)

# ── construir una pieza en un perfil / build one piece in one tier ─────────────────────────────────────────
def build(spec, tier, poses):
    bpy.ops.wm.read_factory_settings(use_empty=True); scene = bpy.context.scene; scene.unit_settings.system = 'METRIC'
    bpy.context.preferences.filepaths.save_version = 0  # sin copias .blend1 al reescribir / no .blend1 backups
    p = Pieza(spec, tier); getattr(p, spec['mueble']['familia'])()
    for c in spec.get('carteles', []): p.cartel(c)
    contenido = spec.get('contenido')
    if contenido: poses = getattr(p, contenido['familia'])(contenido, poses)
    out = p.out_dir(); corner = Vector((spec['huella'] / 2, -spec['huella'] / 2, 0)) if spec['origen'] == 'esquina' else Vector()
    # Origen en la esquina de la huella (piezas colocadas del Starbucks) o en el centro (glTF x = columna, z = fila).
    for o in p.model:
        if o.parent is None: o.location += corner
    bpy.ops.object.select_all(action='DESELECT')
    for o in p.model: o.select_set(True)
    name = 'hiperreal' if tier == 'hiperreal' else tier
    bpy.ops.wm.save_as_mainfile(filepath=str(out / (name + '.blend')))
    if tier == 'hiperreal':  # HD con texturas originales y web en WebP / HD with source maps, web LOD in WebP
        (out / 'hiperreal').mkdir(exist_ok=True)
        bpy.ops.export_scene.gltf(filepath=str(out / 'hiperreal/hiperreal-hd.glb'), export_format='GLB', use_selection=True, export_extras=True, export_apply=True)
        bpy.ops.export_scene.gltf(filepath=str(out / 'hiperreal.glb'), export_format='GLB', use_selection=True, export_extras=True, export_apply=True,
                                  export_image_format='WEBP', export_image_quality=84)
    else:
        bpy.ops.export_scene.gltf(filepath=str(out / (tier + '.glb')), export_format='GLB', use_selection=True, export_extras=True, export_apply=True)
    for o in p.model:
        if o.parent is None: o.location -= corner
    s = p.s; fotos = RECETA['fotos']
    manifest = {'number': p.n, 'id': p.id, 'name': spec['nombre'], 'name_en': spec['nombre_en'], 'tier': name,
                'reference': spec.get('referencia'), 'geometry_basis': spec.get('base_geometria', 'interpretive_photo'),
                'source_photos': '%s · %s · %s' % (fotos['autor'], fotos['lugar'], fotos['fecha']), 'workshop_recipe': RECETA_PATH.relative_to(REPO).as_posix(),
                'measured': False, 'nominal_units': 'metres_for_proportions_only', 'stock_quantity_verified': False,
                'rim_height_m': s['rim_z'], 'rim_diameter_m': round(2 * s['rim_r'], 3), 'footprint_m': [spec['huella'], spec['huella']],
                'origin': 'footprint_corner' if spec['origen'] == 'esquina' else 'centre', 'front': '+Z glTF (Blender -Y)', **p.counts,
                'mesh_count': sum(1 for o in p.model if o.type == 'MESH')}
    if tier == 'hiperreal':
        manifest.update({'based_on': 'best', 'batch': spec['hiperreal']['tanda'], 'textures': spec['hiperreal']['texturas'],
                         'shared_textures': '../../hiperreal-tex/', 'lods': {'web': './hiperreal.glb', 'hd': './hiperreal/hiperreal-hd.glb', 'blender': './hiperreal.blend'},
                         'bytes': {'web': (out / 'hiperreal.glb').stat().st_size, 'hd': (out / 'hiperreal/hiperreal-hd.glb').stat().st_size}})
    (out / (name + '.manifest.json')).write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    if tier == 'best': render_preview(scene, p.model, out / 'preview.png')
    print(p.n, name, 'exported', manifest['mesh_count'], 'meshes')
    return poses

for spec in RECETA['piezas']:
    if not isinstance(spec.get('numero'), int): raise SystemExit(f"«{spec.get('nombre')}» no tiene número de catálogo: asígnalo en la receta antes de construir.")
    if SOLO and spec['numero'] not in SOLO: continue
    poses = None
    for tier in ('best', 'better', 'good') + (('hiperreal',) if spec.get('hiperreal') else ()):
        poses = build(spec, tier, poses)
print('Taller 3D:', RECETA['encargo'], 'listo')

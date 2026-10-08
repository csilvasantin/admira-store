"""Procedural, individually editable retail products for the ITIL coffee display.

Blender 5.x; metres, Z up, the label faces local -Y.  Each product is an
Empty with independently named child meshes.  No photographed texture is used.
"""

import bpy
import math
import random
from mathutils import Vector
from pbr_matrix import enhance_product_material


PRODUCT_TYPES = [
    dict(kind="cold_cup", variant="emerald", label="Vaso frío esmeralda con pajita", category="Vasos"),
    dict(kind="cold_cup", variant="clear", label="Vaso transparente con pajita", category="Vasos"),
    dict(kind="cold_cup", variant="confetti", label="Vaso salpicado blanco y negro", category="Vasos"),
    dict(kind="cold_cup", variant="checker", label="Vaso damero verde y crema", category="Vasos"),
    dict(kind="cold_cup", variant="wave", label="Vaso ondas verdes", category="Vasos"),
    dict(kind="cold_cup", variant="crimson", label="Vaso transparente tapa roja", category="Vasos"),
    dict(kind="thermos", variant="emerald", label="Termo metálico esmeralda", category="Termos"),
    dict(kind="thermos", variant="ribbed", label="Termo acanalado verde", category="Termos"),
    dict(kind="thermos", variant="gold_rim", label="Termo verde borde dorado", category="Termos"),
    dict(kind="thermos", variant="blackgreen", label="Termo negro banda verde", category="Termos"),
    dict(kind="mug", variant="pumpkin", label="Taza cerámica naranja ancha", category="Tazas"),
    dict(kind="mug", variant="white_green", label="Taza blanca interior verde", category="Tazas"),
    dict(kind="mug", variant="scale_green", label="Taza verde relieve escamas", category="Tazas"),
    dict(kind="mug", variant="black", label="Taza cerámica negra", category="Tazas"),
    dict(kind="mug", variant="city_box", label="Taza colección ciudad en caja", category="Tazas en caja"),
    dict(kind="travel_mug", variant="band_green", label="Vaso térmico negro banda verde", category="Vasos térmicos"),
    dict(kind="travel_mug", variant="lid_green", label="Vaso térmico negro tapa verde", category="Vasos térmicos"),
    dict(kind="coffee", variant="kati", label="Café Kati Kati Blend", category="Café en bolsa"),
    dict(kind="coffee", variant="pike", label="Café Pike Place Roast", category="Café en bolsa"),
    dict(kind="coffee", variant="guatemala", label="Café Guatemala Antigua", category="Café en bolsa"),
    dict(kind="coffee", variant="ethiopia", label="Café Ethiopia", category="Café en bolsa"),
    dict(kind="coffee", variant="verona", label="Café Caffè Verona", category="Café en bolsa"),
    dict(kind="coffee", variant="iced", label="Café Iced Coffee Blend", category="Café en bolsa"),
    dict(kind="coffee_box", variant="red", label="Café monodosis Espresso Roast", category="Café en caja"),
    dict(kind="coffee_box", variant="yellow", label="Café monodosis Blonde Roast", category="Café en caja"),
    dict(kind="coffee_box", variant="black", label="Café monodosis Dark Roast", category="Café en caja"),
]

_MATERIALS = {}
_IMAGES = {}
_GREEN = (0.016, 0.19, 0.105, 1)
_EMERALD = (0.008, 0.115, 0.085, 1)
_CREAM = (0.92, 0.87, 0.70, 1)
_WHITE = (0.93, 0.92, 0.86, 1)
_BLACK = (0.008, 0.012, 0.013, 1)
_GOLD = (0.68, 0.45, 0.13, 1)
_KRAFT = (0.56, 0.35, 0.16, 1)


def material(name, color, metallic=0.0, roughness=0.36, transmission=0.0):
    key = (name, tuple(color), metallic, roughness, transmission)
    cached = _MATERIALS.get(key)
    if cached and cached.name in bpy.data.materials:
        return cached
    m = bpy.data.materials.new("ITIL_" + name)
    m.use_nodes = True
    m.diffuse_color = color
    bs = m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = color
    bs.inputs["Metallic"].default_value = metallic
    bs.inputs["Roughness"].default_value = roughness
    if "Transmission Weight" in bs.inputs:
        bs.inputs["Transmission Weight"].default_value = transmission
    if "IOR" in bs.inputs:
        bs.inputs["IOR"].default_value = 1.46
    if color[3] < 1:
        bs.inputs["Alpha"].default_value = color[3]
        if hasattr(m, "surface_render_method"):
            m.surface_render_method = "DITHERED"
    enhance_product_material(m, name, color, metallic, roughness, transmission)
    _MATERIALS[key] = m
    return m


def _attach(obj, root, mat=None):
    obj.parent = root
    if mat:
        obj.data.materials.append(mat)
    obj["part_of_sku"] = root.get("sku", "")
    return obj


def _mesh(name, verts, faces, root, mat, smooth=True):
    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(ob)
    if smooth:
        for poly in mesh.polygons:
            poly.use_smooth = True
    return _attach(ob, root, mat)


def lathe(name, profile, root, mat, segments=96, ribs=0, rib_depth=0):
    """A surface of revolution; include both inner and outer profiles for a cavity."""
    verts = []
    for r, z in profile:
        for j in range(segments):
            a = 2 * math.pi * j / segments
            rr = r + (rib_depth * (0.5 + 0.5 * math.cos(ribs * a)) if r > 0.003 and ribs else 0)
            verts.append((rr * math.cos(a), rr * math.sin(a), z))
    faces = []
    for i in range(len(profile) - 1):
        for j in range(segments):
            jj = (j + 1) % segments
            faces.append((i * segments + j, i * segments + jj,
                          (i + 1) * segments + jj, (i + 1) * segments + j))
    ob = _mesh(name, verts, faces, root, mat)
    uv = ob.data.uv_layers.new(name="UVMap")
    height = max(z for r, z in profile) - min(z for r, z in profile)
    zmin = min(z for r, z in profile)
    for poly in ob.data.polygons:
        i = poly.index // segments
        j = poly.index % segments
        u1, u2 = j / segments, (j + 1) / segments
        v1 = (profile[i][1] - zmin) / max(height, .001)
        v2 = (profile[i + 1][1] - zmin) / max(height, .001)
        for li, coord in zip(poly.loop_indices, ((u1, v1), (u2, v1), (u2, v2), (u1, v2))):
            uv.data[li].uv = coord
    return ob


def _ring(name, r, z, thickness, root, mat, height=.003, segments=48):
    return lathe(name, [(r - thickness, z), (r, z), (r, z + height),
                        (r - thickness, z + height), (r - thickness, z)], root, mat, segments)


def _cylinder(name, radius, depth, loc, root, mat, vertices=32, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation)
    ob = bpy.context.object
    ob.name = name
    for p in ob.data.polygons:
        p.use_smooth = len(p.vertices) == 4
    return _attach(ob, root, mat)


def _box(name, dimensions, loc, root, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.scale = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = ob.modifiers.new("Rounded manufactured edges", "BEVEL")
        mod.width = bevel
        mod.segments = 4
        bpy.ops.object.modifier_apply(modifier=mod.name)
        for p in ob.data.polygons:
            p.use_smooth = False
    return _attach(ob, root, mat)


def _text(name, text, pos, size, root, mat, rotation=(math.pi / 2, 0, 0), align="CENTER"):
    curve = bpy.data.curves.new(name + "_font", "FONT")
    curve.body = text
    curve.align_x = align
    curve.align_y = "CENTER"
    curve.size = size
    curve.extrude = 0.00002
    curve.resolution_u = 2
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.location = pos
    obj.rotation_euler = rotation
    deps = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(deps), depsgraph=deps)
    result = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(result)
    result.location = pos
    result.rotation_euler = rotation
    bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.curves.remove(curve)
    return _attach(result, root, mat)


def _tube(name, points, radius, root, mat, resolution=2):
    curve = bpy.data.curves.new(name + "_curve", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = resolution
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for p, xyz in zip(spline.points, points):
        p.co = (*xyz, 1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    deps = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(deps), depsgraph=deps)
    result = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(result)
    bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.curves.remove(curve)
    return _attach(result, root, mat)


def _handle(name, body_radius, height, root, mat, thick=.007, width=.029):
    """Open-centred oval ceramic handle in XZ, intersecting the cup at two ends."""
    verts, faces = [], []
    cx, cz = body_radius + width * .60, height * .51
    for i in range(64):
        a = i * 2 * math.pi / 64
        for j in range(12):
            b = j * 2 * math.pi / 12
            verts.append((cx + (width + thick * math.cos(b)) * math.cos(a),
                          thick * math.sin(b),
                          cz + (height * .31 + thick * math.cos(b)) * math.sin(a)))
    for i in range(64):
        for j in range(12):
            faces.append((i * 12 + j, i * 12 + (j + 1) % 12,
                          ((i + 1) % 64) * 12 + (j + 1) % 12, ((i + 1) % 64) * 12 + j))
    return _mesh(name, verts, faces, root, mat)


def _logo(root, name, radius, height, size=.031, color=_WHITE, green_disk=True):
    """Original procedural crowned siren mark and wordmark, all separate meshes."""
    white = material("Logo cream", color, roughness=.4)
    green = material("Logo green", _GREEN, roughness=.4)
    y = -radius - .0011
    outer_r = size / 2
    _cylinder(name + "_badge_outer", outer_r, .00055, (0, y, height), root, white, 32, (math.pi / 2, 0, 0))
    _cylinder(name + "_badge_inner", outer_r * .88, .00065, (0, y - .0004, height), root, green if green_disk else white, 32, (math.pi / 2, 0, 0))
    ink = white if green_disk else green
    y -= .0009
    _cylinder(name + "_siren_face", size * .113, .0003, (0, y, height + size * .04), root, ink, 20, (math.pi / 2, 0, 0))
    pts = [(-.15, .10), (-.19, .25), (-.08, .21), (0, .33), (.08, .21), (.19, .25), (.15, .10)]
    _mesh(name + "_siren_crown", [(x * size, y - .0003, height + z * size) for x, z in pts], [tuple(range(len(pts)))], root, ink, False)
    for side in (-1, 1):
        for n in range(2):
            points = []
            for i in range(7):
                f = i / 6
                px = side * size * (.12 + n * .085 + .05 * math.sin(f * math.pi * 2))
                points.append((px, y - .0003, height + size * (.09 - .32 * f)))
            _tube(name + "_siren_tail_%s_%s" % (side, n), points, size * .017, root, ink)
    _text(name + "_wordmark", "STARBUCKS", (0, y - .0006, height - size * .34), size * .098, root, ink)


def _pattern_image(style, size=1024):
    if style in _IMAGES and _IMAGES[style].name in bpy.data.images:
        return _IMAGES[style]
    rng = random.Random(6317)
    if style == "confetti":
        bg, fg = _WHITE, _BLACK
        spots = [(rng.random(), rng.random(), rng.uniform(.0015, .009), rng.uniform(.003, .025)) for _ in range(1250)]
        grid = {}
        for x, y, rx, ry in spots:
            x0, x1 = max(0, int((x-rx)*size)), min(size, int((x+rx)*size)+1)
            y0, y1 = max(0, int((y-ry)*size)), min(size, int((y+ry)*size)+1)
            for yy in range(y0, y1):
                for xx in range(x0, x1):
                    if ((xx/size-x)/rx)**2 + ((yy/size-y)/ry)**2 < 1:
                        grid[(xx, yy)] = 1
    pixels = []
    for j in range(size):
        v = j / size
        for i in range(size):
            u = i / size
            if style == "confetti":
                c = fg if (i, j) in grid else bg
            elif style == "checker":
                c = _CREAM if (int(u*12) + int(v*15)) % 2 else _EMERALD
            elif style == "wave":
                bend = .085 * math.sin(v * math.pi * 5) + .030 * math.sin(v * math.pi * 11)
                stripe = (u + bend) * 21 % 1
                c = _WHITE if stripe < .48 else _GREEN
            elif style == "diamond":
                k = (int((u + v*.19) * 24) + int((u - v*.19)*24)) % 2
                c = (.013,.135,.095,1) if k else (.012,.100,.073,1)
            elif style == "city":
                band = int(u * 28)
                roof = .13 + .56 * ((band * 17 + 5) % 11) / 11
                c = (.67,.17,.13,1) if v < roof else (.95,.82,.66,1)
                if v < roof and .2 < (u*28 % 1) < .40 and .23 < (v*12 % 1) < .50:
                    c = (.97,.81,.40,1)
            else:
                c = _GREEN
            pixels.extend(c)
    image = bpy.data.images.new("ITIL_procedural_" + style, width=size, height=size, alpha=True)
    image.pixels.foreach_set(pixels)
    image.pack()
    _IMAGES[style] = image
    return image


def _pattern_material(style, metallic=0, roughness=.33):
    key = ("pattern", style, metallic, roughness)
    if key in _MATERIALS and _MATERIALS[key].name in bpy.data.materials:
        return _MATERIALS[key]
    mat = material("Pattern " + style, _WHITE, metallic, roughness)
    nodes = mat.node_tree.nodes
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = _pattern_image(style)
    tex.interpolation = "Linear"
    mat.node_tree.links.new(tex.outputs["Color"], nodes.get("Principled BSDF").inputs["Base Color"])
    _MATERIALS[key] = mat
    return mat


def _straw(name, z, root, mat, xy=(.008, .003), top=.30):
    x, y = xy
    straw = lathe(name, [(.0022, z), (.0031, z), (.0031, top),
                         (.0022, top), (.0022, z)], root, mat, 20)
    straw.location.x = x
    straw.location.y = y
    return straw


def _cold_cup(root, variant, name):
    emerald = material("Emerald plastic", _EMERALD, metallic=.12, roughness=.27)
    green = material("Straw green", (.018,.30,.12,1), roughness=.27)
    black = material("Soft black lid", _BLACK, roughness=.38)
    glass = material("Transparent reusable plastic", (.78,.91,.84,1), roughness=.13, transmission=.82)
    height = .228 if variant == "crimson" else .197
    rb, rt = (.032, .039) if variant == "crimson" else (.030, .043)
    body_mat = glass if variant in ("clear", "crimson") else (_pattern_material(variant) if variant in ("confetti","checker","wave") else _pattern_material("diamond", .18))
    profile = [(0,.001),(rb-.003,.001),(rb,.005),(rb,.012),(rt,height-.008),
               (rt,height),(rt-.0028,height),(rt-.0028,height-.008),(rb-.0028,.012),(0,.012)]
    lathe(name + "_vessel", profile, root, body_mat)
    base = material("Glass base", (.66,.82,.71,1), roughness=.15, transmission=.62) if variant in ("clear","crimson") else body_mat
    _ring(name + "_base_foot", rb+.0006, .003, .002, root, base, .004)
    if variant == "crimson":
        red = material("Holiday crimson cap", (.63,.025,.045,1), roughness=.28)
        _ring(name + "_lid_edge", rt+.002, height-.001, .0035, root, red, .006)
        lathe(name + "_lid_top", [(0,height+.004),(rt-.001,height+.004),(rt-.002,height+.008),(0,height+.008)], root, red)
        city = _pattern_material("city", roughness=.5)
        lathe(name + "_city_print", [(rb+.0005,.008),(rb+.0022,.059)], root, city)
        _text(name + "_city_collection", "STARBUCKS", (0,-rt+.0001,.103), .004, root, material("Grey printing",(.18,.20,.19,1)))
        _text(name + "_city_caption", "CITY COLLECTION", (0,-rt+.0001,.092), .0023, root, material("Grey printing",(.18,.20,.19,1)))
    else:
        lid_mat = glass if variant == "clear" else (emerald if variant in ("emerald","checker") else black)
        _ring(name + "_lid_snap_rim", rt+.002, height-.001, .003, root, lid_mat, .007)
        # A real central opening continues into the straw rather than a solid cap.
        lathe(name + "_lid_disk", [(.004,height+.006),(rt,height+.006),(rt-.001,height+.009),(.004,height+.009)], root, lid_mat)
        _ring(name + "_lid_seal", rt-.0015,height+.008,.0014,root,lid_mat,.0018)
        _straw(name + "_straw", height-.029, root, green if variant in ("emerald","clear","checker","wave") else black, top=.299)
        if variant in ("emerald", "clear", "checker"):
            _logo(root,name,rb+(rt-rb)*.53,height*.55,size=.029,green_disk=variant!="emerald")
        elif variant == "wave":
            _text(name+"_wordmark","STARBUCKS",(0,-.0389,.101),.0045,root,emerald)
    root["height_m"] = .236 if variant=="crimson" else .299
    root["width_m"] = 2*(rt+.002)


def _thermos(root, variant, name):
    metal = material("Brushed emerald metal", (.009,.18,.114,1), metallic=.76, roughness=.27)
    black = material("Black thermos", (.013,.020,.019,1), metallic=.42, roughness=.27)
    gold = material("Champagne metal", _GOLD, metallic=.83, roughness=.22)
    rubber = material("Dark silicone", (.015,.029,.023,1), roughness=.58)
    h = .215
    r = .035 if variant != "ribbed" else .033
    ribs, depth, segs = (32,.0013,192) if variant=="ribbed" else (0,0,48)
    body = black if variant == "blackgreen" else metal
    lathe(name+"_body",[(0,.002),(r-.006,.002),(r-.002,.005),(r,.015),(r,h-.018),(r-.002,h-.008),(r-.004,h-.008),(r-.004,.012),(0,.012)],root,body,segs,ribs,depth)
    _ring(name+"_base_bumper",r+.0006,.003,.003,root,rubber,.005)
    _ring(name+"_neck_seal",r-.001,h-.012,.003,root,rubber,.005)
    lathe(name+"_lid",[(0,h-.009),(r+.001,h-.009),(r+.001,h+.003),(r-.002,h+.007),(0,h+.007)],root,metal if variant!="blackgreen" else black,48,24,.0004)
    _ring(name+"_lid_seam",r+.0013,h-.009,.001,root,gold if variant=="gold_rim" else rubber,.002)
    _ring(name+"_lid_top_ring",r-.003,h+.006,.002,root,gold if variant=="gold_rim" else metal,.0017)
    _cylinder(name+"_lid_push_tab",.009,.0012,(0,-.008,h+.008),root,rubber,24)
    if variant == "blackgreen":
        lathe(name+"_grip_band",[(r+.0008,.11),(r+.0008,.143)],root,material("Green silicone band",(.016,.30,.13,1),roughness=.65))
        _logo(root,name,r+.0008,.125,size=.022)
    else:
        _text(name+"_wordmark","STARBUCKS",(0,-r-.001,h*.63),.0032,root,gold if variant=="gold_rim" else material("Thermos gold printing",(.70,.59,.27,1),metallic=.2))
    root["height_m"] = h+.009
    root["width_m"] = (r+.0015)*2


def _scales(root, name, profile_radius, height, mat):
    verts, faces = [], []
    for row in range(6):
        zc = .017 + row * .011
        rr = profile_radius(zc)
        count = 16
        for col in range(count):
            a = 2*math.pi*(col+.5*(row%2))/count
            n = Vector((math.cos(a),math.sin(a),0))
            tangent = Vector((-math.sin(a),math.cos(a),0))
            center = n*rr + Vector((0,0,zc))
            start = len(verts)
            verts.append(tuple(center+n*.0018))
            for ring,rad in enumerate((.52,1)):
                for k in range(12):
                    th=2*math.pi*k/12
                    v=center+tangent*(.0091*rad*math.cos(th))+Vector((0,0,.0064*rad*math.sin(th)))+n*(.0018*(1-rad*rad)-.00025)
                    verts.append(tuple(v))
            for k in range(12):
                faces.append((start,start+1+k,start+1+(k+1)%12))
                faces.append((start+1+k,start+13+k,start+13+(k+1)%12,start+1+(k+1)%12))
    return _mesh(name+"_sculpted_scales",verts,faces,root,mat)


def _mug_vessel(root, variant, name, pos=(0,0,0), scale=1):
    if variant=="pumpkin":
        mat=material("Glazed pumpkin ceramic",(.85,.19,.033,1),roughness=.23)
        h,rb,rt,belly=.075,.042,.057,.059
    elif variant=="scale_green":
        mat=material("Glazed forest ceramic",(.026,.145,.089,1),roughness=.24)
        h,rb,rt,belly=.087,.035,.045,.048
    elif variant=="black":
        mat=material("Glazed black ceramic",(.006,.013,.014,1),roughness=.20)
        h,rb,rt,belly=.095,.037,.045,.047
    else:
        mat=material("Ivory ceramic",_WHITE,roughness=.22)
        h,rb,rt,belly=.095,.036,.045,.046
    interior=material("Green interior glaze",(.035,.36,.18,1),roughness=.19) if variant=="white_green" else mat
    # Complete ceramic wall, lip, inner cavity and foot, in separate inspectable meshes.
    outer=lathe(name+"_ceramic_body",[(0,.004),(rb-.002,.004),(rb,.006),(rb,.015),(belly,h*.48),(rt,h-.005),(rt-.0005,h),(rt-.0035,h),(rt-.004,h-.005)],root,mat)
    inner=lathe(name+"_inner_glaze",[(rt-.0035,h),(rt-.004,h-.005),(belly-.004,h*.48),(rb-.004,.017),(0,.017)],root,interior)
    foot=_ring(name+"_ceramic_foot",rb-.003,.001,.004,root,mat,.004)
    handle=_handle(name+"_handle",belly-.003,h,root,mat,thick=.007,width=.029 if variant!="pumpkin" else .031)
    if variant=="scale_green":
        def radius_at(z):
            if z<h*.48:
                return rb+(belly-rb)*((z-.015)/(h*.48-.015))
            return belly+(rt-belly)*((z-h*.48)/(h*.52))
        _scales(root,name,radius_at,h,mat)
    if variant=="white_green":
        _logo(root,name,belly,h*.52,size=.035)
        _text(name+"_rim_wordmark","STARBUCKS",(0,-rt-.0003,h-.0048),.0032,root,material("Green ceramic printing",_GREEN))
    if variant=="pumpkin":
        _text(name+"_rim_wordmark","STARBUCKS",(0,-rt-.0008,h-.008),.0031,root,material("Ceramic gold ink",(.61,.40,.12,1)))
        # Gentle squash-like glaze grooves make this short, wide cup recognizable.
        for j in range(9):
            a=2*math.pi*j/9
            points=[]
            for f in (0,.2,.4,.6,.8,1):
                z=.014+(h-.026)*f
                rr=rb+(belly-rb)*math.sin(f*math.pi*.75)
                points.append((rr*math.cos(a),rr*math.sin(a),z))
            _tube(name+"_glaze_flute_%02d"%j,points,.00055,root,material("Pumpkin glaze highlights",(.92,.24,.045,1),roughness=.22))
    root["height_m"] = h
    root["width_m"] = 2*belly+.051
    return h


def _city_mug(root, name):
    kraft=material("Kraft cardboard",_KRAFT,roughness=.82)
    green=material("Bright green cardboard",(.036,.61,.034,1),roughness=.72)
    dims=(.152,.099,.119)
    # Five panels form a genuine open presentation carton around a complete mug.
    _box(name+"_box_bottom",(.152,.099,.004),(0,.0,.003),root,green,.001)
    _box(name+"_box_back",(.152,.003,.119),(0,.048,.061),root,green,.001)
    _box(name+"_box_left",(.003,.099,.119),(-.0745,0,.061),root,green,.001)
    _box(name+"_box_right",(.003,.099,.119),(.0745,0,.061),root,green,.001)
    _box(name+"_box_header",(.152,.099,.003),(0,0,.119),root,green,.001)
    _box(name+"_kraft_sleeve_footer",(.154,.007,.018),(0,-.048,.012),root,kraft,.0006)
    _text(name+"_box_collection","You Are Here Collection",(0,-.052,.013),.005,root,material("Kraft print",(.22,.15,.071,1)))
    before=set(root.children)
    _mug_vessel(root,"city",name+"_mug")
    mug_children=[ob for ob in root.children if ob not in before]
    for ob in mug_children:
        ob.location.x -= .014
        ob.location.z += .008
    # Printed city panorama wraps the ceramic without obstructing the opening.
    band=lathe(name+"_mug_city_decoration",[(.0454,.026),(.0462,.073)],root,_pattern_material("city"))
    band.location.x=-.014
    _text(name+"_city_name","BARCELONA",(-.014,-.0468,.084),.0035,root,material("City green print",_GREEN))
    root["height_m"] = .121
    root["width_m"] = .154


def _travel_mug(root, variant, name):
    black=material("Travel mug black plastic",(.009,.018,.019,1),roughness=.35)
    green=material("Travel mug green silicone",(.018,.46,.14,1),roughness=.42)
    h,rb,rt=.182,.031,.042
    lathe(name+"_body",[(0,.003),(rb-.002,.003),(rb,.008),(rt,h-.010),(rt,h),(rt-.003,h),(rb-.003,.015),(0,.015)],root,black)
    _ring(name+"_base",rb,.001,.002,root,black,.005)
    lid_mat=green if variant=="lid_green" else black
    lathe(name+"_lid",[(0,h-.002),(rt+.002,h-.002),(rt+.002,h+.006),(rt,h+.011),(rt-.006,h+.013),(0,h+.013)],root,lid_mat,64,32,.0006)
    _ring(name+"_lid_rubber_seal",rt+.0005,h-.004,.002,root,black,.002)
    sip=_box(name+"_sip_opening",(.016,.008,.0015),(0,-.023,h+.014),root,black,.002)
    flap=_box(name+"_sip_closure",(.013,.018,.0025),(0,-.014,h+.016),root,lid_mat,.002)
    if variant=="band_green":
        lathe(name+"_silicone_grip",[(.0367,.097),(.0393,.13)],root,green)
        for z in (.101,.107,.113,.119,.125):
            _ring(name+"_grip_ridge_"+str(z),.0367+(z-.097)/.033*.0026+.0002,z,.0005,root,green,.0012)
        _logo(root,name,.0386,.114,size=.028)
    else:
        _logo(root,name,.0365,.088,size=.032)
    root["height_m"]=h+.019
    root["width_m"]=(rt+.0027)*2


_COFFEE_STYLES={
    "kati":dict(color=(.73,.78,.08,1),ink=(.025,.24,.22,1),title="KATI KATI",sub="BLEND",note="BRIGHT & CITRUS",accent=(.03,.53,.61,1)),
    "pike":dict(color=(.84,.81,.65,1),ink=(.24,.22,.16,1),title="PIKE PLACE",sub="ROAST",note="SMOOTH & BALANCED",accent=(.65,.57,.32,1)),
    "guatemala":dict(color=(.53,.19,.10,1),ink=(.92,.81,.57,1),title="GUATEMALA",sub="ANTIGUA",note="COCOA & SPICE",accent=(.74,.41,.24,1)),
    "ethiopia":dict(color=(.55,.22,.11,1),ink=(.96,.85,.62,1),title="ETHIOPIA",sub="SINGLE ORIGIN",note="FLORAL & CITRUS",accent=(.78,.52,.15,1)),
    "verona":dict(color=(.075,.028,.064,1),ink=(.92,.82,.62,1),title="CAFFÈ VERONA",sub="DARK ROAST",note="RICH & WELL BALANCED",accent=(.51,.33,.13,1)),
    "iced":dict(color=(.60,.79,.83,1),ink=(.05,.18,.20,1),title="ICED COFFEE",sub="BLEND",note="REFRESHING & SMOOTH",accent=(.33,.65,.73,1)),
}


def _coffee(root, variant, name):
    s=_COFFEE_STYLES[variant]
    body_mat=material("Coffee bag "+variant,s["color"],metallic=.05,roughness=.62)
    ink=material("Coffee print "+variant,s["ink"],roughness=.7)
    accent=material("Coffee artwork "+variant,s["accent"],roughness=.6)
    w,d,h=.110,.064,.243
    # Octagonal gussets and staggered top folds give each flexible bag real volume.
    section=[(-.5,-.36),(-.35,-.5),(.35,-.5),(.5,-.36),(.5,.36),(.35,.5),(-.35,.5),(-.5,.36)]
    rings=[(.003,.91,.86),(.014,1,1),(.215,1,1),(.232,.97,.55),(.240,.93,.16)]
    verts=[]
    for z,wx,dy in rings:
        for x,y in section:
            verts.append((x*w*wx,y*d*dy,z))
    faces=[tuple(reversed(range(8)))]
    for k in range(len(rings)-1):
        for j in range(8):
            faces.append((k*8+j,k*8+(j+1)%8,(k+1)*8+(j+1)%8,(k+1)*8+j))
    faces.append(tuple(range(32,40)))
    _mesh(name+"_gusseted_bag",verts,faces,root,body_mat,False)
    _box(name+"_heat_seal",(w*.92,.0035,.008),(0,0,h),root,body_mat,.0008)
    # Real crimp ridges, gusset seams and a folded rear seal remain mesh parts.
    for j in range(23):
        xx=-w*.435+j*w*.87/22
        _tube(name+"_top_crimp_%02d"%j,[(xx,-.0020,h-.002),(xx,-.0020,h+.0035)],.00018,root,body_mat)
    for side in (-1,1):
        _tube(name+"_side_gusset_seam_%s"%side,[(side*w*.485,-d*.345,.021),(side*w*.493,-d*.352,.212),(side*w*.467,-d*.080,.236)],.00035,root,body_mat)
    _box(name+"_rear_folded_seal",(.009,.0012,.198),(0,d*.50+.0003,.112),root,body_mat,.0004)
    # A thin separate printable front sheet and clear seam borders.
    _box(name+"_front_panel",(w*.70,.0005,.177),(0,-d/2-.0004,.106),root,body_mat,.0004)
    _logo(root,name,d/2+.0008,.205,size=.024)
    _text(name+"_brand","STARBUCKS",(0,-d/2-.0015,.183),.0052,root,ink)
    _text(name+"_title",s["title"],(0,-d/2-.0016,.159),.0084 if len(s["title"])<12 else .0068,root,ink)
    _text(name+"_roast",s["sub"],(0,-d/2-.0016,.145),.0050,root,ink)
    _text(name+"_tasting",s["note"],(0,-d/2-.0016,.121),.0027,root,ink)
    _text(name+"_weight","100% ARABICA   •   250 g",(0,-d/2-.0016,.027),.0025,root,ink)
    # Graphic botanical / sunburst ornaments are built as editable raised print.
    for j in range(12):
        a=2*math.pi*j/12
        x,z=math.cos(a)*.022,.076+math.sin(a)*.026
        pts=[(x*.52,-d/2-.0014,.076+(z-.076)*.52),(x,-d/2-.0014,z)]
        _tube(name+"_botanical_ray_%02d"%j,pts,.00045,root,accent)
    _cylinder(name+"_botanical_medallion",.010,.0004,(0,-d/2-.0015,.076),root,accent,32,(math.pi/2,0,0))
    _text(name+"_origin_symbol","✦",(0,-d/2-.0020,.076),.012,root,ink)
    # The colourful seasonal bag has broad abstract leaf motifs along its borders.
    if variant=="kati":
        for side in (-1,1):
            for j in range(4):
                x=side*.039;z=.045+j*.038
                pts=[(x,-d/2-.001,.0+z), (x-side*.019,-d/2-.001,z+.016),(x-side*.005,-d/2-.001,z+.029)]
                _mesh(name+"_leaf_%s_%s"%(side,j),pts,[(0,1,2)],root,accent,False)
    if variant=="iced":
        for j in range(3):
            ob=_box(name+"_printed_ice_%s"%j,(.017,.0007,.020),(-.017+j*.018,-d/2-.0014,.065+j*.006),root,material("Ice cube ink",(.83,.93,.90,1)),.0007)
            ob.rotation_euler.y=.2*(j-1)
    root["height_m"]=h+.004
    root["width_m"]=w
    root["depth_m"]=d


def _coffee_box(root, variant, name):
    colors={"red":(.73,.055,.019,1),"yellow":(.85,.58,.014,1),"black":(.014,.021,.021,1)}
    mat=material("Coffee carton "+variant,colors[variant],roughness=.78)
    ink=material("Carton foil ink",_CREAM,roughness=.54)
    w,d,h=.059,.037,.061
    _box(name+"_carton",(w,d,h),(0,0,h/2),root,mat,.0009)
    _box(name+"_top_flap",(w-.001,d-.001,.001),(0,0,h+.0002),root,mat,.0003)
    _logo(root,name,d/2+.0007,.043,size=.018)
    _text(name+"_brand","STARBUCKS",(0,-d/2-.0012,.026),.0033,root,ink)
    title={"red":"ESPRESSO","yellow":"BLONDE","black":"DARK ROAST"}[variant]
    _text(name+"_roast",title,(0,-d/2-.0012,.017),.0035,root,ink)
    _text(name+"_caption","10 CAPSULES",(0,-d/2-.0012,.009),.0022,root,ink)
    _text(name+"_side","COFFEE",(w/2+.001,0,h*.50),.0040,root,ink,rotation=(math.pi/2,0,math.pi/2))
    root["height_m"]=h+.002
    root["width_m"]=w
    root["depth_m"]=d


def make_product(kind, variant, name, position=(0, 0, 0), rotation=0):
    """Construct a SKU assembly; root transformation never bakes child geometry.

    `rotation` is radians around Z.  Product components retain individual names
    and remain separate during normal glTF export.  Unknown SKUs fail explicitly.
    """
    spec=next((s for s in PRODUCT_TYPES if s["kind"]==kind and s["variant"]==variant),None)
    if not spec:
        raise ValueError("Unknown product SKU: %s/%s"%(kind,variant))
    root=bpy.data.objects.new(name,None)
    bpy.context.collection.objects.link(root)
    root.empty_display_type="PLAIN_AXES"
    root.empty_display_size=.04
    root["sku"]="SBX-"+kind.upper().replace("_","-")+"-"+variant.upper().replace("_","-")
    root["category"]=spec["category"]
    root["label"]=spec["label"]
    root["asset_type"]="inventory_product"
    root["components_separate"]=True
    root["units"]="metre"
    if kind=="cold_cup":
        _cold_cup(root,variant,name)
    elif kind=="thermos":
        _thermos(root,variant,name)
    elif kind=="mug":
        _city_mug(root,name) if variant=="city_box" else _mug_vessel(root,variant,name)
    elif kind=="travel_mug":
        _travel_mug(root,variant,name)
    elif kind=="coffee":
        _coffee(root,variant,name)
    elif kind=="coffee_box":
        _coffee_box(root,variant,name)
    root.location=position
    root.rotation_euler.z=rotation
    return root

"""Render the generated Best Blender characters without changing their sources.

Run after all four final .blend files have been generated:
  blender --background --factory-startup --python-exit-code 1 \
    --python admira-xp/tools/people-blender/render_review.py -- \
    --sourceassets admira-xp/assets/people/best-v1 --output /tmp/best-people-review.png

Single-profile face inspection:
  ... --profile female --closeup --output /tmp/best-female-face.png

This is an actual 3D studio render of the published model sources, not a
photograph or a screenshot of the WebGL runtime. A JSON sidecar records the
source hashes, scaling, poses, frame and rendering settings.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector

PROFILES = ("male", "female", "child-male", "child-female")
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--sourceassets", required=True, type=Path)
parser.add_argument("--output", required=True, type=Path)
parser.add_argument("--profile", choices=("all",) + PROFILES, default="all")
parser.add_argument("--closeup", action="store_true")
parser.add_argument("--pose", choices=("mixed", "Idle", "Walk"), default="mixed")
parser.add_argument("--frame", type=int, default=9)
parser.add_argument("--samples", type=int, default=16)
parser.add_argument("--width", type=int, default=1600)
parser.add_argument("--height", type=int, default=1000)
parser.add_argument("--save-scene", type=Path, help="Optional new review .blend; never a source file.")
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])

if args.closeup and args.profile == "all":
    parser.error("--closeup requires a single --profile")
if args.samples < 1 or args.width < 64 or args.height < 64:
    parser.error("Samples and image dimensions must be positive")
profiles = PROFILES if args.profile == "all" else (args.profile,)
sourceassets = args.sourceassets.resolve()
sources = {profile: sourceassets / f"{profile}.blend" for profile in profiles}
for path in sources.values():
    if not path.is_file() or path.stat().st_size == 0:
        raise FileNotFoundError(f"Generate the final source before reviewing: {path}")
output = args.output.resolve()
if output.suffix.lower() != ".png":
    parser.error("--output must be a PNG path")
output.parent.mkdir(parents=True, exist_ok=True)
if args.save_scene and args.save_scene.resolve() in sources.values():
    parser.error("The review must not overwrite a character source")

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.name = "XpaceOS Best · Blender character review"
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = args.samples
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 3
scene.cycles.glossy_bounces = 3
scene.cycles.transmission_bounces = 3
scene.render.resolution_x = args.width
scene.render.resolution_y = args.height
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.image_settings.color_depth = "8"
scene.render.film_transparent = False
scene.render.fps = 30
scene.view_settings.view_transform = "AgX"
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1
scene.render.filepath = str(output)
scene.world = bpy.data.worlds.new("Review · neutral studio")
scene.world.use_nodes = True
background = scene.world.node_tree.nodes.get("Background")
background.inputs["Color"].default_value = (.84, .87, .83, 1)
background.inputs["Strength"].default_value = .45


def model_bounds(objects):
    """Evaluated (posed) mesh bounds in Blender world coordinates."""
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    points = []
    for obj in objects:
        if obj.type != "MESH":
            continue
        evaluated = obj.evaluated_get(depsgraph)
        points.extend(evaluated.matrix_world @ Vector(corner) for corner in evaluated.bound_box)
    if not points:
        raise RuntimeError("The source contains no renderable character meshes")
    return (
        Vector(tuple(min(point[axis] for point in points) for axis in range(3))),
        Vector(tuple(max(point[axis] for point in points) for axis in range(3))),
    )


def append_profile(profile, index):
    source = sources[profile]
    with bpy.data.libraries.load(str(source), link=False) as (library, destination):
        destination.objects = library.objects
    objects = [obj for obj in destination.objects if obj is not None and obj.type in {"ARMATURE", "MESH"}]
    for obj in destination.objects:
        if obj is not None and obj not in objects:
            bpy.data.objects.remove(obj, do_unlink=True)
    rigs = [obj for obj in objects if obj.type == "ARMATURE"]
    if not rigs:
        raise RuntimeError(f"{profile}: expected an articulated Blender source")
    collection = bpy.data.collections.new(f"Visitor · {profile}")
    scene.collection.children.link(collection)
    group = bpy.data.objects.new(f"Presentation · {profile}", None)
    collection.objects.link(group)
    for obj in objects:
        collection.objects.link(obj)
        obj.hide_render = False
        obj.hide_set(False)
        if obj.parent not in objects:
            obj.parent = group
        if obj.type == "MESH":
            for material in obj.data.materials:
                if not material or not material.use_nodes:
                    continue
                for node in material.node_tree.nodes:
                    image = getattr(node, "image", None)
                    if image and image.source == "FILE" and not image.packed_file:
                        raise RuntimeError(f"{profile}: a material image is not packed into its source")
    pose = args.pose if args.pose != "mixed" else ("Walk" if index % 2 else "Idle")
    if len(profiles) == 1 and args.pose == "mixed":
        pose = "Idle"
    for rig in rigs:
        animation = rig.animation_data
        if not animation:
            raise RuntimeError(f"{profile}: no authored animation")
        animation.action = None
        found = False
        for track in animation.nla_tracks:
            active = track.name.split(".")[0] == pose
            track.mute = not active
            track.is_solo = False
            found |= active
            if active:
                for strip in track.strips:
                    strip.influence = 1
        if not found:
            raise RuntimeError(f"{profile}: missing {pose} NLA track")
    # All exported bases are normalized to 1.70 model units. The child
    # presentation applies the same intended height family explicitly here;
    # these model units do not assert a measured person's physical height.
    factor = .72 if profile.startswith("child-") else 1
    group.scale = (factor, factor, factor)
    if len(profiles) > 1:
        group.location = ((-1.65, -.50, .65, 1.65)[index], (.16, .02, -.16, -.12)[index], 0)
        group.rotation_euler.z = (math.radians(-3), math.radians(5), math.radians(-5), math.radians(4))[index]
    scene.frame_set(args.frame)
    low, high = model_bounds(objects)
    group.location.z -= low.z  # Sole contact, using the actual evaluated pose.
    low, high = model_bounds(objects)
    record = {
        "profile": profile,
        "source": str(source),
        "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "pose": pose,
        "frame": args.frame,
        "presentation_scale": factor,
        "bounds": {"min": list(low), "max": list(high)},
        "meshes": len([obj for obj in objects if obj.type == "MESH"]),
        "rigs": len(rigs),
    }
    print("APPENDED", json.dumps(record), flush=True)
    return objects, record


all_objects, records = [], []
for index, profile in enumerate(profiles):
    objects, record = append_profile(profile, index)
    all_objects.extend(objects)
    records.append(record)

# Quiet, seamless studio. No backplate, photographic overlay or image editing.
floor_material = bpy.data.materials.new("Review · warm offwhite floor")
floor_material.use_nodes = True
principled = floor_material.node_tree.nodes.get("Principled BSDF")
principled.inputs["Base Color"].default_value = (.79, .82, .77, 1)
principled.inputs["Roughness"].default_value = .87
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.006))
floor = bpy.context.object
floor.name = "Review · seamless floor"
floor.data.materials.append(floor_material)


def area(name, location, power, size, color, aim=(0, 0, .9)):
    data = bpy.data.lights.new(name, "AREA")
    data.energy, data.shape, data.size, data.color = power, "DISK", size, color
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector(aim) - obj.location).to_track_quat("-Z", "Y").to_euler()
    return obj


area("Review · broad key", (-3.5, -4.5, 5.5), 1150, 4.5, (1, .94, .86))
area("Review · soft fill", (4, -2.5, 3.0), 700, 4, (.87, .93, 1))
area("Review · edge separation", (1.5, 3.5, 4.5), 1250, 3.0, (1, .98, .93))

low, high = model_bounds(all_objects)
center = (low + high) / 2
size = high - low
bpy.ops.object.camera_add()
camera = bpy.context.object
camera.name = "Review · three-quarter camera"
camera.data.type = "ORTHO"
camera.data.lens = 50
if args.closeup:
    aim = Vector((center.x, center.y - .02, high.z - size.z * .10))
    camera.location = aim + Vector((.65, -3.5, .18))
    camera.data.ortho_scale = size.z * .43
else:
    aim = Vector((center.x, center.y, size.z * .47))
    camera.location = aim + Vector((2.2 if len(profiles) > 1 else 1.5, -9, 2.2 if len(profiles) > 1 else 1.1))
    aspect = args.width / args.height
    # ortho_scale is the image width for a landscape camera.
    camera.data.ortho_scale = max(size.x * 1.20 + .35, size.z * aspect * 1.20)
camera.rotation_euler = (aim - camera.location).to_track_quat("-Z", "Y").to_euler()
scene.camera = camera
scene.frame_set(args.frame)
bpy.context.view_layer.update()
if args.save_scene:
    review_scene = args.save_scene.resolve()
    review_scene.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(review_scene))

metadata = {
    "kind": "actual_blender_studio_render",
    "description": "Fictional Best visitors from final Blender sources; not a photograph or web screenshot.",
    "scene": scene.name,
    "output": str(output),
    "renderer": "Cycles CPU",
    "samples": args.samples,
    "resolution": [args.width, args.height],
    "closeup": args.closeup,
    "profiles": records,
    "physical_measurements_verified": False,
}
bpy.ops.render.render(write_still=True)
output.with_suffix(".json").write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n")
print("REVIEW_RENDER_COMPLETE", json.dumps({"output": str(output), "profiles": list(profiles), "metadata": str(output.with_suffix('.json'))}), flush=True)

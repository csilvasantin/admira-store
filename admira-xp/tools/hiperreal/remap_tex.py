"""remap_tex.py: blender -b out/1/hiperreal.blend --python remap_tex.py -- <dest.blend>
Master blends outside catalog/<nn>/ (Mostrador: inventario/assets/mostrador/) reference the shared library one level up: //../hiperreal-tex/."""
import bpy,os,sys
for im in bpy.data.images:
    if im.filepath.startswith('//../../hiperreal-tex/'): im.filepath='//../hiperreal-tex/'+os.path.basename(im.filepath)
out=sys.argv[sys.argv.index('--')+1]
bpy.ops.wm.save_as_mainfile(filepath=out,compress=True,relative_remap=False)
missing=[im.filepath for im in bpy.data.images if im.source=='FILE' and not im.packed_file and not os.path.exists(bpy.path.abspath(im.filepath))]
print('REMAP saved',out,'missing',missing)

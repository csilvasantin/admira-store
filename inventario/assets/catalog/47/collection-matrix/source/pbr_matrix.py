"""Portable PBR nodes for Matrix. All microstructure is baked to PNG for glTF/UE."""
from pathlib import Path
import bpy
DIR=Path(__file__).resolve().parent/'textures'
_IMAGES={}
def image(name,data=False):
    key=(name,data)
    if key not in _IMAGES:
        im=bpy.data.images.load(str(DIR/(name+'.png')),check_existing=True)
        im.colorspace_settings.name='Non-Color' if data else 'sRGB';im.pack();_IMAGES[key]=im
    return _IMAGES[key]
def map_input(mat,filename,socket,data=False):
    bs=mat.node_tree.nodes.get('Principled BSDF');tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image(filename,data)
    tex.label=filename;mat.node_tree.links.new(tex.outputs['Color'],bs.inputs[socket]);return tex
def micro(mat,prefix,strength=1,albedo=False):
    bs=mat.node_tree.nodes.get('Principled BSDF')
    if albedo:map_input(mat,prefix+'_albedo','Base Color')
    map_input(mat,prefix+'_roughness','Roughness',True)
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image(prefix+'_normal',True)
    normal=mat.node_tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=strength
    mat.node_tree.links.new(tex.outputs['Color'],normal.inputs['Color']);mat.node_tree.links.new(normal.outputs['Normal'],bs.inputs['Normal'])
    mat['pbr_texture_family']=prefix
    mat['quality']='matrix'
def volume(mat,thickness=.0028):
    bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Transmission Weight'].default_value=.96
    bs.inputs['IOR'].default_value=1.49;bs.inputs['Roughness'].default_value=.085;bs.inputs['Metallic'].default_value=0
    bs.inputs['Base Color'].default_value=(.97,.99,.978,1);bs.inputs['Alpha'].default_value=1
    group=bpy.data.node_groups.get('glTF Material Output')
    if not group:
        group=bpy.data.node_groups.new('glTF Material Output','ShaderNodeTree')
        group.interface.new_socket(name='Occlusion',in_out='INPUT',socket_type='NodeSocketFloat')
        group.interface.new_socket(name='Thickness',in_out='INPUT',socket_type='NodeSocketFloat')
        group.interface.new_socket(name='Dispersion',in_out='INPUT',socket_type='NodeSocketFloat')
        group.interface.new_socket(name='Iridescence Factor',in_out='INPUT',socket_type='NodeSocketFloat')
        group.interface.new_socket(name='Iridescence Thickness Minimum',in_out='INPUT',socket_type='NodeSocketFloat')
        group.nodes.new('NodeGroupInput');group.nodes.new('NodeGroupOutput')
    node=mat.node_tree.nodes.new('ShaderNodeGroup');node.node_tree=group;node.inputs['Thickness'].default_value=thickness
    absorb=mat.node_tree.nodes.new('ShaderNodeVolumeAbsorption');absorb.inputs['Color'].default_value=(.88,.98,.90,1);absorb.inputs['Density'].default_value=.25
    mat.node_tree.links.new(absorb.outputs['Volume'],mat.node_tree.nodes.get('Material Output').inputs['Volume'])
    mat['physical_wall_thickness_m']=thickness;mat['quality']='matrix'
def enhance_product_material(mat,name,color,metallic,roughness,transmission):
    bs=mat.node_tree.nodes.get('Principled BSDF');low=name.lower()
    if 'ceramic' in low or 'glaze' in low:
        micro(mat,'ceramic_glaze',.23)
        bs.inputs['Coat Weight'].default_value=.52;bs.inputs['Coat Roughness'].default_value=.055
        bs.inputs['Roughness'].default_value=.19
    elif 'metal' in low or 'thermos' in low or metallic>.35:
        micro(mat,'emerald_metal',.32)
        bs.inputs['Coat Weight'].default_value=.16;bs.inputs['Coat Roughness'].default_value=.14
    elif 'cardboard' in low or 'carton' in low or 'coffee bag' in low:
        micro(mat,'kraft_paper',.65,'kraft' in low)
    elif 'transparent' in low or 'glass base' in low or transmission>0:
        volume(mat,.0028 if 'transparent' in low else .0038)
    elif 'plastic' in low or 'pattern' in low:
        micro(mat,'ceramic_glaze',.07)
        bs.inputs['Coat Weight'].default_value=.24;bs.inputs['Coat Roughness'].default_value=.14
    mat['quality']='matrix'

# Pipeline Hiperreal

Guía completa: [/admira-xp/docs/hiperreal-pipeline.md](../../docs/hiperreal-pipeline.md).

```bash
# Blender 5.2 + gltf-transform v4 (GT=.../gltf-transform)
CAT=/ruta/xpaceos/inventario/assets/catalog ./run_batch.sh "44 45 46" 32   # build + render antes/después
./lod.sh 44                                                                  # LOD web WebP
# piezas a mano: pieces.json → add_parts; etiquetas planas (< decal_max_m) nunca reciben variación
python3 compose.py 1 "44 45 46"                                              # comparativa de la tanda
python3 webglass.py out/44/hiperreal.glb --dry                               # cristales del LOD web (lod.sh ya lo aplica)
python3 visor_shot.py https://www.xpaceos.com shots 44:hiperreal 1:hiperreal  # capturas del visor publicado
```

`texlib.py` necesita las fuentes CC0 en `tex/` (Poly Haven oak_veneer_01 4K, concrete_floor_02, plaster_grey_04, comfy_cafe; ambientCG Fingerprints002, Smear007, Metal049A, Cardboard004). Las texturas ya generadas se publican en `inventario/assets/hiperreal-tex/`.

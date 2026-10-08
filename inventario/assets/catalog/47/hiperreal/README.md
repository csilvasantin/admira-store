# Hiperreal · Estantería Starbucks 47 / Starbucks shelf 47

ES: Quinto acabado de la pieza 47, sobre la geometría Matrix. Conserva `native:starbucksShelves`, la instancia `sb-mugs`, el CI `PDG103-EST-01` y los 115 productos `47-P001`…`47-P115` (26 referencias visuales). Los productos siguen siendo una composición visual, sin SKU comerciales ni stock verificado.

EN: Fifth finish of piece 47, built on the Matrix geometry. It retains `native:starbucksShelves`, instance `sb-mugs`, CI `PDG103-EST-01` and the 115 products `47-P001`…`47-P115` (26 visual references). Products remain a visual composition, with no commercial SKUs or verified stock.

## Qué cambia respecto a Matrix / What changes from Matrix

1. **Materiales PBR reales (CC0).** Roble de Poly Haven `oak_veneer_01` a 4K (color miel horneado, rugosidad, oclusión y normal) con la veta siguiendo cada balda a escala física. Cerámica con esmalte (clearcoat), acero cepillado de ambientCG `Metal049A`, cartón `Cardboard004` con grano real.
2. **Imperfección.** Huellas y manchas (ambientCG `Fingerprints002`, `Smear007`) en la rugosidad de cerámica, metal y plástico. Variación por instancia: giro (tazas ±13°, vasos ±6°), posición (±3,5 mm). En Cycles, además, deriva de color ±6 %, polvo en las caras superiores y bordes biselados por shader.
3. **Proporciones.** Matrix estiraba los productos con la escala del mueble (1,43 × 1,92 × 1,16) y las tazas salían ovaladas. Hiperreal mantiene la huella del mueble en el gemelo y escala los productos de forma uniforme (×1,30).
4. **Luz de tienda.** HDRI CC0 de Poly Haven «Comfy Café». En Cycles: downlights cálidos, panel de techo y tiras LED bajo cada balda. En la web: HDRI, sombras suaves de 4096 px y suelo atrapasombras.

## Archivos / Files

| Archivo | Uso | Tamaño |
| --- | --- | --- |
| `../hiperreal.glb` | Web y gemelo · texturas WebP 1K/2K (roble 2K) | 4,6 MB |
| `hiperreal-hd.glb` | Unreal (Nanite) y render · JPEG 2K/4K (roble 4K) | 26,5 MB |
| `../hiperreal.blend` | Fuente editable con texturas empaquetadas | ver commit |
| `comfy_cafe_1k.hdr` | Luz del visor web | 1,6 MB |
| `preview/` | Renders Cycles antes/después (frontal, 3/4, detalle) y comparativa | — |
| `source/` | Scripts reproducibles (Blender 5.2.2) | — |

Un único maestro y dos LOD: el GLB web sale del HD con `gltf-transform dedup → resize → webp`.

## Unreal (Nanite)

ES: Importa `hiperreal-hd.glb` con Interchange (Import Into Level). En las opciones de malla activa **Build Nanite** y conserva los materiales; el ORM ya va en un solo canal (R = AO, G = rugosidad, B = metal). Para la escena usa Lumen y un Sky Light con el mismo HDRI (`comfy_cafe` 4K de Poly Haven).

EN: Import `hiperreal-hd.glb` with Interchange (Import Into Level). Enable **Build Nanite** in the mesh options and keep materials; ORM is packed (R = AO, G = roughness, B = metallic). Use Lumen and a Sky Light with the same HDRI (Poly Haven `comfy_cafe` 4K).

## Reconstruir / Rebuild

```
python3 source/make_gen.py && python3 source/tint.py      # texturas derivadas / derived maps
blender -b ../matrix.blend --factory-startup --python source/build_hiperreal.py -- 100 160 all
blender -b ../matrix.blend --factory-startup --python source/render_before.py -- 100 128
```

Créditos / Credits: Poly Haven (oak_veneer_01, concrete_floor_02, plaster_grey_04, comfy_cafe) y ambientCG (Metal049A, Cardboard004, Fingerprints002, Smear007), todos CC0. Three.js r160 RGBELoader, MIT.

#!/usr/bin/env bash
# Taller 3D: receta → texturas → piezas (Good, Better, Best y Hiperreal si se pide) → hoja foto | 3D.
# 3D workshop: recipe → textures → pieces → photo | 3D sheet.
# Uso / usage: taller.sh RECETA [--fotos CARPETA] [--piezas 53,54] [--salida CATALOGO] [--texturas CARPETA] [--hoja CARPETA]
#   --fotos     fotos originales (solo hacen falta para rehacer recortes y para la hoja de comparación)
#   --salida    otro catálogo (por defecto inventario/assets/catalog); --texturas otra carpeta de texturas
#   --hoja      dónde dejar la hoja foto | 3D (por defecto, la carpeta actual; nunca dentro del repo si hay personas)
# TALLER_PY = Python con Pillow y NumPy; BLENDER = ejecutable de Blender 5.x.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd); receta=$1; shift
PY=${TALLER_PY:-python3}; BLENDER=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
fotos=; piezas=; salida=; texturas=; hoja=$PWD
while [ $# -gt 0 ]; do
  case $1 in
    --fotos) fotos=$2; shift 2;; --piezas) piezas=$2; shift 2;; --salida) salida=$2; shift 2;;
    --texturas) texturas=$2; shift 2;; --hoja) hoja=$2; shift 2;;
    *) echo "opción desconocida / unknown option: $1" >&2; exit 2;;
  esac
done
"$PY" "$here/texturas.py" "$receta" ${fotos:+--fotos "$fotos"} ${texturas:+--salida "$texturas"}
"$BLENDER" --background --factory-startup --python-exit-code 1 --python "$here/taller.py" -- "$receta" \
  ${piezas:+--piezas "$piezas"} ${salida:+--salida "$salida"} ${texturas:+--texturas "$texturas"} \
  | grep -E '^(physics|[0-9]+ (good|better|best|hiperreal) exported|Taller 3D)'
"$PY" "$here/comparativa.py" "$receta" --hoja "$hoja" ${fotos:+--fotos "$fotos"} ${salida:+--catalogo "$salida"} ${piezas:+--piezas "$piezas"}

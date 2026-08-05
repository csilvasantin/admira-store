#!/bin/bash
# XpaceScan · pipeline de reconstrucción 3D — v26.07.02.1
# vídeo del móvil (xpaceos.com/scan) → frames → COLMAP → nube de puntos .ply → visor.html
# Uso:  ./scan-to-splat.sh <video.mp4|webm> [nombre-escena] [fps]
set -euo pipefail

VIDEO="${1:?Uso: scan-to-splat.sh <video> [nombre-escena] [fps]}"
ESCENA="${2:-$(basename "${VIDEO%.*}")}"
FPS="${3:-3}"
BASE="$(cd "$(dirname "$0")/.." && pwd)"          # …/xpaceos/scan
OUT="$BASE/scenes/$ESCENA"
FRAMES="$OUT/frames"
DB="$OUT/colmap.db"

command -v ffmpeg >/dev/null || { echo "falta ffmpeg (brew install ffmpeg)"; exit 1; }
command -v colmap >/dev/null || { echo "falta colmap (brew install colmap)"; exit 1; }

echo "== XpaceScan pipeline · escena '$ESCENA' =="
mkdir -p "$FRAMES"

echo "-- 1/4 extrayendo frames a $FPS fps (filtro de nitidez)…"
ffmpeg -y -loglevel error -i "$VIDEO" -vf "fps=$FPS,scale='min(1600,iw)':-2" -q:v 2 "$FRAMES/f%05d.jpg"
N=$(ls "$FRAMES" | wc -l | tr -d ' ')
echo "   $N frames"
[ "$N" -ge 20 ] || { echo "muy pocos frames ($N) — graba 60-120 s"; exit 1; }

echo "-- 2/4 COLMAP: features + matching…"
# COLMAP >=3.12 renombró SiftExtraction/SiftMatching → FeatureExtraction/FeatureMatching
if colmap feature_extractor --help 2>&1 | grep -q FeatureExtraction.use_gpu; then
  GPU_EXTRACT="--FeatureExtraction.use_gpu"; GPU_MATCH="--FeatureMatching.use_gpu"
else
  GPU_EXTRACT="--SiftExtraction.use_gpu"; GPU_MATCH="--SiftMatching.use_gpu"
fi
USE_GPU=0; command -v nvidia-smi >/dev/null && USE_GPU=1
colmap feature_extractor  --database_path "$DB" --image_path "$FRAMES" \
  --ImageReader.single_camera 1 --ImageReader.camera_model OPENCV \
  "$GPU_EXTRACT" $USE_GPU >/dev/null
colmap sequential_matcher --database_path "$DB" "$GPU_MATCH" $USE_GPU >/dev/null

echo "-- 3/4 COLMAP: reconstrucción sparse (poses de cámara)…"
mkdir -p "$OUT/sparse"
colmap mapper --database_path "$DB" --image_path "$FRAMES" --output_path "$OUT/sparse" >/dev/null
[ -d "$OUT/sparse/0" ] || { echo "mapper no convergió — más solape entre tomas"; exit 1; }

echo "-- 4/4 exportando nube de puntos points.ply…"
# el mapper puede fragmentar en varios modelos: elegir el de más imágenes registradas
BEST=""; BESTN=0
for m in "$OUT"/sparse/*/; do
  n=$(colmap model_analyzer --path "$m" 2>&1 | grep -o "Registered images: [0-9]*" | grep -o "[0-9]*$" || echo 0)
  echo "   modelo $(basename "$m"): $n imágenes"
  [ "$n" -gt "$BESTN" ] && { BEST="$m"; BESTN=$n; }
done
echo "   → exportando $(basename "$BEST") ($BESTN imágenes)"
colmap model_converter --input_path "$BEST" \
  --output_path "$OUT/points.ply" --output_type PLY >/dev/null

echo ""
echo "== LISTO =="
echo "escena:  $OUT/points.ply"
echo "visor:   https://xpaceos.com/scan/visor.html?src=scenes/$ESCENA/points.ply  (tras commit+push)"
echo "local:   abre visor.html y arrastra points.ply al centro"
echo ""
echo "Siguiente nivel (splat 3DGS denso): entrenar con OpenSplat/nerfstudio usando"
echo "$OUT/sparse/0 + frames — candidato: dgx-spark del consejo (GPU NVIDIA)."

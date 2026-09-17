# Catálogo Blender de XpaceOS

Misión DCL-bce31feb5a392a554cc40b74 · Hoy #173 · OraculoMacMini.

Las 43 identidades de `inventario/registry.json` tienen GLB y fuente Blender en Good, Better y Best. El Mostrador 1 conserva su piloto; las otras 42 piezas están en `inventario/assets/catalog/02` … `43`. Son interpretaciones de diseño, no modelos medidos. Los nombres de Pixeria se corrigen en `registry.labels`; el ID remoto y el número de CLI permanecen intactos.

- Las piezas 2–18 parten de la geometría nativa de `life-scene.mjs`, con materiales y rótulos editables. La puerta conserva una bisagra independiente y las pantallas conservan `mediaSurface=existing_shared_player`.
- Las piezas 19–43 se modelan mediante primitivas con volumen completo: asientos, respaldos, patas, vehículos, carcasas y detalles temáticos. El cuadro 32 conserva la ilustración Pixeria en una imagen empaquetada; no se presenta como una escultura de los personajes.
- Los tres perfiles varían la geometría: Good simplifica curvas y bordes, Better usa detalle intermedio y Best conserva curvas y biseles. 8/16/32 son nombres de estilos, no profundidades literales de color.
- Las fuentes conservan piezas y modificadores editables. La exportación web agrupa las piezas estáticas por acabado para reducir llamadas de dibujo. Las bisagras y superficies de vídeo se mantienen separadas.

## Reproducir

Desde la raíz del repositorio, con Blender 5.2.2 LTS:

```sh
node admira-xp/tools/xpacios-blender/export_native.mjs
mkdir -p /tmp/xpaceos-references
curl --fail 'https://api.admira.store/stock/asset/1780741287437-6f0w3j?v=110882' -o /tmp/xpaceos-references/32.png
/Applications/Blender.app/Contents/MacOS/Blender -b --threads 4 --python admira-xp/tools/xpacios-blender/build_catalog.py -- --native /tmp/xpaceos-native.json
/Applications/Blender.app/Contents/MacOS/Blender -b --threads 4 --python admira-xp/tools/xpacios-blender/verify_catalog.py
node --test inventario/*.test.mjs admira-xp/scripts/*.test.mjs
```

`--only 26` regenera una pieza; `--min-number 19` regenera Pixeria. El generador del Mostrador sigue en `build_counter.py`. Las referencias originales están documentadas en `pixeria-cache.json` y en cada manifest. Las coordenadas de Blender son X=columna, -Y=fila, Z=altura; el GLB se carga en Three sin rotación adicional. Se conserva la huella lógica, usando escala uniforme en las interpretaciones Pixeria. No se modifican colisiones ni dimensiones físicas reales.

## Integración

`furniture-asset.mjs` resuelve una instancia nativa o una URL de stock a su número. Mantiene caché por pieza/perfil y devuelve clones para cada instancia. `life-scene.mjs` conserva el contenedor seleccionable y sus transformaciones, reemplaza la geometría al cargar y conecta pantallas/bisagras al estado existente. Si falta un asset o no pertenece al registro, conserva la representación anterior. Una carga tardía no puede resucitar objetos retirados ni escenas cerradas.

`/inventario/` ofrece comparación de perfiles, visor 360, malla y descargas. `/inventario/conjunto/` muestra los 43 modelos, permite cambiar acabado y aislar una pieza; no escribe ni lee la distribución personal. En el Xtanco editable, Better y Best usan automáticamente los GLB para las piezas colocadas, incluidas las importadas desde Pixeria. Good del simulador conserva su representación clásica.

## Validación

`catalog-blender.test.mjs` comprueba los 129 GLB, fuentes, identidades, geometría finita, carga genérica, errores, retirada durante carga, conexión de pantallas, bisagra y separación de la exposición del estado personal. `verify_catalog.py` reabre las 42 fuentes Best y reimporta sus GLB en Blender; el resultado se publica en `inventario/assets/catalog/validation.json`. La comprobación visual debe incluir 43/43 en los tres perfiles, selección y giro en el inventario y objetos Blender en el Xtanco editable.

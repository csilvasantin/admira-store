# Best: visitantes humanos en Blender

Esta primera iteración cambia los visitantes de Best a cuerpos humanos con
anatomía continua, ropa ajustada y animación de esqueleto. La referencia de
dirección artística es un videojuego urbano; el resultado no pretende ser
fotorrealismo AAA. Good y Better conservan sus representaciones propias.

## Fuentes y licencia

Sólo se usan datos del proyecto oficial MakeHuman Community, publicados como
CC0. Los archivos de aplicación de MakeHuman tienen otra licencia y no se
descargan ni se ejecutan para generar estos modelos.

- [Declaración de licencia de assets](https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/LICENSE.md).
- [Paquete de sistema y licencia de cada asset](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html).
- [Descarga oficial del paquete de sistema](https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip).

[`sources.lock.json`](sources.lock.json) fija las URLs de base, rig, pesos y
cuatro targets al commit `a8bc2d54ff0ac92e78ff71431b1023eda42bf482`. También
registra tamaño y SHA256 del paquete y de cada archivo descargado. El script
rechaza cualquier descarga cuyo contenido no coincida. No se debe actualizar
el hash para ignorar un error de descarga sin revisar el cambio de origen.

Los datos seleccionados del paquete son:

- `clothes/male_casualsuit01` y `clothes/female_casualsuit01`: ropa con pantalón.
- `clothes/shoes02`: deportivas.
- `hair/short02` y `hair/ponytail01`: pelo corto y coleta.
- `eyebrows/eyebrow001`: cejas.
- `eyes/low-poly` y `eyes/materials`: ojos y sus texturas compartidas.
- `skins/young_caucasian_male` y `skins/young_caucasian_female`: piel base.

Los nombres demográficos son identificadores originales de MakeHuman. Las
variantes de apariencia y escala que utiliza la tienda no identifican personas
reales. Esta selección inicial no agota la diversidad del catálogo MakeHuman.

## Preparar los datos

Requiere Python 3.9 o posterior, conexión de red y unos 350 MB libres para
descarga y datos seleccionados. No requiere cuenta ni servicio de pago.

Desde la raíz del repositorio:

```sh
python3 admira-xp/tools/people-blender/prepare_sources.py --output /tmp/xpaceos-human-reference
```

El script reutiliza archivos ya presentes cuando pasan la comprobación SHA256.
Extrae sólo los directorios permitidos y únicamente formatos de datos conocidos;
rechaza enlaces y rutas que salgan de la carpeta de salida. No instala paquetes,
add-ons ni ejecuta código del archivo descargado. El ZIP permanece en la carpeta
de salida como caché; no se añade al repositorio.

## Generar modelos

Requiere Blender con su exportador glTF. La ruta siguiente corresponde a la
instalación de macOS usada para esta primera versión; puede sustituirse por el
ejecutable de Blender del entorno.

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python admira-xp/tools/people-blender/build_people.py -- --source /tmp/xpaceos-human-reference --output admira-xp/assets/people/best-v1 --profile male --render
```

Ejecutar también con `--profile female`, `--profile child-male` y
`--profile child-female` para completar las cuatro bases. `--render` añade una
imagen de estudio para inspección. El generador produce el `.blend` editable,
un `.glb` para la web y un manifiesto `.json` por perfil. Las luces y el suelo
de estudio no forman parte del GLB.

El proceso aplica el target oficial a todos los vértices originales, incluidos
los helpers. Ajusta ropa, ojos, cejas y pelo mediante el mapeo barycéntrico MHCLO
y su escala por eje. Los huesos se sitúan a partir de los joints originales;
los pesos se agrupan en una jerarquía de deformación reducida. Se descartan
helpers y caras del cuerpo tapadas por la ropa. El GLB conserva UV, materiales,
skin y clips `Idle` / `Walk`.

Los archivos exportados usan Y arriba y Z hacia delante. La altura base se
normaliza para que la simulación controle la escala final de cada visitante;
no representa una medición física. Los perfiles infantiles tienen targets
anatómicos propios antes de esa normalización.

## Comprobación

Antes de publicar, revisar el render y los cuatro GLB: mallas visibles, ropa
sin perforaciones importantes en la marcha, un skin con pesos normalizados y
los clips Idle/Walk. Comprobar también el cambio Best/Better y la entrada y
salida de visitantes dentro del Xtanco. Un render estático no comprueba la
animación ni la integración con la simulación.

La licencia de los derivados publicados se conserva en
[`../../assets/people/best-v1/LICENSE.md`](../../assets/people/best-v1/LICENSE.md).

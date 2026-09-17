# Piloto Blender: mostrador Xtanco interpretado

Genera una pieza editable `.blend`, un GLB con materiales PBR y una imagen de revisión. La pieza interpreta el estilo procedural actual: **no usa fotos ni medidas reales y no activa Best en el juego**.

Blender se ejecuta en segundo plano con una escena de fábrica. No instala extensiones ni utiliza la sesión de interfaz del usuario. Las salidas se escriben exclusivamente en el directorio indicado.

Ejecutar desde la raíz del repositorio `xpaceos`:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python-exit-code 1 --python admira-xp/tools/xpacios-blender/build_counter.py -- --output /Users/csilvasantin/Documents/ChatGPT/Yokup.com/output/xpacios-blender --quality best --resolution 1100
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python-exit-code 1 --python admira-xp/tools/xpacios-blender/verify_counter.py -- --output /Users/csilvasantin/Documents/ChatGPT/Yokup.com/output/xpacios-blender --quality best
```

`--quality good|better|best` cambia biseles, resolución de texturas y segmentos circulares del mismo mostrador y configuración. Son perfiles de detalle del asset; no indican profundidad de color de 8, 16 o 32 bits ni equivalen por sí solos a las vistas Good/Better/Best del producto. `--skip-render` permite generar variantes sin otra imagen; `--resolution` controla el render cuadrado.

El manifiesto generado documenta proporciones, límites de geometría, pivot, partes semánticas, material de pantalla y estado interpretado. Las unidades son casillas sin calibración métrica. El GLB se exporta Y-up: X=columna, Y=altura, Z=fila. Colgarlo de `furniture:<id>` en el origen de la casilla y aplicar sus transformaciones una sola vez; conservar navegación, colisiones e interacciones del juego.

La superficie `screen_tpv_main` tiene una textura estática ADMIRA y el extra `mediaSurface=existing_shared_player`: la futura integración debe reutilizar allí el reproductor existente. No se incluye ningún player, vídeo o simulación.

El `.blend` conserva texto editable, biseles y texturas empaquetadas. La colección STUDIO sólo produce la imagen: cámaras, luces y suelo no se exportan al GLB. Las texturas se generan de forma determinista con NumPy incluido en Blender; no hay assets descargados. El render de estudio y WebGL pueden diferir en iluminación.

Revisión del 15/09/2026: el piloto actualizado se publica en `/inventario/#mostrador` y los GLB se integran en Better/Best editable. El laboratorio original permanece como referencia histórica. `verify_counter.py` valida ahora las dos puertas traseras y la identidad permanente 1, por lo que debe ejecutarse sobre los assets regenerados de `inventario/assets/mostrador`. Instalación verificada: `/Applications/Blender.app`, Blender 5.2.2 LTS mediante Homebrew cask oficial.

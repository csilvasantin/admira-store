# Objeto · Stream Deck XL · gemelo 3D

Proyecto dirigido por **Woz** (Consejo AdmiraNext) para **Carlos** (AdmiraNeXT). Arrancado el 5 de noviembre de 2026. **v2 silueta** (mismo día): remodelado procedural a partir de la foto de perfil METAHUMAN. **LCD fix** (mismo día): teclas emiten `face-live.png` (atlas 8×4 desde foto desk METAHUMAN), no wash rojo.

## ES

El Xpace **Objeto** vive en el selector Xpaces de admira.store, paralelo a **Computer**. Su primer local es **Stream Deck**: el gemelo 3D del Elgato Stream Deck XL físico conectado a METAHUMAN.

| Pieza | Dónde | Qué hace |
|---|---|---|
| Gemelo | `objeto/stream-deck/index.html` | Three.js 0.160 · `RoundedBoxGeometry` · chasis mate + 8×4 rim negro opaco · **LCD arriba** (`MeshBasicMaterial` + `face-live.png`) · stand cuña ~42° · cable USB · OrbitControls. Atlas 8×4 desde foto desk (Indiana Jones como en METAHUMAN). |
| Fotos | `face-live.png` · `indiana-jones.png` · `metahuman-desk.jpg` · `perfil-metahuman.png` | **Cara live** (atlas 8×4 recortado de la foto desk), fallback mural, foto frontal METAHUMAN, **perfil** v2. |
| Selector | `assets/objeto-xpace.mjs` + `admira-xp/scripts/project-selector.mjs` | Xpace `objeto` → venue `stream-deck`. Embed iframe bajo la barra (Carlos: no salir del shell). URL directa `/objeto/stream-deck/` válida. |
| Combos | `assets/xpace-combos.mjs` | Mismos tres combos en páginas de local; Objeto aparece junto a Computer. |

### Dispositivo

- Elgato Stream Deck XL · VID_0FD9 · PID_006C · serial **CL37J1A02733**
- 32 teclas LCD · 8 columnas × 4 filas
- Host: METAHUMAN (escritorio Carlos)

### Silueta v2 (foto perfil METAHUMAN)

Carlos: el v1 «no se parece en nada». Remodel procedural (sin Blender):

- Chasis fino redondeado (~3.26×1.32×0.23), plástico **mate** (roughness ~0.8, metalness ~0.08) — no ladrillo chrome.
- Stand **cuña magnética** separada: base en desk + brace angular → hueco triangular / L bajo el slab. Inclinación de cara ≈ **42°** (antes ~18°).
- Keycaps: **rim/bezel negro opaco** + plano LCD **encima** de la tecla (`y = KEY_H/2 + 0.001`), no bajo glass con transmission. Material LCD `MeshBasicMaterial({ map })` para que Indiana Jones se lea nítido (sin wash emissive naranja).
- Fuente de cara: `face-live.png` = atlas 8×4 perspectivo desde `metahuman-desk` / foto METAHUMAN Indiana Jones; `indiana-jones.png` queda como fallback. Columnas oscuras en la foto = teclas oscuras en el gemelo.
- Marca blanca Elgato (círculo-E) + «STREAM DECK» en bezel superior.
- Stub de cable USB-C saliendo del dorso bajo el stand.
- Sombra de contacto suave + cámara ¾ que enseña perfil del stand y mural.

### Estado

- **Entregado:** gemelo 3D v2 + LCD face-live (badge «Cara desde foto METAHUMAN · live bridge USB pendiente»), selector Objeto → Stream Deck, docs/help/MCP snippet, perímetro público `/objeto/`.
- **Puente EN VIVO (5-nov-2026):** ver sección al final. **Ficha de teclas y títulos (6-nov-2026):** ver sección al final.
- **Pendiente:** pulsaciones físicas en el gemelo (HID) y pulsar una tecla desde el gemelo (no hay API de Elgato para ello).

Canonical: https://www.admira.store/objeto/stream-deck/

## EN

The **Objeto** (Object) Xpace sits in the admira.store Xpaces selector, parallel to **Computer**. Its first venue is **Stream Deck**: a 3D twin of the physical Elgato Stream Deck XL on METAHUMAN.

| Piece | Where | Role |
|---|---|---|
| Twin | `objeto/stream-deck/index.html` | Three.js 0.160 · `RoundedBoxGeometry` · matte chassis + 8×4 opaque black rims · **LCD on top** (`MeshBasicMaterial` + `face-live.png`) · ~42° wedge stand · USB stub · OrbitControls. Full 8×4 atlas from the METAHUMAN desk photo (Indiana Jones as on the physical deck). |
| Photos | `face-live.png` · `indiana-jones.png` · `metahuman-desk.jpg` · `perfil-metahuman.png` | **Live face** (8×4 atlas cropped from desk photo), mural fallback, METAHUMAN desk front ref, **side profile** — v2 silhouette reference. |
| Selector | `assets/objeto-xpace.mjs` + `admira-xp/scripts/project-selector.mjs` | Xpace `objeto` → venue `stream-deck`. Embed iframe under the top bar (Carlos: stay in the shell). Direct URL `/objeto/stream-deck/` still works. |

### Device

- Elgato Stream Deck XL · VID_0FD9 · PID_006C · serial **CL37J1A02733**
- 32 LCD keys · 8 columns × 4 rows · Host: METAHUMAN

### Silhouette v2 (METAHUMAN side photo)

Carlos: v1 “looks nothing like it.” Procedural remodel (no Blender):

- Thin rounded chassis, **matte** black plastic — not chrome brick.
- Separate **magnetic wedge** stand with hollow triangular / L gap; face tilt ≈ **42°** (was ~18°).
- Keycaps: **opaque black rim/bezel** + LCD plane **on top** of the key (not under transmitting glass). LCD uses `MeshBasicMaterial({ map })` so Indiana Jones stays sharp (no orange emissive wash).
- Face source: `face-live.png` = 8×4 atlas from the METAHUMAN desk photo; `indiana-jones.png` remains fallback. Dark photo regions stay dark on the twin.
- White Elgato mark + “STREAM DECK” on top bezel; USB-C cable stub under the stand.
- Soft contact shadow; default ¾ camera shows stand profile and readable mural.

### Status

- **Shipped:** 3D twin v2 + LCD face-live (badge “Face from METAHUMAN photo · USB live bridge pending”), Objeto → Stream Deck selector, docs/help/MCP snippet, public perimeter `/objeto/`.
- **LIVE bridge (5 Nov 2026)** and **key records + titles (6 Nov 2026):** see the sections at the end.
- **Pending:** physical key presses on the twin (HID) and pressing a key from the twin (no Elgato API for it).
- 5-nov-2026: face-live.png v3 rehecho desde foto close-up METAHUMAN (warp de perspectiva, solo inset LCD, cols 0/6/7 apagadas como en el físico). Cámara más frontal. Puente USB pendiente.

## Puente EN VIVO (5-nov-2026)

- **Publicador** (METAHUMAN): `C:\Users\csilv\admira-tv\tools\streamdeck-bridge\puente.py`, cada ~2,5 s lee
  `%APPDATA%\Elgato\StreamDeck\ProfilesV3\<perfil>.sdProfile\manifest.json` → `Pages.Current`, carga las
  `Controllers[0].Actions` (`"col,row"`) de esa página y compone un atlas 1024×512 (8×4 · 128 px) con
  `States[State].Image`. Si el hash no cambia solo manda latido. POST a `/objeto/stream-deck/api/face`
  con el mismo Bearer `sc_…` que los ventiladores (la clave no sale nunca en logs).
- **Nube**: Worker `supercomputer` (Durable Object), rutas `POST /streamdeck`, `GET /streamdeck/face.png`
  (ETag), `GET /streamdeck/estado`. En línea = latido < 15 s.
- **Pages**: `functions/objeto/stream-deck/api/[[path]].js`. GET `face.png` / `estado` son públicos (la
  función firma con `SUPERCOMPUTER_PROXY_KEY` en el servidor); POST exige Bearer.
- **Gemelo**: arranca con `face-live.png` y sondea `api/face.png` cada 2,5 s (If-None-Match); badge
  verde «EN VIVO · METAHUMAN» o «Foto fija / sin puente».
- **Parar**: `schtasks /End /TN AdmiraStreamDeckBridge` y `schtasks /Change /TN AdmiraStreamDeckBridge /DISABLE`.
- **Límites**: es el perfil Elgato, no HID crudo; imágenes dinámicas de plugins (Key Creator, contadores,
  títulos dibujados por el software) no aparecen; carpetas/multipágina siguen `Pages.Current` del perfil.

## Ficha de teclas y títulos (6-nov-2026)

- **Títulos pintados**: `puente.py` dibuja sobre cada icono el título del perfil como lo hace el software Elgato
  (líneas, incluidas las vacías; `TitleAlignment` top/middle/bottom; `TitleColor`; `FontSize` escalado de 96 a 128 px;
  `OutlineThickness` como contorno negro; `ShowTitle:false` lo oculta; fuente del perfil si existe en Windows, si no
  Arial negrita). Un título más ancho que la tecla encoge hasta caber.
- **Ficha por tecla**: junto a la cara, el puente manda `keys` («col,fila» → `{n: nombre de la acción, u: UUID sin
  `com.elgato.streamdeck.`, t: título, s: nº de estados, i: estado activo}`), `pageName`, `profileName`, `pages`,
  `pageIndex` y `folder` (la página activa es una carpeta: tiene «Volver» en 0,0). Solo viaja cuando cambia la cara.
- **Nube**: `POST /streamdeck` guarda la ficha (máx. 32 teclas, textos recortados) y `GET /streamdeck/estado` la
  devuelve: `{ok, ahora, enLinea, visto, serial, pageId, keyCount, hash, pageName, profileName, pages, pageIndex, folder, keys}`.
- **Gemelo**: sondea `api/estado` cada 2,5 s y solo baja `api/face.png` cuando cambia `hash`. Al pasar el ratón por
  una tecla, tooltip con título y acción en castellano (Atajo de teclado, Abrir app, Abrir web, Multimedia, Carpeta,
  Volver, Dormir pantallas, Brillo, Multiacción…); al hacer clic, la ficha fija `(fila,col) «título» · acción · estado`.
  La ficha del dispositivo enseña además Perfil, Página (o «carpeta»), nº de acciones y «Visto hace N s» en verde si está en línea.
- **Prueba local sin subir nada**: `python puente.py --png salida.png` deja el atlas y `salida.png.json` con la ficha.
- **URLs**: https://www.admira.store/objeto/stream-deck/api/estado · https://www.admira.store/objeto/stream-deck/api/face.png

## Key records and titles (6 Nov 2026)

- **Painted titles**: `puente.py` draws each key's profile title over its icon the way the Elgato software does
  (lines, blank ones included; `TitleAlignment`; `TitleColor`; `FontSize` scaled from 96 to 128 px; `OutlineThickness`
  as a black outline; `ShowTitle:false` hides it; the profile font when Windows has it, else Arial bold). Titles wider
  than the key shrink to fit.
- **Per-key record**: next to the face the bridge sends `keys` ("col,row" → `{n: action name, u: UUID without
  `com.elgato.streamdeck.`, t: title, s: state count, i: active state}`), `pageName`, `profileName`, `pages`, `pageIndex`
  and `folder`. It travels only when the face changes.
- **Cloud**: `POST /streamdeck` stores the record (max 32 keys, trimmed strings) and `GET /streamdeck/estado` returns it.
- **Twin**: polls `api/estado` every 2.5 s and downloads `api/face.png` only when `hash` changes. Hovering a key shows a
  tooltip with title and action; clicking pins `(row,col) "title" · action · state` in the panel, which also shows
  Profile, Page (or "folder"), action count and "seen N s ago" (green while online).

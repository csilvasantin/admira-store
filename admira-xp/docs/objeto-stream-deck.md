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
- **Pendiente:** puente USB / player para emitir demos de admira.tv en las teclas reales (sin bridge todavía). Honestidad: las teclas ya coinciden con la foto; el stream USB en vivo no.

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
- **Pending:** USB / player bridge to push admira.tv demos onto the real keys. Honest: keys already match the photo; live USB stream does not.
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

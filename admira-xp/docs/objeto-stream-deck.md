# Objeto · Stream Deck XL · gemelo 3D

Proyecto dirigido por **Woz** (Consejo AdmiraNext) para **Carlos** (AdmiraNeXT). Arrancado el 5 de noviembre de 2026. **v2 silueta** (mismo día): remodelado procedural a partir de la foto de perfil METAHUMAN.

## ES

El Xpace **Objeto** vive en el selector Xpaces de admira.store, paralelo a **Computer**. Su primer local es **Stream Deck**: el gemelo 3D del Elgato Stream Deck XL físico conectado a METAHUMAN.

| Pieza | Dónde | Qué hace |
|---|---|---|
| Gemelo | `objeto/stream-deck/index.html` | Three.js 0.160 · `RoundedBoxGeometry` · chasis mate + 8×4 keycaps claros · stand cuña ~42° · cable USB · OrbitControls. Mural Indiana Jones en cols 2–6 (índices 1–5). |
| Fotos | `indiana-jones.png` · `metahuman-desk.jpg` · `perfil-metahuman.png` | Mural LCD, foto frontal METAHUMAN, **perfil** (slab + stand hueco + glow lateral) — referencia v2. |
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
- Keycaps cuadrados claros/glossy (`MeshPhysicalMaterial` + clearcoat/transmission) con LCD inset; glow lateral en columnas activas.
- Marca blanca Elgato (círculo-E) + «STREAM DECK» en bezel superior.
- Stub de cable USB-C saliendo del dorso bajo el stand.
- Sombra de contacto suave + cámara ¾ que enseña perfil del stand y mural.

### Estado

- **Entregado:** gemelo 3D v2 en simulación («Gemelo 3D · sim»), selector Objeto → Stream Deck, docs/help/MCP snippet, perímetro público `/objeto/`.
- **Pendiente:** puente USB / player para emitir demos de admira.tv en las teclas reales (sin bridge todavía).

Canonical: https://www.admira.store/objeto/stream-deck/

## EN

The **Objeto** (Object) Xpace sits in the admira.store Xpaces selector, parallel to **Computer**. Its first venue is **Stream Deck**: a 3D twin of the physical Elgato Stream Deck XL on METAHUMAN.

| Piece | Where | Role |
|---|---|---|
| Twin | `objeto/stream-deck/index.html` | Three.js 0.160 · `RoundedBoxGeometry` · matte chassis + 8×4 clear keycaps · ~42° wedge stand · USB stub · OrbitControls. Indiana Jones mural on cols 2–6 (indices 1–5). |
| Photos | `indiana-jones.png` · `metahuman-desk.jpg` · `perfil-metahuman.png` | LCD mural crop, METAHUMAN desk front ref, **side profile** (slab + hollow wedge + side glow) — v2 silhouette reference. |
| Selector | `assets/objeto-xpace.mjs` + `admira-xp/scripts/project-selector.mjs` | Xpace `objeto` → venue `stream-deck`. Embed iframe under the top bar (Carlos: stay in the shell). Direct URL `/objeto/stream-deck/` still works. |

### Device

- Elgato Stream Deck XL · VID_0FD9 · PID_006C · serial **CL37J1A02733**
- 32 LCD keys · 8 columns × 4 rows · Host: METAHUMAN

### Silhouette v2 (METAHUMAN side photo)

Carlos: v1 “looks nothing like it.” Procedural remodel (no Blender):

- Thin rounded chassis, **matte** black plastic — not chrome brick.
- Separate **magnetic wedge** stand with hollow triangular / L gap; face tilt ≈ **42°** (was ~18°).
- Clear/glossy raised keycaps with inset LCDs; side glow on active mural columns.
- White Elgato mark + “STREAM DECK” on top bezel; USB-C cable stub under the stand.
- Soft contact shadow; default ¾ camera shows stand profile and readable mural.

### Status

- **Shipped:** 3D twin v2 in simulation, Objeto → Stream Deck selector, docs/help/MCP snippet, public perimeter `/objeto/`.
- **Pending:** USB / player bridge to push admira.tv demos onto the real keys.

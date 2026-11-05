# Objeto · Stream Deck XL · gemelo 3D

Proyecto dirigido por **Woz** (Consejo AdmiraNext) para **Carlos** (AdmiraNeXT). Arrancado el 5 de noviembre de 2026.

## ES

El Xpace **Objeto** vive en el selector Xpaces de admira.store, paralelo a **Computer**. Su primer local es **Stream Deck**: el gemelo 3D del Elgato Stream Deck XL físico conectado a METAHUMAN.

| Pieza | Dónde | Qué hace |
|---|---|---|
| Gemelo | `objeto/stream-deck/index.html` | Three.js · chasis + 8×4 teclas LCD · OrbitControls. Mural Indiana Jones en cols 2–6 (índices 1–5). |
| Foto | `objeto/stream-deck/indiana-jones.png` · `metahuman-desk.png` | Recorte del mural LCD y foto de referencia del escritorio METAHUMAN. |
| Selector | `assets/objeto-xpace.mjs` + `admira-xp/scripts/project-selector.mjs` | Xpace `objeto` → venue `stream-deck`. Embed iframe bajo la barra (Carlos: no salir del shell). URL directa `/objeto/stream-deck/` válida. |
| Combos | `assets/xpace-combos.mjs` | Mismos tres combos en páginas de local; Objeto aparece junto a Computer. |

### Dispositivo

- Elgato Stream Deck XL · VID_0FD9 · PID_006C · serial **CL37J1A02733**
- 32 teclas LCD · 8 columnas × 4 filas
- Host: METAHUMAN (escritorio Carlos)

### Estado

- **Entregado:** gemelo 3D en simulación («Gemelo 3D · sim»), selector Objeto → Stream Deck, docs/help/MCP snippet, perímetro público `/objeto/`.
- **Pendiente:** puente USB / player para emitir demos de admira.tv en las teclas reales (sin bridge todavía).

Canonical: https://www.admira.store/objeto/stream-deck/

## EN

The **Objeto** (Object) Xpace sits in the admira.store Xpaces selector, parallel to **Computer**. Its first venue is **Stream Deck**: a 3D twin of the physical Elgato Stream Deck XL on METAHUMAN.

| Piece | Where | Role |
|---|---|---|
| Twin | `objeto/stream-deck/index.html` | Three.js chassis + 8×4 LCD keys · OrbitControls. Indiana Jones mural on cols 2–6 (indices 1–5). |
| Photo | `objeto/stream-deck/indiana-jones.png` · `metahuman-desk.png` | LCD mural crop and METAHUMAN desk reference. |
| Selector | `assets/objeto-xpace.mjs` + `admira-xp/scripts/project-selector.mjs` | Xpace `objeto` → venue `stream-deck`. Embed iframe under the top bar (Carlos: stay in the shell). Direct URL `/objeto/stream-deck/` still works. |

### Device

- Elgato Stream Deck XL · VID_0FD9 · PID_006C · serial **CL37J1A02733**
- 32 LCD keys · 8 columns × 4 rows · Host: METAHUMAN

### Status

- **Shipped:** 3D twin in simulation, Objeto → Stream Deck selector, docs/help/MCP snippet, public perimeter `/objeto/`.
- **Pending:** USB / player bridge to push admira.tv demos onto the real keys.

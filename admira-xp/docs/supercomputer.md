# Supercomputer · gemelo digital

Proyecto dirigido por **Woz** (Consejo AdmiraNext). Arrancado el 4 de noviembre de 2026.

La **Supercomputer** es la «store» de METAHUMAN, el PC Windows de Carlos: sus 7 ventiladores Lian Li
UNI FAN TL LCD tienen cada uno una pantalla redonda de 400×400 y un anillo RGB. El gemelo
(`https://www.admira.store/supercomputer/`, con sesión) enseña la máquina en 3D con lo que pinta cada
pantalla en vivo, y manda el modo de las pantallas y la iluminación.

## Piezas

| Pieza | Dónde | Qué hace |
|---|---|---|
| Gemelo | `supercomputer/index.html` (este repo) | Three.js + paneles. Lee `/supercomputer/api/estado` cada 2,5 s y las miniaturas cada 3 s. |
| API | `functions/supercomputer/api/[[path]].js` (este repo) | Comprueba la sesión (gemelo) o deja pasar la clave Bearer de la máquina (`POST /maquina`) y reenvía al Worker. |
| Nube | Worker `supercomputer` (`supercomputer.csilvasantin.workers.dev`), código en `csilvasantin/admira-tv` · `tools/player-ventiladores/nube/` | Un Durable Object guarda lo deseado (SQLite) y lo último que informó la máquina (memoria). Sin escrituras de KV. |
| Puente | `csilvasantin/admira-tv` · `tools/player-ventiladores/` en METAHUMAN | Pinta cada pantalla en Chrome sin ventana y la manda por USB; gobierna la luz; cada 3 s envía informe y miniaturas y recibe lo deseado. |

La máquina entra por `www.admira.store/supercomputer/api/maquina` y no por `*.workers.dev`, que los ISP
españoles bloquean a ratos. El Worker solo acepta dos claves: la de la máquina (`MAQUINA_KEY`) y la de
esta función (`PROXY_KEY` = secreto de Pages `SUPERCOMPUTER_PROXY_KEY`). Ninguna llega al navegador.

## Modos de las pantallas

| Modo | También | Qué hace |
|---|---|---|
| Independiente | independent, autónomo | Cada ventilador es un player de admira.tv (`supercomputer-ventilador-1…7`) con su pieza fijada por `?ids=`. |
| Repetir | repeat, espejo | Un solo player (`supercomputer-ventiladores`) cuyos fotogramas van a los 7 a la vez. |
| Extender | extend, adaptar, adapt, estirar | Una pieza estirada sobre los 7 como un mural. Ajuste cubrir/estirar/contener y nº de columnas. |
| Sincro | sync, relevo | La pieza pasa de un ventilador al siguiente cada `paso` segundos sin reiniciarse; con varias piezas desfilan en carrusel. |
| Identificar | identify | Cada pantalla enseña su número, su puerto y su posición, para ubicar los ventiladores en la caja. |

Extender, sincro e identificar los pinta la página de escena del puente con un reloj común (no son
players de admira.tv). Circuito de admira.tv: `supercomputer`.

**Disposición física** (confirmada por Carlos el 4-nov-2026 con Identificar y una foto de METAHUMAN
vista desde la ventana principal): 1-2-3 en columna en el panel de cristal de la derecha (delante), con el
1 arriba y las pantallas hacia dentro; 4-5-6 en el suelo, caras arriba, con el 4 detrás (izquierda) y el 6
delante (derecha); 7 trasero, arriba a la izquierda junto a la placa. Arriba, el radiador del AIO con tres
ventiladores sin pantalla. Es la constante `DISPOSICION` del gemelo (ventana principal = +x, placa = −x,
delante = −z).

## Iluminación

Efectos del controlador UNI FAN TL: apagado, fijo, arcoíris, respirar (por puerto), ciclo, meteoro, ola y
carrera; color, brillo 0–4, velocidad 0–4, color propio por ventilador y «la luz sigue al vídeo» en sincro
(solo brilla el ventilador que tiene la pieza). El anillo del gemelo imita el efecto; no es una medida.

## Contrato de la API

| Método | Ruta | Quién | Cuerpo / respuesta |
|---|---|---|---|
| GET | `/supercomputer/api/estado` | sesión | `{deseado, informe, enLinea, visto}` |
| GET | `/supercomputer/api/miniatura/<1-7>.jpg` | sesión | JPEG 400×400, calidad 40 (unos 5–15 KB), cada 3 s |
| POST | `/supercomputer/api/escena` | sesión, misma web | `{modo, ids?, piezas?, paso?, ajuste?, columnas?, orden?}` (`modo` también `identificar`) |
| POST | `/supercomputer/api/luz` | sesión, misma web | `{efecto, color, brillo, velocidad, sigueVideo, ventiladores?}` |
| POST | `/supercomputer/api/maquina` | Bearer `sc_…` | `{informe, miniaturas}` → `{deseado}` |

Una sesión de solo lectura ve el estado pero no cambia nada (403).

## Ayuda y MCP

Sección `#supercomputer` en la ayuda web (`admira-xp/help.html`), el tutorial (`help/index.html`) y la
ayuda CLI (`help/cli/index.html`); clave `supercomputer` en `mcp/manifest.json` y `mcp/funcionalidades.json`,
párrafo en `mcp/llms.txt` y tarjeta en `mcp/`. No hay herramienta MCP que cambie escena o luz: se usa el
gemelo o la API con sesión.

## Pendiente

- Servidor MCP real (`csilvasantin/xpaceos-mcp`, `mcp.admira.store`): repositorio privado; hace falta acceso
  a GitHub desde la máquina que lo despliegue.
- Registro en Yokup: hace falta una credencial individual o la clave de flota (`https://yokup.com/mcp`).
- El reloj de METAHUMAN iba 48 s adelantado (servicio de hora de Windows parado). La nube y el gemelo lo
  compensan; arreglarlo en Windows lo hace Carlos.

---

# Supercomputer · digital twin (EN)

Project led by **Woz** (AdmiraNext Council). Started on 4 November 2026.

The **Supercomputer** is the "store" of METAHUMAN, Carlos's Windows PC. Each of its 7 Lian Li UNI FAN TL LCD
fans has a round 400×400 screen and an RGB ring. The twin (`https://www.admira.store/supercomputer/`,
session required) shows the machine in 3D with every screen live, and controls screen modes and lighting.

Modes: **Independent** (each fan is an admira.tv player), **Repeat** (one player on all 7), **Extend /
Adapt** (one piece stretched across the 7 as a wall) and **Sync** (the piece moves from fan to fan without
restarting; several pieces form a carousel). Lighting: off, static, rainbow, breathing (per port), cycle,
meteor, wave and racing; colour, brightness, speed, per-fan colour and "light follows video" in sync.

The machine reaches the cloud through `www.admira.store/supercomputer/api/maquina` (not `*.workers.dev`,
which Spanish ISPs block at times). The `supercomputer` Worker (Durable Object, no KV writes) only accepts
the machine key and this function's proxy key; neither reaches the browser. API contract: see the table above.
Identify mode shows each fan's number, port and position on its own screen. Confirmed layout: 1-2-3 in a
column on the glass side (1 on top), 4-5-6 in the bottom row (6 at the front) and 7 at the rear.
Help (web, tutorial, CLI) and the MCP catalog (`mcp/`) describe it. Pending: the real MCP server
(`xpaceos-mcp`, private repository) and the Yokup record (needs a Yokup credential).
Simulation mode («Solo gemelo · simulación», `localStorage` key `admira.supercomputer.sim`): a checkbox under the status badge on `/supercomputer/` and `/supercomputer/metahuman/` lets the twin apply scene/lighting locally (toast «Aplicado en gemelo (sim)», yellow badge «Gemelo en simulación · PC apagado», placeholder thumbnails) while METAHUMAN is off; the cloud call is still attempted but never blocks.

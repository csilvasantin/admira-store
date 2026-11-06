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
| Secuencia (solo PC-COCINA) | sequence, secuencial, cadena | Un vídeo entero en el ventilador 1, luego entero en el 2… hasta el 7, y vuelta a empezar. La luz acompaña siempre al vídeo: solo brilla el que lo tiene (si la luz general está apagada o en respirar, se usa fijo con su color). La duración (`duracion`, s) la mide la página de escena al cargar el vídeo y se la pasa al puente (`POST /duracion`); hasta entonces se usa `paso`. |
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

## PC-COCINA (copia independiente, 6-nov-2026)

Mismo diseño que METAHUMAN, con todas las piezas separadas para que no se pisen:

| Pieza | METAHUMAN | PC-COCINA |
|---|---|---|
| Gemelo | `/supercomputer/` y `/supercomputer/metahuman/` | `/supercomputer/pc-cocina/` |
| API (Pages) | `/supercomputer/api/*` | `/supercomputer/pc-cocina/api/*` |
| Ruta pública en el perímetro | `/supercomputer/api` | `/supercomputer/pc-cocina/api` (`functions/_perimetro.js`) |
| Worker | `supercomputer` | `supercomputer-pc-cocina` (mismo `worker.mjs`, otro nombre y otro Durable Object) |
| Secreto de Pages | `SUPERCOMPUTER_PROXY_KEY` | `SUPERCOMPUTER_PC_COCINA_PROXY_KEY` |
| Clave de la máquina | `~/.admira_supercomputer_key` | `~/.admira_supercomputer_pc_cocina_key` |
| Pantallas de admira.tv | `supercomputer-ventilador(es)…` | `supercomputer-pc-cocina-ventilador(es)…` |

Estado verificado el 6-nov-2026: Worker desplegado, secretos cargados (`MAQUINA_KEY`, `PROXY_KEY` y el de Pages),
y el puente de PC-COCINA (`AdmiraNeXT\player-ventiladores-pc-cocina`) emitiendo a los 7 ventiladores e informando
a su Worker por `www.admira.store/supercomputer/pc-cocina/api` (ruta pública publicada en el PR #189). El puente
arranca solo al iniciar sesión (tarea «Admira Player Ventiladores», que para L-Connect antes de emitir).

**Disposición de PC-COCINA** (foto de Carlos del 6-nov-2026, vista desde el cristal delantero): placa base al
fondo; a su izquierda, los conectores de corriente con el **ventilador 1** encima (el único del puerto 0); a la
derecha, **5-6-7** en vertical, de abajo arriba (el 5 junto al 4); en el suelo, **2-3-4** horizontales, de izquierda a derecha. Los 7
tienen pantalla y vídeo (no hay ventilador de temperatura). Confirmado el 6-nov con Identificar (webcam de
PC-COCINA y Carlos). Es la constante `DISPOSICION`
de `supercomputer/pc-cocina/index.html`, con los números del puente. La cadena del puerto 2 va de arriba abajo, así que el
puente de PC-COCINA la renumera en su `config.json` (`"numeracion": {"2:0": 7, "2:2": 5}`, 6-nov por la tarde, a petición de
Carlos): así las secuencias y el relevo suben del 4 al 5, 6 y 7 sin saltar. Comprobado con Identificar y la webcam.

### PC-COCINA · luces de la caja y audio (6-nov-2026)

**Luces de la caja** (`luz.dispositivos`, mismas claves en el puente, la nube y el gemelo; `escena.mjs` ·
`normalizarLuz` / `luzDispositivo`). Sin luz propia, cada una sigue a la luz general, como los ventiladores; no
sigue el relevo de sincro/secuencia, que es de los ventiladores.

| Clave | Alias | Qué es | Control |
|---|---|---|---|
| `grafica` | gpu, pcie | Cable Strimer Plus de la gráfica | USB `0CF2:A200`, puertos 6-11 (canal 2) |
| `placa` | atx, 24pin | Cable Strimer Plus de 24 pines de la placa | USB `0CF2:A200`, puertos 0-5 (canal 1) |
| `superiores` | arriba, radiador, techo, top | Los 3 ventiladores del radiador (arriba, sin pantalla) | AIO Galahad II Trinity, USB `0416:7373`, orden `0x85` |
| `bomba` | pump, aio | Los aros de la bomba de la AIO | Galahad II Trinity, orden `0x83` (los dos aros) |
| `memoria` | ram, dram | 2 × DDR5 Lexar `LD5U16G72C34LA` (controlador ENE) | **Sin control**: va por SMBus y el puente no tiene driver para ese bus |

Los puertos de cada cable se comprobaron con la webcam de PC-COCINA (apagando un canal cada vez). El protocolo
del Strimer es el de `sgtaziz/lian-li-linux` (MIT, `strimer_plus.rs`): informe 0xE0, modo/velocidad/brillo por
característica y 27 colores por puerto en orden R, B, G. El puente informa en `informe.dispositivos` si controla
cada luz y, si no, por qué (`motivo`); el gemelo lo enseña y bloquea los controles de la memoria.

Galahad II Trinity (sgtaziz/lian-li-linux, `galahad2_trinity.rs`, MIT): informe 0x01 de 64 bytes; solo luz y lectura de RPM
(saludo `0x81`), nunca velocidades. Comprobado el 6-nov con la webcam: con `0x85` en rojo se tiñe de rojo el techo de la caja,
y con `0x83` en azul, el aro de la bomba; RPM leídas: radiador ~1380-1440, bomba ~2500 (`informe.dispositivos.*.rpm`).
La placa (ASRock Polychrome USB `26CE:01A2`) tenía todas sus zonas en arcoíris, pero apagarla no cambió nada visible: la
memoria no va por ella (sigue siendo SMBus) y se dejó como estaba.

**Contenidos** (gemelo, 6-nov por la tarde): las piezas salen del índice completo del Stock
(`https://stock.admira.store/stock/index.json`, el mismo de `functions/admira-xp/media-catalog.js`; `stock/list` se corta en
200), solo vídeo e imagen y sin las ocultas. Encima de las piezas hay un filtro por tag (con las piezas de cada uno; se
recuerda en el navegador) y el selector de pieza enseña la portada (`thumbnail`/`poster`) con buscador por título, #número o
tag. Content: full Stock index, tag filter above the pieces and a piece picker with covers and search.

**Audio** (`escena.audio`, `escena.mjs` · `normalizarAudio`): `{ ventilador, salida, volumen }`. Como mucho suena
un ventilador (`0` = ninguno; en Repetir hay un solo canal y cualquier número es «con sonido»). Solo su Chrome
arranca sin `--mute-audio`, con `muted=0&volume=` en el canal (contrato del player) o `audio=1&volumen=` en la
página de escena; los demás van callados. `salida` es el nombre del dispositivo de Windows (vacío = el
predeterminado); la página lo busca por nombre y usa `setSinkId`, para lo que el puente concede el permiso de
micrófono solo a ese Chrome y solo si se pidió una salida concreta. `informe.audio` trae `suena` (qué player
suena) y `salidas` (los puntos de reproducción de Windows).

Estado verificado el 6-nov-2026 en PC-COCINA: el puente controla los dos cables (gráfica en rojo/arcoíris y 24
pines en azul/verde, vistos con la webcam) y suena solo el ventilador 1 por la salida predeterminada (micrófono
de la webcam: −36 dBFS con sonido frente a −47 dBFS silenciado). Worker `supercomputer-pc-cocina` desplegado el
6-nov (versión `546dd9a0`) con un Durable Object nuevo, `pc-cocina-2`: el anterior siguió con el código viejo tras
desplegar, como el de la mañana. Comprobado con peticiones reales por `/supercomputer/pc-cocina/api`: guarda
`escena.audio` (el puente aplicó el sonido del ventilador 1 llegado del gemelo) y `luz.dispositivos` (el alias `gpu`
llega como `grafica`). **Tras cada despliegue, comprobar la marca `luces: 'con-dispositivos'` en `/estado`** (la
contesta el Durable Object; `/salud` solo prueba el Worker) y, si falta, pasar a un DO con otro nombre. Ventiladores de arriba y bomba: el puente los controla desde el 6-nov por la tarde, y la nube guarda su luz propia desde el
Worker `833a1aef` con el Durable Object `pc-cocina-3` (el `pc-cocina-2` siguió con el código viejo tras desplegar, como los
anteriores; marca `luces: 'con-galahad'` en `/estado`). Comprobado con peticiones reales: `radiador` y `pump` llegan como
`superiores` y `bomba`. Pendiente: la memoria
necesita un driver de SMBus (p. ej. OpenRGB con PawnIO) y está sin decidir.

PC-COCINA case lights and audio (6-Nov-2026): `luz.dispositivos.{grafica,placa,memoria}` follow the main light
unless they have their own. Both Strimer Plus cables (USB `0CF2:A200`; ports 6-11 graphics card, 0-5 24-pin) are
controlled; the memory (2× Lexar DDR5, ENE) is not yet (SMBus, no driver), so it keeps its factory rainbow and
the twin locks its controls. `escena.audio { ventilador, salida, volumen }`: at most one fan plays sound (0 =
none); only its Chrome runs without `--mute-audio`, the output is chosen by Windows device name (empty = default)
through `setSinkId`. Worker `supercomputer-pc-cocina` deployed on 6-Nov (version `546dd9a0`) on a fresh Durable
Object `pc-cocina-2` (the previous one kept the old code after deploying); verified with real requests. After each
deploy, check the `luces: 'con-dispositivos'` marker on `/estado` (answered by the Durable Object). Pending: memory
control needs an SMBus driver. Top fans (radiator) and pump: Galahad II Trinity AIO (USB `0416:7373`,
`0x85` / `0x83`), `luz.dispositivos.superiores` / `bomba`; deployed with Worker `833a1aef` on a fresh Durable Object
`pc-cocina-3` (marker `luces: 'con-galahad'`), verified with real requests.

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

Sim pseudostream cache: with «Solo gemelo · simulación» on, each fan (3D, strip, detail) shows the real piece from `api.admira.store/stock/list` (`thumbnail` poster first, then `url` video/image) downloaded **once** into Cache API `admira-sc-sim-v1` (key = asset url) with an on-screen progress bar, then replayed from cache («✓ en caché»); it is gemelo-only, never PC bridge frames, and the SIM title card remains only as fallback when no media URL exists.

PC-COCINA (6-nov-2026) is an independent copy with the same design: twin `/supercomputer/pc-cocina/`, API `/supercomputer/pc-cocina/api/*` (public in the perimeter so its bridge can `POST /maquina` with its Bearer key), Worker `supercomputer-pc-cocina`, Pages secret `SUPERCOMPUTER_PC_COCINA_PROXY_KEY`, machine key `~/.admira_supercomputer_pc_cocina_key` and admira.tv screens `supercomputer-pc-cocina-ventilador(es)…`. Verified: Worker deployed, secrets set, bridge emitting to its 7 fans and reporting to its Worker. The bridge starts on login (scheduled task that stops L-Connect first). Layout (photo, 6-nov-2026, seen through the front glass): motherboard at the back; fan 1 alone on the back wall left of the board, above the power connectors; 5-6-7 vertical on the right wall, top to bottom; 2-3-4 horizontal on the floor, left to right. All 7 show video. Confirmed on 6-nov with Identify. PC-COCINA adds Sequence mode (sequence, secuencial): one video plays in full on fan 1, then on fan 2… up to 7, and loops; the light always follows it, so only the fan playing it is lit. The scene page measures the duration (duracion, s) and posts it to the bridge (POST /duracion). Its Worker runs on its own Durable Object (pc-cocina).

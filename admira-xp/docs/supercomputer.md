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

Extender y sincro los pinta la página de escena del puente con un reloj común (no son players de
admira.tv). Circuito de admira.tv: `supercomputer`.

## Iluminación

Efectos del controlador UNI FAN TL: apagado, fijo, arcoíris, respirar (por puerto), ciclo, meteoro, ola y
carrera; color, brillo 0–4, velocidad 0–4, color propio por ventilador y «la luz sigue al vídeo» en sincro
(solo brilla el ventilador que tiene la pieza). El anillo del gemelo imita el efecto; no es una medida.

## Contrato de la API

| Método | Ruta | Quién | Cuerpo / respuesta |
|---|---|---|---|
| GET | `/supercomputer/api/estado` | sesión | `{deseado, informe, enLinea, visto}` |
| GET | `/supercomputer/api/miniatura/<1-7>.jpg` | sesión | JPEG 160×160 |
| POST | `/supercomputer/api/escena` | sesión, misma web | `{modo, ids?, piezas?, paso?, ajuste?, columnas?, orden?}` |
| POST | `/supercomputer/api/luz` | sesión, misma web | `{efecto, color, brillo, velocidad, sigueVideo, ventiladores?}` |
| POST | `/supercomputer/api/maquina` | Bearer `sc_…` | `{informe, miniaturas}` → `{deseado}` |

Una sesión de solo lectura ve el estado pero no cambia nada (403).

## Pendiente

- Ayuda web, tutorial, CLI y MCP (`mcp/`, `xpaceos-mcp`) aún no describen la Supercomputer.
- La disposición física de los ventiladores en el 3D (`DISPOSICION` en la página) es una suposición
  razonable: columna lateral (puerto 0), fila inferior (puerto 1) y trasero (puerto 2). Falta confirmarla.

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
Pending: web help, tutorial, CLI and MCP entries, and confirming the fans' physical layout in the 3D view.

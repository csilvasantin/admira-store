# www.xpaceos.com

Sitio público de **XpaceOS** — el sistema operativo del retail físico de ADmiraNeXT.

Tres capas integradas:

1. **PixerIA** — creación de contenido con IA (audio, música, imagen, video).
2. **Admira XP** — distribución signage sobre Gemelo Digital del espacio físico.
3. **OmniPublicity** — marketplace RTB sobre cada hueco visible.

Corriendo sobre **Lenovo edge** + **Nvidia GPU**.

## Live

- Producción: https://www.xpaceos.com
- Demo del Gemelo Digital (Xtanco): https://csilvasantin.github.io/01.-AdmiraXperience-Game/

## Eventos

- **Shoptalk Europe 2026** · Fira Barcelona · 9–11 de junio · partner showcase Lenovo × Nvidia

## Stack

- HTML estático servido por GitHub Pages
- Custom domain `www.xpaceos.com` vía CNAME
- Métricas live consumidas desde workers Cloudflare (`pixer-eleven`) y Tailscale Funnel (`suno-local`)

## Editar

Es un único `index.html`. Edita y haz push — GitHub Pages publica en menos de 1 minuto.

## Personas y robots / People and robots

Good, Better y Best comparten mapa físico, cuerpo completo y recorridos barridos. Un paso cerrado produce espera; People está ON por defecto desde el 8-oct-2026: las personas caminan al abrir cualquier Xpacio. Matrix aplica el mismo contrato a sus actores heredados, conservando la fotografía y la proyección. La conexión con robots físicos, stock y telemetría IoT sigue pendiente.

Good, Better and Best share physical geometry, full-body clearance and swept routes. Closed passages produce waiting; People is ON by default since 8 Oct 2026: people walk as soon as any Xpace opens. Matrix applies the same contract to legacy actors while retaining its photograph and projection. Physical robot, stock and IoT telemetry binding remains pending.

[Guía y contrato ES/EN](admira-xp/docs/actor-collision.md) · [Tutorial](https://www.xpaceos.com/help/#actor-collision) · MCP help topic `actor-collision`.

## Comprobar paso / Check passage

ES: Distribuir incorpora Comprobar paso: en Cuerpo elige Persona o Unitree y pulsa Comprobar. Comprueba una ruta completa desde la entrada hasta la zona de acceso del mueble seleccionado, o el centro sin selección, con el mapa físico de Good, Better y Best y radios de 0,72 y 0,52 celdas respectivamente. La puerta se considera abierta virtualmente; la escena no cambia. Paso libre muestra la ruta y el volumen corporal; Paso bloqueado identifica los bloqueos implicados, sin prometer un conjunto mínimo. Seleccionar un mueble bloqueador lo selecciona para editar conservando el destino. Ver mapa de dureza muestra la superposición. La vista previa válida, mover, girar, escalar, guardar, bloquear, eliminar, añadir, Deshacer y cambios de geometría recalculan el diagnóstico; una vista previa inválida conserva la última pose válida. Cerrar limpia la comprobación. No mueve actores ni muebles, no abre la puerta real, no guarda ni activa People. Desde Good/Better/Best se abre el mismo editor Better mediante Mobiliario → Distribuir o /cli distribuir. Cafebrería sin portal operativo muestra que la entrada no está definida; no presenta un falso paso libre. Implementado A: este diagnóstico local. Pendientes B y C: Mostrar ITIL en escena e IoT piloto, además de la vinculación física IoT. Se conservan IDs, marca, historial CLI e inventario. No añade herramienta MCP remota.

EN: Distribute includes Check passage: under Body choose Person or Unitree and press Check. It checks a complete route from the entrance to the selected furniture access area, or the centre without selection, using the physical map of Good, Better and Best and radii of 0.72 and 0.52 tiles respectively. The door is virtually open; the scene is unchanged. Passage clear shows the route and body volume; Passage blocked identifies the implicated blockers, without promising a minimum set. Select chooses a furniture blocker for editing while retaining the destination. Show hardness map displays the overlay. Valid previews, move, rotate, scale, save, lock, delete, add, Undo and geometry changes recompute the diagnostic; an invalid preview retains the last valid pose. Closing clears the check. It does not move actors or furniture, open the actual door, save or enable People. Good/Better/Best open the same Better editor through Furniture → Distribute or /cli distribute. Cafebrería without an operational portal reports an undefined entrance; it never shows a false clear passage. Delivered A: this local diagnostic. Pending B and C: Show ITIL in scene and an IoT pilot, plus physical IoT binding. IDs, brand, CLI history and inventory are retained. No new remote MCP tool.

[Guía y contrato ES/EN](admira-xp/docs/check-passage.md) · [Tutorial](https://www.xpaceos.com/help/#check-passage) · MCP 2.12.29: `help({"topic":"check-passage"})` / `help({"topic":"comprobar-paso"})`, recurso existente `xpaceos://help`; 35 herramientas.

# Cliente activo / Active client

**ES** (Carlos, 4-oct-2026; mismas reglas que Pixeria)

- Por defecto el cliente es **Admira** y Admira lo ve **todo**. No hay selector visible.
- `/marca <cliente>` en ⌘ Experto (o en la consola del gemelo) o `?cliente=<id>` en la URL filtra las listas de Xpacios: gemelos de la portada (`index.html`), `xpacios/index.html` (destacados y Mis Xpacios), `inventario/` (enlaces Cafebrería y Starbucks) y la red de tiendas del gemelo (`admira-xp`, STORE_LIST). Se ve lo de ese cliente más lo genérico de Admira.
- `/marca todas` lista los clientes; `/marca off` vuelve a Admira (y apaga la marca blanca, como siempre). Si el cliente también es marca del catálogo de marca blanca, `/marca <id>` la aplica además.
- Fuente: `assets/xpace-cliente.js` (API `window.XpaceCliente`, evento `xpace:cliente`). Se descarga solo con `?cliente=`, un cliente recordado o al usar `/marca <cliente>`: una visita normal no carga nada nuevo.
- Clientes: `https://www.admiranext.com/api/clientes`. Mapeo editable: `/data/clientes-mapeo.json` (asignaciones, data-cliente, marcas = primer tramo del tipo, patrones, rutas). Si casan varios clientes, la ficha solo se ve con Admira. No se borra nada.
- Pendiente: herramienta MCP en `xpaceos-mcp` (siguiente tramo).

**EN**

- By default the client is **Admira**, which sees **everything**; no selector is shown.
- `/marca <client>` in ⌘ Expert (or the twin console) or `?cliente=<id>` in the URL filters the Xpace lists (homepage twins, Xpaces, inventory links, twin store network): that client's items plus Admira generic ones. `/marca todas` lists clients; `/marca off` returns to Admira.
- Source `assets/xpace-cliente.js`; editable mapping `/data/clientes-mapeo.json`; loaded only when a client is requested.
- Pending: MCP tool in `xpaceos-mcp` (next slot).

# Cola del quiosco · clave de barra en el gemelo / Kiosk queue · counter key in the twin

Carlos, 7-oct-2026. Fuente: `admira-xp/scripts/totem-kiosko.js`. Pruebas: `tests/cola-barra-clave.test.mjs` (relé simulado).

## ES

La barra de la cola de la demo Starbucks está cerrada. El relé `https://mcp-ainimation.admira.store/cola/*` solo acepta escrituras con la clave de barra. `POST /cola/avanzar` sin la cabecera `x-cola-clave: <clave de barra>` devuelve 401. Las lecturas siguen siendo públicas: el sondeo de `/cola/estado` cada 3 s sigue funcionando, aunque ahora solo devuelve el nombre de pila. El aviso «NOMBRE, tu pedido Starbucks está preparado» sigue funcionando con ese nombre; si el pedido no tiene nombre, el aviso dice «Pedido A015, …». Las lecturas nunca llevan la clave.

**Dónde vive la clave.** Solo en el dispositivo del gemelo, en `localStorage` con la clave `xpace:cola-barra`. Cada origen es un almacén distinto: www.xpaceos.com, xpaceos.com y www.admira.store tienen cada uno el suyo. La clave nunca se escribe en el repositorio ni se queda en la URL.

**Cómo se guarda (cualquiera de las tres formas):**

1. **Panel «Pedidos · TPV»:** cuando la barra está cerrada aparece un aviso con un campo de contraseña. Escribe la clave y pulsa Guardar. Es la forma recomendada, porque la clave no se ve en la consola.
2. **CLI del gemelo:** `/totem clave <clave>`. La respuesta solo enseña `••••` y los cuatro últimos caracteres. La orden se tapa en el historial del CLI (↑/↓) y en el log de sesión, que guardan `/totem clave` sin la clave. La consola sí enseña la línea tecleada mientras está abierta.
3. **Aprovisionar una vez:** abre el gemelo con `#cola-barra=<clave>` al final de la URL, por ejemplo `https://www.xpaceos.com/admira-xp/?loc=alsea-sbux-021#cola-barra=<clave>`. Se guarda y el fragmento desaparece de la URL al instante, aunque el resto del fragmento se conserva. Con `#cola-barra=off` se borra. Los fragmentos no viajan al servidor.

**Órdenes:**

- `/totem clave <clave>`: guarda la clave en este dispositivo.
- `/totem clave`: dice si hay clave (`clave de barra: guardada ••••1234`) sin enseñarla y abre el panel con el campo.
- `/totem clave off`: borra la clave de este dispositivo.
- `/totem`: además de poner el quiosco, dice si hay clave guardada.
- `/totem reset` o «↺ Reset»: cierra (`recogido`) los pedidos abiertos con `x-cola-clave`.

**Avisos del Reset.** Antes, el Reset fallaba en silencio. Ahora el aviso sale en el panel «Pedidos · TPV», que se abre solo, y en un toast:

- Sin clave y con `/cola/estado` → `acceso.barra = "cerrada"`: no se hace ningún POST. El aviso dice «La barra está cerrada: guarda la clave con /totem clave <clave> (o aquí abajo) y vuelve a pulsar ↺ Reset».
- Con 401 o 403 y sin clave: el mismo aviso. Con una clave guardada: «La barra está cerrada y no acepta la clave guardada (401): guarda la buena con /totem clave <clave>». En ese caso no se vacía la lista local ni se dice «cola a cero».
- Si el relé no responde: «El relé de la cola no responde: el Reset no se ha hecho».

Evento `xpace:cola-reset`: `detail.aviso` vale `sin-clave`, `rechazada` o `rele` cuando el Reset no se hace. Evento `xpace:cola-barra`: `{guardada}`. API local: `XpaceTotemKiosk.clave.{guardada, mascara, estado, guardar, borrar}` y `XpaceTotemKiosk.aviso()`. La API nunca devuelve la clave.

CORS verificado el 7-oct-2026: el preflight del relé permite `X-Cola-Clave` desde www.xpaceos.com, xpaceos.com, www.admira.store y admira.store.

**Pendiente o fuera de alcance:** la numeración no vuelve a A001, porque eso exige la clave de servicio del relé. La clave tampoco se sincroniza entre dispositivos: hay que guardarla en cada uno.

## EN

The Starbucks demo queue counter is closed. The relay `https://mcp-ainimation.admira.store/cola/*` only accepts writes that carry the counter key. `POST /cola/avanzar` without the header `x-cola-clave: <counter key>` returns 401. Reads stay public: the `/cola/estado` poll every 3 s keeps working, although it now returns only the first name. The “NAME, your Starbucks order is ready” announcement still works with that name; with no name it says “Order A015, …”. Reads never carry the key.

**Where the key lives.** Only on the twin's device, in `localStorage` under `xpace:cola-barra`. Each origin has its own store: www.xpaceos.com, xpaceos.com and www.admira.store are separate. The key is never written to the repository and never stays in the URL.

**How to save it (any of these three):**

1. **“Orders · POS” panel:** when the counter is closed, a warning appears with a password field. Type the key and press Save. This is the recommended way, because the key never shows in the console.
2. **Twin CLI:** `/totem clave <key>`. The reply only shows `••••` and the last four characters. The command is masked in the CLI history (↑/↓) and in the session log, which keep `/totem clave` without the key. The console does show the typed line while it stays open.
3. **One-time provisioning:** open the twin with `#cola-barra=<key>` at the end of the URL. The key is saved and the fragment is removed from the URL immediately; the rest of the fragment is kept. `#cola-barra=off` deletes it. Fragments never reach the server.

**Commands:**

- `/totem clave <key>`: saves the key on this device.
- `/totem clave`: says whether a key is saved, masked, and opens the panel with the field.
- `/totem clave off`: deletes the key from this device.
- `/totem`: also reports whether a key is saved.
- `/totem reset` or “↺ Reset”: closes the open orders with `x-cola-clave`.

**Reset warnings.** These show in “Orders · POS”, which opens by itself, and in a toast. The reset no longer fails silently:

- No key and `acceso.barra = "cerrada"`: no POST is sent and the warning asks you to save the key.
- 401 or 403 with a saved key: “the counter rejects the saved key”. The local list is not cleared.
- Relay down: the warning says the reset was not done.

`xpace:cola-reset` carries `detail.aviso` (`sin-clave`, `rechazada` or `rele`) when the reset is not done.

**Pending or out of scope:** the reset does not restart numbering at A001, which needs the relay's service key. The key does not sync across devices: save it on each one.

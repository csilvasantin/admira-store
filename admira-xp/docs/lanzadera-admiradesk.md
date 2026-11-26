# AdmiraDesk · lanzadera de la zona Terminator

Estado (26-nov-2026): **construida en la rama `jony/lanzadera-admiradesk-20261126`, sin publicar ni activar.** Todo funciona en seco (dry).

Carlos (26-nov-2026): «que el control real (átomos) y el virtual (bits) funcione exactamente igual». La lanzadera controla la zona Terminator de Planeta 7, planta 1. Por un lado, la zona interactiva: AdmiraNeXT01–05 y las verticales 01V, 03V y 05V. Por otro, la sala de reuniones: la Philips 86" y la Pizarra Terminator, en Chrome del MBP14.

## Cómo se consigue la paridad

| Pieza | Dónde | Qué hace |
|---|---|---|
| Fuente única | `control/admiradesk/lanzadera.json` | Define las páginas, teclas, acciones, destinos y la lista blanca de la sala. |
| Núcleo | `control/admiradesk/lanzadera.mjs` | Funciones puras: `validar`, `pulsar` (estado → estado + órdenes), `cara` (32 SVG), `teclaSVG` y `huella`. |
| Servidor | `functions/_lanzadera.js` | Atiende `GET cara`, `GET estado` y `POST pulsar`, y envía las órdenes (o las simula). |
| Gemelo de control | `/control/admiradesk/` y `functions/control/admiradesk/api/*` | Exige login de Google, mismo origen y cuenta con escritura. Firma siempre como `gemelo`. |
| Stream Deck XL | `/objeto/stream-deck/api/lanzadera/*` | Exige la clave Bearer de la máquina, que valida la nube. No tiene CORS. Firma siempre como `fisico`. |
| Estado compartido | Nube de la Supercomputer, `/lanzadera/estado` | Durable Object con revisión: un PUT viejo recibe 409 y la función lo repite. |
| Plugin | admira-tv `tools/streamdeck-bridge/plugin/com.admira.admiradesk.sdPlugin` | Pide la cara cada segundo y manda cada tecla a `pulsar`. No tiene lógica propia. |

Las dos caras piden la misma cara al mismo servidor y mandan la pulsación por la misma ruta. Por eso, lo que se pinta y lo que se ejecuta es idéntico por construcción, y lo que se pulsa en una cara se ve en la otra en ≤ 1 s.

## Páginas

- **Inicio**: da paso a Show Control, Demos, Música, Contenidos, Equipos y Sala Terminator.
- **Show Control**: escenas 0–3, anterior, pausa, play, siguiente, stop, sincro y recorrido (`/contenido` del panel de Planeta).
- **Demos**: Studio, Admirito, Pixeria y Música.
- **Contenidos #streamdeck**: piezas del Stock con la etiqueta `#streamdeck`, con el mismo criterio que `previos.py`. Si hay varios PCs marcados, se envían con `playat` sincronizado; las verticales, con `loop`. Incluye la tecla «Volver al genérico».
- **Equipos 01–05**:
  - Encender, apagar, arrancar player y reiniciar player. Todas piden **doble pulsación** en 4 s y solo actúan sobre los PCs 01–05.
  - Pieza anterior y siguiente, recargar canal, volver al genérico y sincro.
- **Sala Terminator**:
  - Abre en la Philips o la Pizarra un contenido de la lista blanca (`sala.contenidos`) mediante `escucha-sala.py` en el MBP14. La orden es `abrir-<alias>` a `<pantalla>-vigilante`.
  - También anterior, siguiente, pantalla en negro y reanudar.

La fila inferior de las páginas con carrusel lleva ‹, los destinos, «Todos» o «Ambas», y ›.

**No hay ninguna tecla que apunte al Mac Studio ni al Mac Mini.** `validar` lo impide.

## Seguridad

- Mientras Pages no tenga `LANZADERA_EN_VIVO=1`, no sale ninguna orden real. Las órdenes del panel necesitan además `PANEL_URL`, `PANEL_TOKEN` y el service token de Access (`PANEL_ACCESS_ID` y `PANEL_ACCESS_SECRET`). Son secretos de Pages y nunca van en el repo.
- `lanzadera.json` no lleva IPs, MACs ni claves: el repositorio es público.
- El gemelo público de ainimation sigue siendo solo para mirar.

## Pruebas

- `node --test tests/lanzadera.test.mjs`: validación, doble pulsación, paridad por la ruta del físico y la del gemelo, sincronía, login, clave y perímetro.
- `node scripts/lanzadera-local.mjs 8817`: vista local en seco, sin red y con Stock de prueba.
- `node scripts/lanzadera-paridad.mjs <plugin.js> /ruta/capturas`: prueba de punta a punta con el plugin REAL, una app de Stream Deck simulada y el gemelo en Chrome. Hace la misma secuencia en el físico y en el gemelo y comprueba las 32 teclas iguales en cada paso y las mismas órdenes.

## Para activar (pendiente de aprobación)

1. Desplegar la nube (`/lanzadera/estado`) y Pages, con la etiqueta `retorno/` creada antes.
2. En AdmiraNeXT01, con el visto bueno de Neo:
   - Copiar el plugin a `%APPDATA%\Elgato\StreamDeck\Plugins\`.
   - Ejecutar `python admiradesk-pagina.py --instalar`. Esto añade la página «AdmiraDesk» sin tocar las demás.
3. En el MBP14, con el visto bueno de Elon y Trinity, ejecutar `escucha-sala.py --instalar`.
4. Activar `LANZADERA_EN_VIVO=1` cuando Carlos lo apruebe.

---

**EN.** AdmiraDesk is the launcher for Planeta 7's Terminator zone. The Stream Deck XL (atoms) and the control twin (bits) work exactly the same way:

- **One source of truth**: `lanzadera.json`.
- **One state**: a Durable Object with revisions.
- **One action route**: `POST pulsar`.
- **Login and signing**: the twin requires Google login and signs as `gemelo`. The deck uses the machine Bearer key and signs as `fisico`.
- **Safety**: everything runs dry until `LANZADERA_EN_VIVO=1` is set. Power keys require a double press. There are no keys for the Mac Studio or the Mac Mini.
- **Parity tests**: `tests/lanzadera.test.mjs` and `scripts/lanzadera-paridad.mjs`.

## Perímetro (26-nov-2026)

Todo `/control/**` pide login, también los archivos estáticos (`lanzadera.json`, `lanzadera.mjs`, `gemelo.js`, `gemelo.css`): sin sesión, 302 al login (`PRIVATE_ASSET_PREFIXES` en `functions/_perimetro.js`). El XL sigue entrando por `/objeto/stream-deck/api/lanzadera/` con su clave. Pendiente antes de instalar `escucha-sala.py` (admira-tv): hoy lee `lanzadera.json` público, así que necesitará otra fuente con clave o la variable `ADMIRADESK_LANZADERA` apuntando a una copia local.

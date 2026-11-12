# Sección PortAventura / PortAventura section

Neo, 12-nov-2026. `/portaventura/` (pide sesión de admira.store). Una página por espacio, sin anclas.

## ES
| Página | Qué enseña |
|---|---|
| `/portaventura/` | Los 4 espacios y el previo de la zona 2. |
| `/portaventura/store/` | **Foco.** La tienda física Stranger Things (Hawkins Supply Co.): planta 2D, maqueta 3D y recorrido en primera persona (`/portaventura/store/hawkins/`, copia de admira-studio demo/hawkins), pantallas y enlaces a la store y al ecommerce de la DMZ. |
| `/portaventura/restaurante/` | **Foco.** Gemelo 3D de Benny's Burgers (`/portaventura/restaurante/bennys/`, copia de admira-next-web demo/PortAventuraNeXT): carta, pedido, portal y Serie 1984. |
| `/portaventura/hotel/` | Hotel Casa Creel en 3D desde fuera con los 13 personajes alrededor (`/portaventura/hotel/casa-creel/?maqueta=1`), con pantalla de fondo de pie al final de la base, centrada detrás del hotel y de cara al espectador (lo sigue al girar o al moverlo): Stranger Things por defecto; `&tv=<URL https de admira.tv>` la conecta a un player de admira.tv (`pantalla.js`) y el cómic Expediente Hawkins. Copia de admira-next-web demo/PortAventuraNeXT. |
| `/portaventura/atraccion/` | «La casa que gira de noche»: recorrido por dentro de la Casa Creel (`/portaventura/hotel/casa-creel/dentro/`) y debajo el previo de la zona 2 (muro de 8 pantallas en AdmiraNeXT01-05). |

**Casa Creel · presencia (Neo, 12-nov-2026, propuesta 1 «distancia y presencia»):** los personajes se arrastran por el tablero. Quien se mueve manda: según su distancia a la casa, la pantalla pasa de `lejos` (calma) a `cerca` (>22 y <40 cm: «X SE ACERCA…», luces rápidas) y a `puerta` (<22 cm: Mundo del Revés; Vecna «CORRE», Once lo calma). El hotel también se mueve en X e Y (asa 🏠 arrastrable; `creelScene.moveHouse(x, z)`). Clic en el hotel o en un personaje lo selecciona (aro azul) y las flechas lo mueven en X e Y (Mayús ×4) y las distancias se miden desde él. Contrato para la cámara: `creelScene.moveActor(id, x, z)` (unidades de tablero, 2,5 cm) emite `window` `creel-presencia` con `{nivel, quien, id, cm, cerca}`; con `?tv=` se reenvía por `postMessage` al player de admira.tv.

Datos: `portaventura/pa.js`. Test: `portaventura/portaventura.test.mjs`. El contenido real sigue en la DMZ de portaventuranext.com (Cloudflare Access), que **no se deja incrustar**: se abre en pestaña nueva. En el Xpace PortAventura de `/admira-xp/` no hay página intermedia (Neo, 12-nov-2026): con el estilo Netflix, elegir local carga directamente su copia propia (`here` en `PA_VENUES`): store → `/portaventura/store/hawkins/`, restaurante → `/portaventura/restaurante/bennys/`, hotel → `/portaventura/hotel/casa-creel/?maqueta=1`, atracción → `/portaventura/hotel/casa-creel/dentro/`. «Abrir ↗» lleva a la DMZ.

## EN
`/portaventura/` (session required) shows the 4 NetflixVentura venues, one page each: store and restaurant (focus) as digital twins with their screens, hotel as Casa Creel (outside and inside), attraction as a preview of the zone 2 wall on AdmiraNeXT01-05. The DMZ (Cloudflare Access) cannot be framed, so it opens in a new tab; in the PortAventura Xpace, «View here» frames the twin page instead.

# Xpace PortAventura (NetflixVentura)

ES: En admira.store/admira-xp, combo **Xpaces → PortAventura**; el combo **Venue** ofrece los 4 locales que se están construyendo. Bajo la barra aparece una ficha del local con «Entrar ↗» (pestaña nueva, pasa por el login de Cloudflare Access) y «Ver aquí» (lo incrusta; solo funciona si el navegador ya tiene sesión y envía la cookie al iframe).

| Venue | id | URL (DMZ, Cloudflare Access) |
|---|---|---|
| Store · Stranger Things | `store` | https://www.portaventuranext.com/dmz/netflix/strangerthings/merchandising |
| Restaurant · Benny's Burgers | `restaurant` (alias `restaurante`) | https://www.portaventuranext.com/dmz/netflixventura/restaurante |
| Hotel · Casa Creel | `hotel` | https://www.portaventuranext.com/dmz/netflixventura/hotel |
| Atracciones | `atracciones` (alias `atraccion`) | https://www.portaventuranext.com/dmz/netflixventura (provisional: aún no hay ruta propia) |

**Style** (entre Venue y Quality): `netflix` (contenido actual), `universal`, `sony`, `skydance` (paleta propia y «próximamente», sin logos ni arte de esas marcas). Parámetro `&style=`.

Enlace directo: `/admira-xp/?xpace=portaventura&venue=hotel&style=netflix`.

Perímetro: este repo es público; aquí solo hay enlaces. El código vive en el repo privado `csilvasantin/portaventura-next`. Sin sesión de Access la DMZ responde 403; si el navegador no envía la cookie de Access dentro del iframe, usar el botón de abrir.

EN: In admira.store/admira-xp pick **Xpaces → PortAventura**; **Venue** lists the 4 venues (store, restaurant, hotel, attraction), embedded under the bar with an "open ↗" button. Links only: content lives in the protected DMZ of portaventuranext.com (private repo). Direct link: `/admira-xp/?xpace=portaventura&venue=hotel`.

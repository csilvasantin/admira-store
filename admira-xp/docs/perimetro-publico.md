# Qué es público en admira.store / What is public on admira.store

Carlos, 30-oct-2026. Contrato de lo que abre sin sesión, de lo que no se publica y de las comprobaciones que lo vigilan.
Lógica: `functions/_perimetro.js`. Pruebas: `tests/perimetro.test.mjs`, `tests/xpacios-publicas.test.mjs` y
`tests/paquete-sin-internos.test.mjs`.

## ES

### Qué abre sin sesión

| Ruta | Acceso |
|---|---|
| `/mcp/` | Público. |
| `/xpacios/` y sus Xpacios | Público. Crear un Xpacio desde el índice pide sesión, porque escribe en un índice compartido. |
| `/xpacios/crear/`, `/xpacios/grok/`, `/xpacios/xtanco-barcelona/` y `/xpacios/xtanco-valencia/` | Exigen sesión, y es el servidor quien lo hace. |
| `/admira-xp/` | Una persona que lo abre directamente entra con sesión; incrustado en un iframe no la necesita. |
| Resto de páginas (`/`, `/inventario/`, `/help/`…) | Exigen sesión. |
| Assets (`.js`, `.css`, imágenes, `.json`…) | Sin sesión, porque los usan players, decks y agentes. |

Ninguna página de `/xpacios/` lleva verja propia. La antigua, heredada de Pixeria, se ejecutaba en el navegador, contradecía al servidor y se saltaba con `?gate=off`.

Los dos Xtanco no pueden ser públicos: cada navegador que los abre actúa como nodo real de la flota (presencia, emisión y proof-of-play) y guarda decoración compartida.

El perímetro decide sobre la ruta que de verdad se va a servir: Pages la decodifica y limpia después, así que `/xpacios//crear/` o `/xpacios/%63rear/` cuentan como `/xpacios/crear/` (`servedPath`).

### Lo interno no se publica

Como los assets no piden sesión, lo interno se queda fuera del paquete: `.github/quitar-internos.sh` quita instrucciones de agentes, handoffs, scripts (`.sh`, `.py`), tests, fuentes y configuración de workers. Se conserva lo que la web enlaza: `admira-xp/docs/`, `mcp/`, `admira-xp/scripts/best-production.md` y las licencias de los modelos.

El repositorio es público: lo que no se publica en la web sigue visible en GitHub. Nada confidencial debe vivir en este repo.

### HSTS

Toda respuesta lleva `Strict-Transport-Security: max-age=15552000` (`functions/_seguridad.js`). Sin `includeSubDomains` ni `preload`, porque los subdominios son servicios aparte.

### Solicitar acceso

La pantalla de login incluye «¿No tienes acceso? Solicítalo». El formulario funciona sin JavaScript y envía a `POST /auth/solicitar-acceso`, que exige nombre, email válido y la casilla de consentimiento, y lo reenvía a `https://api.admira.store/lead` con `source` `admira-store-login`. Llega como un lead más, con aviso por Telegram. No da sesión ni permisos: el acceso se sigue concediendo en AdmiraNeXT.

### Tests antes de publicar

`node scripts/ci-tests.mjs` ejecuta todos los `*.test.mjs`. Un fallo que no esté en `tests/fallos-conocidos.json` para el despliegue y el espejo diario. Cada fallo conocido lleva su motivo; al arreglarlo, se quita de la lista.

- `cloudflare-pages.yml` la pasa antes de construir el paquete.
- `sync-xpaceos-minus-1d.yml` la pasa antes de empujar a `main`. Si falla, el espejo no llega a producción.
- `tests.yml` la pasa en cualquier otra rama.

### Comprobación tras publicar

`node scripts/smoke-perimetro.mjs <base> [commit]` comprueba la web real tras cada despliegue: lo privado va al login, lo público abre, lo interno da 404 y toda respuesta lleva HSTS. No crea nada: la única escritura que intenta es una solicitud sin consentimiento, que se rechaza.

### Vistas previas

Una rama `vista-previa/<nombre>` pasa por el mismo proceso y publica en `*.admira-store.pages.dev` sin tocar producción. Las vistas previas pueden no tener los secretos de producción, así que sirven para comprobar lo anónimo, no el login.

### Pendiente

- El aviso de privacidad del formulario es breve: falta una política publicada con los datos legales del responsable.
- `api.admira.store` y `xpl.admira.store` aceptan escrituras sin autenticar (`/layout/report`, `/signage/now`, `/emit`, `/xpl/ping`). Cerrar estas páginas evita que un visitante las use sin querer, no que alguien las llame directamente.
- El bloque de `robots.txt` que gestiona Cloudflare antepone `Allow: /` para todos, y empata con nuestro `Disallow: /`. Se ajusta en el panel de Cloudflare; las páginas privadas no dependen de esto, porque redirigen al login.

## EN

### What opens without a session

| Route | Access |
|---|---|
| `/mcp/` | Public. |
| `/xpacios/` and its Xpaces | Public. Creating a Xpace from the index asks for a session, because it writes to a shared index. |
| `/xpacios/crear/`, `/xpacios/grok/`, `/xpacios/xtanco-barcelona/` and `/xpacios/xtanco-valencia/` | Require a session, enforced by the server. |
| `/admira-xp/` | A person opening it directly signs in; embedded in an iframe it needs no session. |
| Other pages (`/`, `/inventario/`, `/help/`…) | Require a session. |
| Assets (`.js`, `.css`, images, `.json`…) | No session, because players, decks and agents use them. |

No `/xpacios/` page carries its own gate. The old one, inherited from Pixeria, ran in the browser, contradicted the server and could be skipped with `?gate=off`.

The two Xtanco pages cannot be public: every browser opening them acts as a real fleet node (presence, emission and proof-of-play) and saves shared decoration.

The perimeter decides on the path that will really be served: Pages decodes and cleans it afterwards, so `/xpacios//crear/` or `/xpacios/%63rear/` count as `/xpacios/crear/` (`servedPath`).

### Internal files are not published

Because assets need no session, internal files stay out of the package: `.github/quitar-internos.sh` removes agent instructions, handoffs, scripts (`.sh`, `.py`), tests, sources and worker configuration. What the site links to stays: `admira-xp/docs/`, `mcp/`, `admira-xp/scripts/best-production.md` and the model licences.

The repository is public: what the site does not publish remains visible on GitHub. Nothing confidential should live in this repo.

### HSTS

Every response carries `Strict-Transport-Security: max-age=15552000` (`functions/_seguridad.js`), without `includeSubDomains` or `preload`, because subdomains are separate services.

### Requesting access

The sign-in screen includes "No access? Request it". The form works without JavaScript and posts to `POST /auth/solicitar-acceso`, which requires a name, a valid email and the consent box, then forwards to `https://api.admira.store/lead` with `source` `admira-store-login`. It arrives as a normal lead with a Telegram notice. It grants no session or permissions: access is still granted in AdmiraNeXT.

### Tests before publishing

`node scripts/ci-tests.mjs` runs every `*.test.mjs`. A failure missing from `tests/fallos-conocidos.json` stops the deployment and the daily mirror. Each known failure carries its reason; once fixed, it is removed from the list.

- `cloudflare-pages.yml` runs it before building the package.
- `sync-xpaceos-minus-1d.yml` runs it before pushing to `main`. If it fails, the mirror does not reach production.
- `tests.yml` runs it on any other branch.

### Check after publishing

`node scripts/smoke-perimetro.mjs <base> [commit]` checks the live site after each deployment: private pages go to sign-in, public pages open, internal files return 404 and every response carries HSTS. It creates nothing: the only write it attempts is a request without consent, which is rejected.

### Previews

A `vista-previa/<name>` branch goes through the same process and publishes to `*.admira-store.pages.dev` without touching production. Previews may lack production secrets, so they verify anonymous behaviour, not sign-in.

### Pending

- The form's privacy notice is brief: a published policy with the controller's legal details is still missing.
- `api.admira.store` and `xpl.admira.store` accept unauthenticated writes (`/layout/report`, `/signage/now`, `/emit`, `/xpl/ping`). Closing these pages stops a visitor using them by accident, not someone calling them directly.
- The `robots.txt` block managed by Cloudflare prepends `Allow: /` for everyone, which ties with our `Disallow: /`. It is adjusted in the Cloudflare dashboard; private pages do not depend on it, because they redirect to sign-in.

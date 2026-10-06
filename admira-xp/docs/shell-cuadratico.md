# Shell cuadrático común de XpaceOS / XpaceOS four-band shell (FLT-101337)

**Regla: toda página nueva de xpaceos.com (= admira.store) usa el shell cuadrático.** Ninguna página trae su propia cabecera ni su propia navegación. Es lo mismo que ya tienen admira.app (`galaxy-shell`) y Pixeria (`shell-cuadratico`).

Estado: shell compartido publicado; tiradores de tamaño añadidos el 3-oct-2026; paneles superpuestos y siempre cerrados al cargar desde el 3-oct-2026 (`v.03.10.2026.r1`).

## Qué es

La interfaz de cuatro bandas del gemelo (`admira-xp/index.html`), ahora en todas las páginas:

- **Barra superior** (`#topBar`, 46 px, el mismo degradado y borde cian del gemelo): a la izquierda **☰ Opciones** + marca **XpaceOS** (enlace al inicio) + la sección discreta de la página (`/ ayuda`); a la derecha **▤ Avanzado** y **⌘ Experto**. Mismos glifos y clases que el gemelo: `.quad-icon`, `data-quad-toggle="left|right"`, `#pfOptions`, `#pfExpert`.
- **☰ Opciones** (`nav.quad-menu.quad-left`, panel izquierdo): Inicio, Gemelo digital, Ayuda, Comandos CLI y los enlaces generales de la página (lo que lleva a otra página o a otro sitio). Al pie, el sello del release si la página lo declara.
- **▤ Avanzado** (`nav.quad-menu.quad-right`, panel derecho): las acciones de trabajo de la página y los atajos a sus secciones (`#…`).
- **⌘ Experto** (`section.quad-menu.quad-bottom`, abajo): la consola. `/help`, `/limpiar`, `/gemelo [orden]` y los verbos propios de la página; los verbos del gemelo se ejecutan en el gemelo (ver abajo).

Los paneles son independientes (pueden estar abiertos a la vez) y **entran cerrados en cada página**: el estado abierto no se guarda ni se restaura (la clave antigua `xpaceos_shell_panels_v1` se borra al arrancar); solo se recuerda su tamaño (`xpaceos_shell_size_v1:<panel>`). Esc cierra el panel que tiene el foco.

### Principio: el contenido no se mueve (Carlos, 3-oct-2026)

> «El cuerpo central del sitio (contenido) no se desplaza al abrir las barras opcionales, ni verticales ni la horizontal inferior».

☰ Opciones, ▤ Avanzado y ⌘ Experto **se superponen** al contenido en todos los anchos (no hay modo acoplado). Abrirlos o cerrarlos no cambia la posición, el ancho ni el alto del cuerpo de la página: el shell no aplica `padding`, `margin`, `width` ni `height` al contenido según el estado de los paneles, y las páginas tampoco. `--xs-left`, `--xs-right` y `--xs-bottom` siguen existiendo, pero **solo para elementos flotantes** (los laterales se detienen sobre ⌘ con `bottom: var(--xs-bottom)`; una barra pegajosa puede quedar sobre ⌘, como la de `altadis/datos.html`). Igual que Yokup y que el gemelo `admira-xp`. El guardián lo vigila.

Sin scroll horizontal en móvil (los paneles viven en una capa fija que recorta su desplazamiento); bajo 420 px la sección se oculta y quedan ☰, XpaceOS, ▤ y ⌘.

## Cómo la adopta una página

En el `<head>`, **después de todo el CSS propio**:

```html
<link rel="stylesheet" href="/assets/xpace-shell.css?v=20261006-options-sello-2">
<script defer src="/assets/xpace-shell.js?v=20261006-options-sello-2" data-section="/ ayuda" data-section-en="/ help"></script>
```

Opcionalmente, antes del script, `window.XPACE_SHELL = {...}`:

| Clave | Uso |
|---|---|
| `section` | Texto junto a la marca: `'/ ayuda'` o `{es, en}` (también `data-section` / `data-section-en`). |
| `options` | Enlaces extra de ☰: `[{href, es, en, newTab?}]`. |
| `advanced` | Acciones de ▤: `[{href, es, en}]` o `{id, es, en}` para un botón. |
| `verbs` | Verbos propios del CLI: `{id, aliases, es, en, run(args, ctx, lang)}`. Solo valen en esa página. |
| `home` | Destino de la marca (por defecto `/`). |
| `common` | `false` para quitar los enlaces comunes de Opciones. |
| `data-marca="barra"` (atributo del script) | Con marca blanca, viste solo la barra y los paneles; la página conserva su paleta (CMDB). Ver `admira-xp/docs/marca-blanca.md`. |

Para conservar los manejadores de lo que ya existe, la página marca los elementos y el shell los **mueve** (no los copia):

| Atributo | Efecto |
|---|---|
| `data-shell-slot="options\|advanced\|expert"` | Mueve ese elemento al panel indicado. `expert` lo pone sobre la consola (p. ej. el log de XpaceScan). |
| `data-shell-nav` | Reparte los `<a>`/`<button>` de esa navegación: anclas internas (`#…`) a ▤ y el resto a ☰. `data-shell-skip` deja uno fuera. |
| `data-shell-replace` | Cabecera o navegación propia que deja paso a la barra común: se elimina después de mover lo marcado. |
| `data-shell-slots` | Contenedor auxiliar (normalmente `hidden`) que también se elimina. |

Un enlace común que la página ya trae (mismo destino) no se repite. El enlace a la página actual lleva `aria-current="page"`. Si la página se abre dentro de un iframe (el Condicional dentro del panel XPL), el shell no pinta una segunda barra (`data-shell-framed="on"` en el script lo fuerza).

### Reglas de convivencia

- **Reparto**: lo que lleva a otra página o a otro sitio va a **☰ Opciones**; lo que trabaja sobre la página (exportar, salir, ver código) y los atajos a sus secciones, a **▤ Avanzado**. Los filtros de uso diario (circuito y día de `control/`, buscador y CSV de `leads.html`, pestañas del backoffice y del panel XPL) se quedan en el contenido.
- **Cabeceras de contenido**: un `<header>` que es el título de la página (Starbucks PG103, Condicional, CMDB, Mobiliario) se queda; solo su navegación pasa a la barra.
- **Alturas**: nada de `100vh - Npx`: `calc(100dvh - var(--xs-bar-h))`. `--xs-bar-h` vale 46 px con el shell montado y 0 sin él. `--xs-bottom` (altura de ⌘ Experto abierto) **nunca** resta altura ni añade relleno al contenido: solo lo usan elementos flotantes. Lo pegajoso de la página usa `top: var(--xs-bar-h)`.
- **Capas**: barra 8900, paneles 9000. Puertas, cajones, modales y avisos propios van a ≥ 9100 (backoffice, `leads.html`, CMDB).
- **Misma barra en todas**: `xpace-shell.css` fija en la barra y los paneles los colores del gemelo (`--xp-*`) aunque la página sea clara (Inventario, Personas) y aísla el shell de los selectores de elemento de cada página (`header`, `nav`, `button`, `input`…).
- **Una sola consola**: el ⌥ de XpaceScan pasa a ⌘ (el mismo panel inferior; el log de captura y el feed crudo de la sala de máquinas viven dentro de ⌘). `robot/` conserva su CLI de robot en el contenido.
- **Puertas privadas**: backoffice y `leads.html` siguen con su puerta de token igual; el perímetro (`functions/_middleware.js`, `_perimetro.js`) no se toca.
- **Caché**: si cambia `xpace-shell.js/.css`, se sube el `?v=` en todas las páginas a la vez (el guardián lo exige).

## Marca blanca

El shell es el único enganche de la marca blanca del catálogo de admiranext.com/marcablanca (plataforma `store`): con `?marca=<id>` o `/marca <id>` carga `assets/marca-blanca.js` con su mismo sello; sin marca no carga nada. El gemelo carga `xpace-shell.js` en modo barra en línea solo para esto y para el API. Detalles en `admira-xp/docs/marca-blanca.md`.

## Modo experto fuera del gemelo

`/help`, `/limpiar` (`/clear`), `/gemelo [orden]`, `/marca` (alias `/brand`) y los verbos de la página se ejecutan en la página. `/avatar good` abre el calvo, `/avatar better` abre la chica y `/avatar best` abre a Neo: se quedan en el avatar y no viajan al gemelo. `/avatar` sin nivel dice el estado; `/avatarON` y `/avatarOFF` lo muestran o lo ocultan; `/avatar reset` vuelve al interruptor del proyecto. `/help` los lista. `good`, `better` y `best` sueltos siguen siendo las vistas del gemelo. Guía: `admira-xp/docs/avatar-levels.md`.

Los **verbos del gemelo** (`/distribuir`, `matrix`, `better`, `/status`, `/stock`, `/music`, `/ds`, `/layout`, `/inventario`, `/sincro`, `/xpacio`… la lista sale de `helpSections()` y la vigila el guardián) se guardan en `sessionStorage` (`xpaceos_expert_pending_v1`: `{cmd, at, from}`, caduca a los 2 minutos, **nunca en la URL**), se abre `/admira-xp/` y el gemelo la ejecuta **una sola vez**, con el Xpacio ya en marcha, como si se hubiera escrito en su consola: abre ⌘ y muestra la respuesta (sin reenviarla a Telegram). Un verbo desconocido no navega: el CLI sugiere `/help` o `/gemelo <orden>`. Historial compartido (`xpaceos_expert_history_v1`, ↑/↓) y Tab para completar.

## Páginas

Guardián: `tests/shell-cuadratico.test.mjs` recorre todos los `.html`. Cada uno carga `xpace-shell.css` y `xpace-shell.js` (defer) en el `<head>`, con el `?v=` de la portada y después del CSS propio, sin alturas `100vh - Npx` ni contenido que se encoja o se desplace según los paneles (`--xs-left/right/bottom` en `padding`, `margin`, `width` o `height` de `body`/contenido, `html.xs-docked`, restaurar `xpaceos_shell_panels_v1`); o es el gemelo (barra en línea con los mismos glifos) o figura en `SHELL_EXCEPTIONS` con su motivo. Falla con una página nueva sin shell, con un `?v=` antiguo, con una excepción que ya no existe o que sí carga el shell, y si el gemelo añade un verbo a su `/help` que el shell no sabe traspasar.

**Con shell**: portada `index.html`, `lenovo/`, `robot/`, `altadis/` (+ `datos.html`, `guion.html`), `help/`, `help/cli/`, `help/funcionalidades/`, `admira-xp/help.html`, `ayuda/`, `cpm/`, `control/`, `doc/`, `mcp/`, `backoffice/` (privada), `leads.html` (privada), `admira-xp/inventario.html` (CMDB), `admira-xp/xpl.html`, `admira-xp/xpl/`, `admira-xp/docs/navigator/`, `admira-xp/buscador/`, `inventario/`, `inventario/conjunto/`, `inventario/starbucks/`, `admira-xp/personas/`, `mobiliario/`, `mobiliario/salas/`, `mobiliario/reponer/`, `scan/`, `scan/ops.html`, `scan/levantado/`, `scan/planos/`, `xpacios/`, `xpacios/lab/`, `xpacios/cafebreria/`.

**El gemelo** (`admira-xp/index.html`) conserva su barra en línea (integrada con el lienzo: `sizeSideColumns`, `resizeCanvas`; sus paneles también se superponen al Xpacio, que no cambia de tamaño), con el mismo marcado y las mismas clases; solo ejecuta la orden pendiente que le pasa el shell.

### Excepciones (21)

| Página | Motivo |
|---|---|
| `nvidia/` | Pantalla completa: el gemelo a toda pantalla en un iframe para el stand NVIDIA. |
| `Xcaixa/`, `Xsuperman/` | Xperiences inmersivas con su propio HUD. |
| `xpacios/grok/`, `xpacios/xtanco-barcelona/`, `xpacios/xtanco-valencia/`, `xpacios/crear/`, `xpacios/crear/phone.html` | Apps heredadas de Pixeria a pantalla completa, tras su verja (la captura del móvil se abre con QR). |
| `xperiencias/batcueva/`, `xperiencias/sheldon/`, `xperiencias/soledad/` | Xperiencias inmersivas a pantalla completa. |
| `scan/pelicula.html`, `scan/visor.html` | Reproductor y visor 3D de XpaceScan a pantalla completa. |
| `admira-xp/emulador/` | Emulador Street View a pantalla completa. |
| `CPM.html`, `Nvidia.html`, `game.html`, `arcade/`, `inventari/`, `inventario/cafebreria/` | Redirecciones inmediatas: no pintan nada. |
| `admira-xp/tools/walk-sprites/bake.html` | Fragmento: herramienta interna de horneado de sprites. |

`admira-xp/buscador/` estaba en la lista de pantalla completa y se ha adoptado: es una herramienta con panel lateral y mapa que cabe bajo la barra.

### Pendiente conocido

- Algunas páginas ya tenían scroll horizontal en móvil antes del shell (`help/cli/`, `cpm/`, `control/`, `mobiliario/`, `mobiliario/reponer/`, `admira-xp/xpl*.html`…): el shell no lo añade ni lo corrige.
- Ni el gemelo ni el shell persisten el estado abierto de los paneles: entran cerrados en cada carga.

---

**English.** **Rule: every new xpaceos.com (= admira.store) page uses the four-band shell.** Load `/assets/xpace-shell.css` (after the page CSS) and `/assets/xpace-shell.js` (defer) in the `<head>`, declare the page section, links and actions in `window.XPACE_SHELL` or with `data-shell-slot` / `data-shell-nav` / `data-shell-replace`, and the page gets the twin's exact bar (☰ Options + XpaceOS + section on the left, ▤ Advanced and ⌘ Expert on the right, same glyphs and classes) and its Options, Advanced and Expert panels. Panels are independent and **start closed on every page load** (the open state is neither saved nor restored; the legacy `xpaceos_shell_panels_v1` key is removed at start-up; only their size is remembered). **Principle (Carlos, 3 Oct 2026): the central body of the site never moves when the optional bars open** — ☰, ▤ and ⌘ overlay the content at every width (no docked mode), so its position, width and height stay the same; nothing applies `padding`, `margin`, `width` or `height` to the content based on panel state. `--xs-left/right/bottom` remain for floating elements only, like Yokup and the `admira-xp` twin. No horizontal scroll on mobile. Navigation goes to ☰ Options; page work and section shortcuts to ▤ Advanced; daily filters stay in the content. Heights use `calc(100dvh - var(--xs-bar-h))`, never `- var(--xs-bottom)`; own gates and modals sit at z-index ≥ 9100. Twin verbs typed in ⌘ Expert outside the twin are stored in `sessionStorage` (`xpaceos_expert_pending_v1`, 2-minute expiry, never in the URL), the twin opens and runs them once, as if typed in its console. The listed pages and Cafebrería carry the shell, the twin keeps its inline bar, and 21 exceptions (full-screen stages, redirects and a fragment) are listed above and in `SHELL_EXCEPTIONS` of `tests/shell-cuadratico.test.mjs`, which fails when a page skips the shell.

## Redimensionar / Resize

ES: Redimensiona el marco cuadrático: arrastra el borde superior de Experto hacia abajo para reducirlo o hacia arriba para ampliarlo; ajusta Opciones y Avanzado con los tiradores de sus bordes interiores. Las ventanas flotantes tienen una esquina inferior derecha para cambiar anchura y altura. Con el tirador enfocado, usa las flechas (20 px; Mayús, 5 px). Inicio o doble clic restaura el tamaño automático. Cada tamaño se guarda en este navegador y dominio, con límites para mantener visibles los controles. Los tiradores se ocultan al cerrar; los laterales se detienen sobre Experto y el contenido no cambia de posición ni de tamaño: los paneles se superponen y entran cerrados en cada página. Se conservan /marca, historial CLI, posición y cierre de cada herramienta.

EN: Resize the quadratic shell: drag Expert's upper edge downward to shrink it or upward to enlarge it; adjust Options and Advanced with their inner-edge handles. Floating windows have a bottom-right corner to change width and height. With a handle focused, use arrow keys (20 px; Shift, 5 px). Home or double-click restores automatic sizing. Each size is saved in this browser and domain, bounded to keep controls reachable. Handles hide when closed; side rails stop above Expert and the content never moves or resizes: panels overlay it and start closed on every page. /brand, CLI history, window positions and each tool's close lifecycle are preserved.

## Experto común / Shared Expert

ES: El modo Experto comparte el patrón de Starbucks en Cafebrería y las páginas con el shell común: CONTROL XTORE y categorías a la izquierda, opciones de la categoría en el centro y PREVIOS con las respuestas a la derecha. Las doce categorías mantienen los mismos iconos y orden; ITIL está debajo de Percepción, a la derecha de Pixeria. Arrastra los dos separadores para ajustar las columnas; las flechas también funcionan y Inicio o doble clic restaura 32/38/30. El borde superior sigue redimensionando la altura. En Cafebrería, Mobiliario → Distribuir muebles abre el editor real en el centro; Inventario e ITIL muestran las mismas fichas locales. ↗ desacopla la herramienta como ventana movible, redimensionable y cerrable. Cerrar Experto devuelve las herramientas abiertas a su ubicación flotante. Enter ejecuta la orden y Mayús+Enter añade una línea. Se conservan historial CLI, /marca (/brand), /avatarDigital y la distribución guardada. Las acciones disponibles en el gemelo se abren allí cuando la página no tiene una herramienta local. El gemelo nativo conserva su menú y sus controles originales.

EN: Expert mode shares the Starbucks pattern in Cafebrería and common-shell pages: CONTROL XTORE and categories on the left, category options in the centre and PREVIEWS with responses on the right. The twelve categories retain the same icons and order; ITIL sits below Perception, to the right of Pixeria. Drag the two separators to resize columns; arrow keys also work and Home or double-click restores 32/38/30. The upper edge still resizes the dock height. In Cafebrería, Furniture → Distribute furniture opens the real editor in the centre; Inventory and ITIL show the same local records. ↗ detaches the tool as a movable, resizable, closable window. Closing Expert restores open tools to their floating location. Enter runs the command and Shift+Enter adds a line. CLI history, /brand (/marca), /avatarDigital and saved layout are preserved. Actions available in the twin open there when a page has no local tool. The native twin retains its original menu and controls.


Guía / Guide: [expert-workspace.md](expert-workspace.md).

## Versión en Opciones / Version in Options

ES: La versión aparece al pie del menú lateral Opciones y desaparece al plegarlo. En la primera visita con una novedad sin reconocer se permite un único aviso fuera del menú; abrir Opciones o leer y cerrar el aviso lo reconoce en este navegador y dominio. Una actualización posterior permite un nuevo primer aviso. Pasar sobre el sello abre las novedades; una versión pendiente conserva la acción Recargar. Se mantienen los enlaces de ayuda del sello nativo. Las páginas de emisión, kioscos e iframes conservan sus exclusiones.

EN: The version appears at the bottom of the Options side panel and disappears when it is collapsed. The first visit with unacknowledged news allows a single notice outside the panel; opening Options or reading and closing the notice acknowledges it in this browser and domain. A later update allows a new first notice. Hovering over the stamp opens release notes; a pending version retains the Reload action. Native stamp help links are preserved. Broadcasting pages, kiosks and iframes retain their exclusions.

Contrato / Contract: `version-options`; cargador compartido / shared loader `https://www.admiranext.com/assets/sello-novedades.js`; versión propia / site version `/version.json`. Se reutilizan / reused: `.qm-version`, `.rail-ver`, `[data-yk-version]`, `[data-admira-sello]`, `[data-release-signature]`. Panel explícito / explicit panel: `data-options` en el script / on the script. Aviso reconocido / acknowledged notice: `admira-sello:aviso-visto`; lectura de novedades / news read: `admira-sello:visto`. No añade herramientas MCP / No additional MCP tools.

Tutorial ES: ☰ Opciones → sello al pie → pasar el ratón → plegar Opciones. EN: ☰ Options → bottom stamp → hover → collapse Options.

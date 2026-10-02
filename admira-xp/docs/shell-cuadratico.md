# Shell cuadrático común de XpaceOS / XpaceOS four-band shell (FLT-101337)

**Regla: toda página nueva de xpaceos.com (= admira.store) usa el shell cuadrático.** Ninguna página trae su propia cabecera ni su propia navegación. Es lo mismo que ya tienen admira.app (`galaxy-shell`) y Pixeria (`shell-cuadratico`).

Estado: implementado en la rama `morfeo/shell-marca-store` (pendiente de push y despliegue por el coordinador).

## Qué es

La interfaz de cuatro bandas del gemelo (`admira-xp/index.html`), ahora en todas las páginas:

- **Barra superior** (`#topBar`, 46 px, el mismo degradado y borde cian del gemelo): a la izquierda **☰ Opciones** + marca **XpaceOS** (enlace al inicio) + la sección discreta de la página (`/ ayuda`); a la derecha **▤ Avanzado** y **⌘ Experto**. Mismos glifos y clases que el gemelo: `.quad-icon`, `data-quad-toggle="left|right"`, `#pfOptions`, `#pfExpert`.
- **☰ Opciones** (`nav.quad-menu.quad-left`, panel izquierdo): Inicio, Gemelo digital, Ayuda, Comandos CLI y los enlaces generales de la página (lo que lleva a otra página o a otro sitio). Al pie, el sello del release si la página lo declara.
- **▤ Avanzado** (`nav.quad-menu.quad-right`, panel derecho): las acciones de trabajo de la página y los atajos a sus secciones (`#…`).
- **⌘ Experto** (`section.quad-menu.quad-bottom`, abajo): la consola. `/help`, `/limpiar`, `/gemelo [orden]` y los verbos propios de la página; los verbos del gemelo se ejecutan en el gemelo (ver abajo).

Los paneles son independientes (pueden estar abiertos a la vez), empiezan cerrados en una visita nueva y **recuerdan su estado entre páginas** (`localStorage` `xpaceos_shell_panels_v1`). En pantallas de 1100 px o más, Opciones y Avanzado abiertos se acoplan y el contenido se desplaza a su lado; en pantallas más estrechas se superponen. Esc cierra el panel que tiene el foco. Sin scroll horizontal en móvil (los paneles viven en una capa fija que recorta su desplazamiento); bajo 420 px la sección se oculta y quedan ☰, XpaceOS, ▤ y ⌘.

## Cómo la adopta una página

En el `<head>`, **después de todo el CSS propio**:

```html
<link rel="stylesheet" href="/assets/xpace-shell.css?v=20261001-marca-1">
<script defer src="/assets/xpace-shell.js?v=20261001-marca-1" data-section="/ ayuda" data-section-en="/ help"></script>
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
- **Alturas**: nada de `100vh - Npx`: `calc(100dvh - var(--xs-bar-h) - var(--xs-bottom))`. `--xs-bar-h` vale 46 px con el shell montado y 0 sin él; `--xs-bottom` es la altura de ⌘ Experto abierto. Lo pegajoso de la página usa `top: var(--xs-bar-h)`.
- **Capas**: barra 8900, paneles 9000. Puertas, cajones, modales y avisos propios van a ≥ 9100 (backoffice, `leads.html`, CMDB).
- **Misma barra en todas**: `xpace-shell.css` fija en la barra y los paneles los colores del gemelo (`--xp-*`) aunque la página sea clara (Inventario, Personas) y aísla el shell de los selectores de elemento de cada página (`header`, `nav`, `button`, `input`…).
- **Una sola consola**: el ⌥ de XpaceScan pasa a ⌘ (el mismo panel inferior; el log de captura y el feed crudo de la sala de máquinas viven dentro de ⌘). `robot/` conserva su CLI de robot en el contenido.
- **Puertas privadas**: backoffice y `leads.html` siguen con su puerta de token igual; el perímetro (`functions/_middleware.js`, `_perimetro.js`) no se toca.
- **Caché**: si cambia `xpace-shell.js/.css`, se sube el `?v=` en todas las páginas a la vez (el guardián lo exige).

## Marca blanca

El shell es el único enganche de la marca blanca del catálogo de admiranext.com/marcablanca (plataforma `store`): con `?marca=<id>` o `/marca <id>` carga `assets/marca-blanca.js` con su mismo sello; sin marca no carga nada. El gemelo carga `xpace-shell.js` en modo barra en línea solo para esto y para el API. Detalles en `admira-xp/docs/marca-blanca.md`.

## Modo experto fuera del gemelo

`/help`, `/limpiar` (`/clear`), `/gemelo [orden]`, `/marca` (alias `/brand`) y los verbos de la página se ejecutan en la página. Los **verbos del gemelo** (`/distribuir`, `matrix`, `better`, `/status`, `/stock`, `/music`, `/ds`, `/layout`, `/inventario`, `/sincro`, `/xpacio`… la lista sale de `helpSections()` y la vigila el guardián) se guardan en `sessionStorage` (`xpaceos_expert_pending_v1`: `{cmd, at, from}`, caduca a los 2 minutos, **nunca en la URL**), se abre `/admira-xp/` y el gemelo la ejecuta **una sola vez**, con el Xpacio ya en marcha, como si se hubiera escrito en su consola: abre ⌘ y muestra la respuesta (sin reenviarla a Telegram). Un verbo desconocido no navega: el CLI sugiere `/help` o `/gemelo <orden>`. Historial compartido (`xpaceos_expert_history_v1`, ↑/↓) y Tab para completar.

## Páginas

Guardián: `tests/shell-cuadratico.test.mjs` recorre todos los `.html`. Cada uno carga `xpace-shell.css` y `xpace-shell.js` (defer) en el `<head>`, con el `?v=` de la portada y después del CSS propio, sin alturas `100vh - Npx`; o es el gemelo (barra en línea con los mismos glifos) o figura en `SHELL_EXCEPTIONS` con su motivo. Falla con una página nueva sin shell, con un `?v=` antiguo, con una excepción que ya no existe o que sí carga el shell, y si el gemelo añade un verbo a su `/help` que el shell no sabe traspasar.

**Con shell (35)**: portada `index.html`, `lenovo/`, `robot/`, `altadis/` (+ `datos.html`, `guion.html`), `help/`, `help/cli/`, `help/funcionalidades/`, `admira-xp/help.html`, `ayuda/`, `cpm/`, `control/`, `doc/`, `mcp/`, `backoffice/` (privada), `leads.html` (privada), `admira-xp/inventario.html` (CMDB), `admira-xp/xpl.html`, `admira-xp/xpl/`, `admira-xp/docs/navigator/`, `admira-xp/buscador/`, `inventario/`, `inventario/conjunto/`, `inventario/starbucks/`, `admira-xp/personas/`, `mobiliario/`, `mobiliario/salas/`, `mobiliario/reponer/`, `scan/`, `scan/ops.html`, `scan/levantado/`, `scan/planos/`, `xpacios/`, `xpacios/lab/`.

**El gemelo** (`admira-xp/index.html`) conserva su barra en línea (acoplada al lienzo: `sizeSideColumns`, `resizeCanvas`), con el mismo marcado y las mismas clases; solo ejecuta la orden pendiente que le pasa el shell.

### Excepciones (21)

| Página | Motivo |
|---|---|
| `nvidia/` | Pantalla completa: el gemelo a toda pantalla en un iframe para el stand NVIDIA. |
| `Xcaixa/`, `Xsuperman/` | Xperiences inmersivas con su propio HUD. |
| `xpacios/grok/`, `xpacios/xtanco-barcelona/`, `xpacios/xtanco-valencia/`, `xpacios/crear/`, `xpacios/crear/phone.html` | Apps heredadas de Pixeria a pantalla completa, tras su verja (la captura del móvil se abre con QR). |
| `xperiencias/batcueva/`, `xperiencias/sheldon/`, `xperiencias/soledad/` | Xperiencias inmersivas a pantalla completa. |
| `scan/pelicula.html`, `scan/visor.html` | Reproductor y visor 3D de XpaceScan a pantalla completa. |
| `admira-xp/emulador/` | Emulador Street View a pantalla completa. |
| `CPM.html`, `Nvidia.html`, `game.html`, `arcade/`, `inventari/`, `xpacios/cafebreria/` | Redirecciones inmediatas: no pintan nada. |
| `admira-xp/tools/walk-sprites/bake.html` | Fragmento: herramienta interna de horneado de sprites. |

`admira-xp/buscador/` estaba en la lista de pantalla completa y se ha adoptado: es una herramienta con panel lateral y mapa que cabe bajo la barra.

### Pendiente conocido

- Algunas páginas ya tenían scroll horizontal en móvil antes del shell (`help/cli/`, `cpm/`, `control/`, `mobiliario/`, `mobiliario/reponer/`, `admira-xp/xpl*.html`…): el shell no lo añade ni lo corrige.
- El gemelo no persiste el estado de sus paneles (su comportamiento no cambia en esta tarea).

---

**English.** **Rule: every new xpaceos.com (= admira.store) page uses the four-band shell.** Load `/assets/xpace-shell.css` (after the page CSS) and `/assets/xpace-shell.js` (defer) in the `<head>`, declare the page section, links and actions in `window.XPACE_SHELL` or with `data-shell-slot` / `data-shell-nav` / `data-shell-replace`, and the page gets the twin's exact bar (☰ Options + XpaceOS + section on the left, ▤ Advanced and ⌘ Expert on the right, same glyphs and classes) and its Options, Advanced and Expert panels. Panels are independent, start closed and remember their state across pages; wide screens dock them, narrow ones overlay them; no horizontal scroll on mobile. Navigation goes to ☰ Options; page work and section shortcuts to ▤ Advanced; daily filters stay in the content. Heights use `var(--xs-bar-h)` / `var(--xs-bottom)`; own gates and modals sit at z-index ≥ 9100. Twin verbs typed in ⌘ Expert outside the twin are stored in `sessionStorage` (`xpaceos_expert_pending_v1`, 2-minute expiry, never in the URL), the twin opens and runs them once, as if typed in its console. 35 pages carry the shell, the twin keeps its inline bar, and 21 exceptions (full-screen stages, redirects and a fragment) are listed above and in `SHELL_EXCEPTIONS` of `tests/shell-cuadratico.test.mjs`, which fails when a page skips the shell.

# Marca blanca en XpaceOS / White label (FLT-101337)

XpaceOS (xpaceos.com = admira.store, la pata «Store distribuye») puede vestirse con la marca de un cliente del **catálogo único** de https://www.admiranext.com/marcablanca (semillas Admira, Lumbre, BRUMELLE y Frescaria, y las marcas guardadas después, p. ej. `starbucks`), con la plataforma `store`. Sigue el mismo diseño, textos y reglas que admira.app (FLT-101331, `clearchannel-tv/docs/marca-blanca.md`) y Pixeria (FLT-101333, `pixeria/docs/marca-blanca.md`).

Estado: al cambiar de proyecto se aplica la marca del catálogo. Sello v.05.10.2026.r3.10:26. Punto de retorno: tag `retorno/pre-marcablanca-proyecto-20261005`.

## Cómo se activa

| Cómo | Efecto |
|---|---|
| `?marca=<id>` en cualquier página con la barra de 4 bandas, también el gemelo (`/admira-xp/?marca=starbucks`) | Aplica la marca y la recuerda en la pestaña (`sessionStorage` `mb:marca`, la misma clave que el cargador común, admira.app y Pixeria). Gana al proyecto hasta el siguiente cambio. |
| Cambiar de proyecto (Barra superior → Xpacio → Proyecto y local, `?project=<id>` o el local `loc=alsea-sbux-021`) | Aplica la marca del catálogo con ese id (`starbucks-mexico` → `starbucks`). Si el proyecto no tiene marca (`estancos`, `cafebreria`, 404) se quita la anterior y queda Admira. Se recuerda el proyecto (`mb:proyecto`) al recargar y al navegar. |
| ⌘ Experto → `/marca <id>` (alias `/brand`) | Igual, sin recargar. Tab completa el comando, los ids del catálogo y `off`. En el gemelo, en su consola Experto. |
| `?modo=marca\|nativo\|claro\|oscuro\|auto` | Modo de color (por defecto `marca`: el del cliente, claro u oscuro). |

La marca se mantiene al navegar entre páginas de la misma pestaña (portada, ayuda, gemelo, inventario…). Una pestaña nueva empieza sin marca.

## Cómo se vuelve a Admira

`/marca off` (o `/marca admira`), el acceso del proyecto en la barra superior o `?marca=admira` en la URL. Se deshace en el sitio, sin recargar: variables, atributos, logo, «powered by», favicon, theme-color, título y hojas cargadas; también se quitan `?marca=`/`?modo=` de la URL.

## El verbo /marca

| Orden | Respuesta |
|---|---|
| `/marca` | La marca activa (o «Sin marca blanca: ves el aspecto de Admira.») y las disponibles del catálogo. |
| `/marca <id>` | «Aplicando la marca <id>…» y, si existe, «Marca <Nombre> (<id>) activa. Se mantiene al navegar en esta pestaña; /marca off vuelve a Admira.» Una propuesta automática o una marca de ejemplo se avisan. Si no existe: «No está en el catálogo de admiranext.com. No se ha aplicado nada.» |
| `/marca off` | «Marca <Nombre> desactivada: vuelve Admira.» |
| `/marca <web>` | Abre `https://www.admiranext.com/marcablanca/?web=<url>` en otra pestaña: allí se analiza la web y se guarda en el catálogo; después `/marca <id>`. |

Los textos son los de admira.app y Pixeria. **Sin navegador** (Telegram, el MCP o `/twin/cmd`, que entran por `__xtExec` o `xtAPI.command`), `/marca` no viste ninguna pantalla: responde con el enlace que la abre (`https://www.xpaceos.com/admira-xp/?marca=<id>`, `?marca=admira` para volver, o el analizador) y `xtAPI.command` devuelve `{ok, message, data:{url, applied:false}}`.

## Cómo se carga (un solo enganche)

- **`assets/xpace-shell.js`** es el único punto de entrada: lo cargan las 35 páginas con shell y el gemelo (en modo «barra en línea», que solo deja el API y la marca). Si la pestaña pide marca (`?marca=` en la URL o `mb:marca` recordada) inserta `assets/marca-blanca.js` con **su mismo sello** (`?v=`); si no, no carga nada: una visita normal no descarga ni un byte nuevo ni habla con admiranext.com. `/marca` lo carga al usarlo. Ninguna página lo enlaza a mano.
- `assets/marca-blanca.js`, con marca:
  1. **Comprueba primero** que existe: `GET https://www.admiranext.com/marcablanca/api/marcas/<id>` (CORS `*`, 8 s como mucho). 404 → no existe. Si la API no responde, prueba el JSON estático `clientes/<id>.json`, como el cargador común.
  2. Solo entonces carga `marcablanca.css` y `marcablanca.js` de admiranext.com (`data-mb-plataforma="store"`, `data-mb-auto="false"`) y `assets/marca-blanca.css` (los ajustes de XpaceOS, con el mismo sello, todo bajo `:root[data-mb-marca][data-mb-plataforma="store"]`), y llama a `MarcaBlanca.aplicar(id, {plataforma: 'store'})`.
  3. Si algo falla, no queda nada a medias: XpaceOS sigue igual y solo hay un aviso en la consola del navegador (en el CLI, un mensaje claro).
- El catálogo completo (`/marcablanca/api/marcas`) solo se pide con una marca activa o al usar `/marca`; mientras, el Tab usa la semilla.

## Qué cambia

- **Barra de 4 bandas**: fondo de la marca casi opaco con borde inferior. Composición: [☰] **logo del cliente** **│ powered by XpaceOS**, en pequeño y en el gris de la marca. En las páginas, el logo ocupa el sitio de la marca XpaceOS y lleva al inicio; en el gemelo va detrás de ☰ y no saca de la escena. Bajo 600 px solo queda el logo. Si la marca no tiene logo, su nombre. El `title` del logo avisa si es una **propuesta automática** («no es la marca oficial», p. ej. `starbucks`) o una **marca ficticia de ejemplo**.
- **☰ Opciones, ▤ Avanzado y ⌘ Experto** (shell común y gemelo, incluida su consola inferior): superficies, bordes, radios, tipografía y textos de la marca. Iconos ☰ ▤ ⌘ con el color de la marca.
- **Gemelo**: `assets/marca-blanca.css` mapea `--xp-*` desde los tokens en la barra, los paneles y la consola, y cubre los rgba cian fijos de esa interfaz (KPIs, competencia, chip de proyecto, avisos, acordeones, botones de la consola).
- **Páginas con mucho color escrito a mano** pueden pedir solo la barra y los paneles con `data-marca="barra"` en el script del shell (`html[data-mb-alcance="barra"]`): es el caso de la CMDB (`admira-xp/inventario.html`), que conserva su paleta.
- **Páginas**: sus variables (`--bg --card --card2 --panel --line --ink --txt --mut --muted --dim --brand --acc --cyan --accent --good --warn --err`) pasan a la marca, además del puente común `store` y el de admira-design.
- **Legibilidad (AA)**: `marca-blanca.js` calcula tokens `--mbx-*` (texto, texto suave, marca, acento, ok, aviso, error, info, texto sobre marca y sobre acento): toma el color de la marca si contrasta ≥ 4,5:1 con el fondo, la superficie y la superficie alternativa; si no, el siguiente candidato y, en último caso, negro o blanco. Starbucks es una marca **clara**: su verde `#006241` y su gris `#576061` se mantienen; el dorado `#C58800` no llega a AA sobre blanco y cede al verde.
- **Pestaña**: favicon y theme-color de la marca y título «Nombre del cliente · título de la página».

## Qué no cambia

- **La escena del gemelo**: el 3D, el lienzo, los modelos, las texturas, las pantallas y los vídeos no se recolorean (ni filtros ni mezclas).
- Los HUD y diálogos internos del gemelo que no son la barra, los paneles o la consola conservan su aspecto.
- Las páginas sin shell (las 21 excepciones de `admira-xp/docs/shell-cuadratico.md`: pantallas completas, redirecciones y un fragmento).
- Detalles escritos a mano en páginas que no usan variables (`mobiliario/`, `scan/levantado/`…) conservan su color; la barra y los paneles sí llevan la marca.

## Ficheros

| Fichero | Papel |
|---|---|
| `assets/xpace-shell.js` | Único enganche (`cargarMarca`), verbo `/marca` del CLI (`runMarca`, textos de admira.app y Pixeria) y respuesta sin navegador (`remoteMarca`). |
| `assets/marca-blanca.js` | Decide la marca, comprueba el catálogo, carga lo necesario, aplica, deshace y expone `window.AdmiraMarca` (`actual`, `conocidas`, `listar`, `activar`, `desactivar`, `analizar`, `aplicarProyecto`). |
| `assets/marca-blanca.css` | Todo bajo `:root[data-mb-marca][data-mb-plataforma="store"]`. Solo se descarga con marca. |
| `admira-xp/index.html` | Carga `xpace-shell.js` en modo barra en línea; `/marca` en la consola local, en `__xtExec`, en `xtAPI.command` y en `/help`. |
| `tests/marca-blanca.test.mjs` | Sin marca no se carga nada; catálogo antes que nada; AA; hoja acotada; verbo, alias, Tab y respuesta remota; ayuda y MCP. |

## Límites conocidos

- `POST /marcablanca/api/analizar` exige mismo origen: `/marca <web>` abre el analizador de admiranext.com en otra pestaña (`?web=<url>`).
- La marca por dominio (`<cliente>.admira.store`) del cargador común no se usa aquí: XpaceOS se viste con `?marca=`, con `/marca` o con el proyecto activo cuando ese id existe en el catálogo.

---

**English.** XpaceOS (xpaceos.com = admira.store) can wear a client brand from the admiranext.com/marcablanca catalogue, platform `store`. Turn it on with `?marca=<id>` on any page with the four-band bar, including the twin (`/admira-xp/?marca=starbucks`), or with `/marca <id>` (alias `/brand`) in ⌘ Expert; it stays for the tab. Changing project (Top bar → Xpace → Project and venue, `?project=<id>`, or the Starbucks venue `loc=alsea-sbux-021`) applies the catalogue brand with that id. A project with no brand (estancos, cafebreria) clears the previous one and stays on Admira. A manual `/marca` wins until the next project change. `/marca off`, `?marca=admira` or the top bar project entry undo it in place, without reloading. `assets/xpace-shell.js` is the single hook (pages and the twin load it): it inserts `assets/marca-blanca.js` with its own stamp only when the tab asks for a brand or `/marca` is used, so a normal visit loads nothing new and never contacts admiranext.com. With a brand, the catalogue entry is checked first (8 s max); only then the common stylesheet and loader (platform `store`, no auto start) plus `assets/marca-blanca.css` are loaded and the brand applied; if anything fails nothing is applied. The bar shows the client logo │ “powered by XpaceOS”; the title warns when the brand is an automatic proposal (Starbucks) or a sample. Options, Advanced and Expert, the twin's bar, panels and console (its `--xp-*` and fixed cyan rgba values) and page variables take the brand colours with texts corrected to WCAG AA; the twin's 3D scene, models, textures and media are never recoloured. Without a browser (Telegram, MCP, `/twin/cmd`) `/marca` answers with the link that opens the brand (`?marca=<id>`) and changes no screen.


«Volver a Admira» se ha retirado de Opciones / “Back to Admira” has been removed from Options. [Guía actualizada de menús / Updated menu guide](windows-menu.md).

## Contraste de paneles / Panel contrast

La corrección de legibilidad se prueba sólo en Experto: una hoja independiente fija superficies opacas oscuras y texto claro, incluidos campos, categorías, Signage y estados Matrix. No depende de que carguen las variables de /marca. Opciones y Avanzados recuperan sus estilos anteriores. La extensión al resto de la interfaz queda pendiente de validar este piloto con Carlos.

The readability correction is piloted only in Expert: an independent stylesheet sets opaque dark surfaces and light text for fields, categories, Signage and Matrix statuses. It does not depend on /marca variables loading. Options and Advanced return to their previous styles. Extending the correction to the rest of the interface is pending Carlos validating this pilot.

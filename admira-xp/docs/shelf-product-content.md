# Productos seleccionables y contenido / Selectable products and content

## ES · Piloto de estantería Best

En la estantería #2 (`native:shelves`), **Seleccionar componentes** permite tocar un envase o su cartela para destacar ese producto y abrir su ficha. La ficha identifica el nombre ilustrativo, la referencia, la balda y la posición. La lista de 45 productos ofrece el mismo acceso mediante teclado. En **Todos**, la selección corresponde a la columna **Best**; Good y Better conservan su propia representación.

Los 45 envases son instancias visuales que comparten seis referencias ilustrativas `A02-01`…`A02-06`. La referencia agrupa el mismo producto; la identidad del componente (`id` / `product_id` en el mapa) identifica un envase concreto. Estas referencias describen el diseño y no son SKU dados de alta ni cantidades de stock.

1. Abre la [estantería Best con selección](https://www.xpaceos.com/inventario/?asset=2&quality=best&select=products#mostrador) y activa **Seleccionar componentes** si entras desde otro enlace.
2. Toca un envase o su cartela; también puedes elegirlo en la lista. Revisa referencia, balda y posición.
3. Para asociar contenido, introduce una URL HTTPS o busca una pieza de Pixeria por título o `#ID`. Si hay varios resultados, elige el que quieres utilizar.
4. Guarda la asociación para esa referencia de producto y la pantalla `ds1` del Xtanco. Seleccionar otra instancia de la misma referencia recupera la asociación; con la selección activa, el contenido guardado puede verse también al cambiar de producto.
5. Usa **Mostrar en pantalla** para una vista previa temporal del contenido asociado en el gemelo. **Detener contenido** o quitar la selección devuelve la pantalla a su programación vigente.

El [enlace al Xtanco](https://www.xpaceos.com/admira-xp/?autostart=xtanco&quality=best&visual=best&select=products) abre el mismo piloto en Best. El catálogo y el gemelo comparten las asociaciones dentro del mismo navegador y origen. Las instancias y la distribución del mueble conservan sus IDs y transformaciones. Si otra ficha controla ds1, el panel identifica esa selección y mantiene el formulario actual.

Este piloto actúa sobre una pantalla virtual, `ds1`. La asociación guardada es local; la vista previa es temporal. El flujo no publica contenido en pantallas físicas ni modifica playlists o estado Matrix. La marca blanca, el shell extensible, las preferencias y el historial CLI mantienen sus funciones. Yokup conserva el inventario maestro ITIL.

## EN · Best shelf pilot

On shelf #2 (`native:shelves`), **Seleccionar componentes (Select components)** lets you click a container or its shelf card to highlight that product and open its record. The record identifies its illustrative name, reference, shelf and position. The list of 45 products provides the same access by keyboard. In **Todos (All)**, selection applies to the **Best** column; Good and Better retain their own representations.

The 45 containers are visual instances sharing six illustrative references `A02-01`…`A02-06`. A reference groups the same product; component identity (`id` / `product_id` in the map) identifies a specific container. These references describe the design and are not registered SKUs or stock quantities.

1. Open [Best shelving with selection](https://www.xpaceos.com/inventario/?asset=2&quality=best&select=products#mostrador) and enable **Seleccionar componentes (Select components)** if you enter through another link.
2. Click a container or its shelf card, or choose it from the list. Review its reference, shelf and position.
3. To associate content, enter an HTTPS URL or search for a Pixeria asset by title or `#ID`. Choose the intended asset when several results are returned.
4. Save the association for that product reference and the Xtanco `ds1` screen. Selecting another instance of the same reference retrieves the association; while selection is enabled, saved content can also appear when switching products.
5. Use **Mostrar en pantalla (Show on screen)** for a temporary preview of associated content in the twin. **Detener contenido (Stop content)** or clearing selection restores the screen's current schedule.

The [Xtanco link](https://www.xpaceos.com/admira-xp/?autostart=xtanco&quality=best&visual=best&select=products) opens the same Best pilot. The catalogue and twin share associations within the same browser and origin. Furniture instances and placement keep their IDs and transforms. If another item record controls ds1, the panel identifies that selection and retains the current form.

This pilot uses one virtual screen, `ds1`. Saved associations are local; preview is temporary. The flow does not publish to physical screens or change Matrix playlists or state. White labelling, the extensible shell, preferences and CLI history retain their existing functions. Yokup remains the ITIL master inventory.

## Contrato compartido / Shared contract

| Campo / Field | Contrato / Contract |
| --- | --- |
| Modelo / Model | Catálogo 2, `native:shelves`, perfil `best` / catalogue 2, `native:shelves`, `best` profile |
| Entrada / Entry | Catálogo / catalogue: `quality=best&select=products`; Xtanco: `visual=best&select=products`; selección en la columna Best de Todos / selection in the Best column of All |
| Recurso / Resource | [`inventario/assets/catalog/02/best.parts.json`](https://www.xpaceos.com/inventario/assets/catalog/02/best.parts.json) |
| Revisión / Revision | `shelves-parts-20261002-3` |
| Geometría / Geometry | `_XP_PART`: atributo para identificar componentes dentro de las 14 mallas web / attribute identifying components within the 14 web meshes |
| Identidad del envase / Container identity | `id` / `product_id`: `product-0-0`…`product-4-8`; `numeric_id` 1…45 en / in `_XP_PART` |
| Identidad del producto / Product identity | `product_reference`: seis referencias ilustrativas / six illustrative references, `A02-01`…`A02-06` |
| Clave de asociación / Association key | `bindings` por / keyed by `product_reference`; `surfaceId=ds1` en el valor / in the value |
| Contenido / Content | URL HTTPS o resultado Pixeria elegido por título o `#ID` / HTTPS URL or selected Pixeria result found by title or `#ID` |
| Alcance / Scope | Navegador y origen compartido; una pantalla virtual / shared browser and origin; one virtual screen |
| Persistencia / Persistence | `xpaceos:shelf-product-bindings:v1`; esquema / schema 1, `context=xtanco` |
| Canal de vista previa / Preview channel | `xpaceos:shelf-screen-preview:v1`: `localStorage` + `CustomEvent`, sin reproducción al inicializar / no replay on initialization |
| Confirmación / Confirmation | Canal / channel `xpaceos:shelf-screen-preview:v1:status`: `ready`, `showing`, `error`, `stopped`; `showing` tras el primer dibujo / after the first draw |
| Vista previa / Preview | Temporal; al detener o quitar selección se recupera la programación / temporary; stopping or clearing selection restores the schedule |
| MCP | `shelf_product_content` en / in `/mcp/manifest.json` y / and `/mcp/funcionalidades.json`; sin herramienta remota nueva / no new remote tool |

ES: El generador conserva 14 mallas de exportación y el mapeo de selección mediante `_XP_PART` y `best.parts.json`. La selección necesita el modelo y mapa de la misma revisión. No atribuir correspondencia uno a uno a Good/Better: su contenido mantiene una representación anterior de 55 envases. Al cambiar el modelo, validar IDs de componentes, referencias, cartelas, balda y posición antes de actualizar el mapa.

EN: The generator retains 14 export meshes and the selection mapping through `_XP_PART` and `best.parts.json`. Selection requires the model and map from the same revision. Good/Better do not have a one-to-one correspondence: their content retains an earlier representation of 55 containers. When changing the model, validate component IDs, references, shelf cards, shelf and position before updating the map.

Asociación / Association:

```json
{
  "schema_version": 1,
  "context": "xtanco",
  "bindings": {
    "A02-01": {
      "surfaceId": "ds1",
      "kind": "image",
      "url": "https://example.com/content.jpg",
      "title": "Contenido del producto / Product content",
      "updatedAt": 1790942400000
    }
  }
}
```

ES: `kind` admite `image` o `video`; `contentId` es opcional para una pieza de Pixeria. `updatedAt` y `createdAt` son timestamps numéricos en milisegundos. Los mensajes de vista previa llevan `schema_version`, `id`, `createdAt`, `context`, `action` (`preview` / `stop`), `surfaceId` y, para contenido, `kind`, `url`, `title`, `productId`. `productId` es la identidad del envase seleccionado, mientras que la asociación se recupera por referencia. El canal de estado devuelve `requestId`, `phase`, `text` y `error` cuando corresponda. Un estado `showing` o `stopped` de otra selección se comunica como tal si tiene esquema 1, contexto Xtanco y antigüedad máxima de 30 segundos; no cambia la ficha ni el borrador local. `ready` acredita que el medio está disponible; sólo `showing`, tras el primer dibujo, acredita la presentación en la pantalla virtual. Detener la vista previa conserva los pines `DS_PIN` y devuelve el render a la programación vigente.

EN: `kind` accepts `image` or `video`; `contentId` is optional for a Pixeria asset. `updatedAt` and `createdAt` are numeric timestamps in milliseconds. Preview messages carry `schema_version`, `id`, `createdAt`, `context`, `action` (`preview` / `stop`), `surfaceId` and, for content, `kind`, `url`, `title`, `productId`. `productId` identifies the selected container, while the association is retrieved by reference. The status channel returns `requestId`, `phase`, `text` and `error` when applicable. A `showing` or `stopped` state from another selection is reported as such when it has schema 1, Xtanco context and an age of at most 30 seconds; it preserves the local record and draft. `ready` confirms the medium is available; only `showing`, after the first draw, confirms presentation on the virtual screen. Stopping preview preserves `DS_PIN` pins and returns rendering to the current schedule.

## Estado y dependencias / Status and dependencies

ES: Piloto implementado para Best de la estantería #2, tanto en el catálogo como en Xtanco. Depende del GLB con `_XP_PART`, el mapa `best.parts.json`, el catálogo de Pixeria para las búsquedas y la pantalla virtual `ds1`. Comprobado en el navegador: selección exacta, asociación compartida por referencia, imagen y vídeo Pixeria en ds1, comunicación entre pestañas y restauración al detener. El registro de SKU y stock y la publicación en pantallas físicas quedan fuera de este piloto.

EN: Pilot implemented for shelf #2 Best, in both the catalogue and Xtanco. It depends on the GLB with `_XP_PART`, the `best.parts.json` map, the Pixeria catalogue for search and virtual screen `ds1`. Browser checks cover exact selection, shared reference associations, image and Pixeria video on ds1, cross-tab delivery and restoration when stopped. SKU and stock registration and publication to physical screens are outside this pilot.

[Tutorial ES/EN](https://www.xpaceos.com/help/#shelf-product-content) · [Ayuda MCP / MCP help](https://mcp.admira.store/help)

# Desglose de componentes / Component breakdown

## ES · Uso

Cada ficha del catálogo tiene **Desglose** junto a **Ver pieza**. Desglose muestra los elementos que componen el mueble o dispositivo: estructura, superficies, herrajes, equipamiento y contenido visual, según la pieza. Los grupos incluyen cantidades del modelo Best, notas y subcomponentes cuando están definidos. El selector ES/EN cambia el idioma de la lista.

1. Abre el [catálogo](https://www.xpaceos.com/inventario/) desde ITIL en Experto o mediante el comando existente `/inventario`.
2. Busca la pieza y pulsa **Desglose**. Despliega las filas con subcomponentes para ver su composición.
3. Consulta las fuentes enlazadas para revisar el modelo y su generador. **Ver pieza** conserva el visor 360 y las descargas del perfil seleccionado.

El [enlace de la estantería #2](https://www.xpaceos.com/inventario/?asset=2&quality=best&view=breakdown#catalog) abre directamente su desglose. Añade `&lang=en` para inglés. La estantería conserva `native:shelves` y el número 2; la lista separa su estructura del contenido visual.

Las cantidades describen piezas representadas en el modelo. Una cantidad sin determinar aparece como tal. No acreditan existencias, materiales físicos ni medidas verificadas. Consultar el desglose no modifica instancias, visibilidad, distribución, fichas ITIL, preferencias ni historial CLI. Yokup sigue siendo el maestro ITIL.

## EN · Usage

Every catalogue card has **Desglose (Breakdown)** beside **Ver pieza (View item)**. Breakdown lists the elements forming the furniture or device: structure, surfaces, hardware, equipment and visual filling as applicable. Groups include Best model quantities, notes and subcomponents when defined. The ES/EN selector changes the list language.

1. Open the [catalogue](https://www.xpaceos.com/inventario/) through ITIL in Expert or the existing `/inventory` command.
2. Find the item and click **Desglose (Breakdown)**. Expand rows with subcomponents to inspect their composition.
3. Follow source links to review the model and its generator. **View item** retains the 360 viewer and selected-profile downloads.

The [shelf #2 link](https://www.xpaceos.com/inventario/?asset=2&quality=best&view=breakdown#catalog) opens its breakdown directly. Add `&lang=en` for English. The shelf keeps `native:shelves` and number 2; its list separates structure from visual filling.

Quantities describe parts represented in the model. An undetermined quantity is shown accordingly. They do not establish stock, physical materials or verified measurements. Reading the breakdown preserves instances, visibility, placement, ITIL records, preferences and CLI history. Yokup remains the ITIL master.

## Contrato compartido / Shared contract

| Campo / Field | Contrato / Contract |
| --- | --- |
| Recurso / Resource | [`/inventario/components.json`](https://www.xpaceos.com/inventario/components.json) |
| Esquema / Schema | `schema_version: 1` |
| Revisión / Revision | `components-20261002-1` |
| Identidades / Identities | 50 modelos con `id` y `number` permanentes de `registry.json` / 50 models with permanent `id` and `number` from `registry.json` |
| Perfil / Profile | `best` |
| Base / Basis | `model`: cantidades de composición del modelo / model composition quantities |
| Alcance / Quantity scope | `quantity_scope: per_parent_unit` en componentes con hijos; cantidades principales por un activo / set on components with children; top-level quantities per asset |
| Procedencia / Provenance | `source`: array de rutas relativas al repositorio / array of repository-relative source paths |
| Grupos / Groups | `label: {es, en}` y `components` / bilingual labels and components |
| Componentes / Components | `id`, `label: {es, en}`, `quantity: number \| null`, `note` opcional / optional `note` |
| Subcomponentes / Subcomponents | `components` opcional, con componentes del mismo formato / optional same-format child components |
| Navegación / Navigation | `asset=<number>`, `quality=best`, `view=breakdown`, `lang=es\|en` |
| Contrato MCP / MCP contract | `inventory_breakdown` en `/mcp/manifest.json` y `/mcp/funcionalidades.json` / in both static MCP documents |

ES: El desglose es una lectura del catálogo. No añade un verbo CLI ni una herramienta MCP remota. Fuente semántica reproducible: `admira-xp/tools/xpacios-blender/build_components.py`; genera `components.json` y valida con `--check`. Al regenerar un modelo, actualizar también sus componentes y procedencia, conservar su ID y número, y validar la correspondencia con el registro. La lista cubre las piezas actuales; no registra automáticamente nuevos modelos de Pixeria ni activos patrimoniales.

EN: Breakdown is a catalogue read action. It adds no CLI verb or remote MCP tool. Reproducible semantic source: `admira-xp/tools/xpacios-blender/build_components.py`; it generates `components.json` and validates with `--check`. When regenerating a model, update its components and provenance, preserve its ID and number, and validate alignment with the registry. The list covers current items; it does not automatically register new Pixeria models or lifecycle assets.

## Estado y dependencias / Status and dependencies

ES: Implementación: acción junto a Ver pieza, diálogo de grupos y componentes, ES/EN, enlaces de procedencia y enlace directo. Depende del registro del catálogo y de sus fuentes de geometría. La composición procede del diseño representado; comprobar stock, materiales y medidas de cada unidad física sigue pendiente de evidencia de inventario.

EN: Implementation: action beside View item, groups and components dialog, ES/EN, provenance links and direct link. It depends on the catalogue registry and geometry sources. Composition comes from the represented design; verifying stock, materials and dimensions of physical units requires inventory evidence.

[Tutorial ES/EN](https://www.xpaceos.com/help/#inventory-breakdown) · [Ayuda MCP / MCP help](https://mcp.admira.store/help)


## Estantería Starbucks 47 / Starbucks shelf 47

La estantería Starbucks 47 conserva native:starbucksShelves, la instancia sb-mugs y el CI PDG103-EST-01. Best muestra el mueble de cinco niveles interpretado desde la foto de Carlos. Despiece y productos abre una colección 3D con vasos, termos, tazas y café independientes y 26 referencias visuales descargables. Cada objeto conserva su identidad de componente. Los productos son una composición visual: no son SKU comerciales ni fichas CI nuevas y las cantidades no acreditan stock. El maestro patrimonial sigue en Yokup.

Starbucks shelf 47 retains native:starbucksShelves, instance sb-mugs and CI PDG103-EST-01. Best shows the five-level cabinet interpreted from Carlos’s photograph. Separated parts and products opens a 3D collection of independent cups, tumblers, mugs and coffee with 26 downloadable visual references. Each object keeps its component identity. Products form a visual composition: they are not commercial SKUs or new CI records, and quantities do not establish stock. Yokup remains the lifecycle master.

[Guía ES/EN / ES/EN guide](https://www.xpaceos.com/admira-xp/docs/starbucks-coffee-display.md) · [Colección 3D / 3D collection](/inventario/assets/catalog/47/collection/preview/)

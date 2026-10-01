# Proyecto y local / Project and venue

ES: Opciones → Proyecto y local permite cambiar entre Xtanco (proyecto estancos), Cafebrería (cafebreria) y Starbucks (starbucks / alsea_starbucks). La cabecera muestra el proyecto actual. Starbucks abre Paseo de Gracia 103, ID alsea-sbux-021; Xtanco y Cafebrería se identifican como demostraciones sin local real vinculado. Los otros 17 proyectos del catálogo de admira.app aparecen sin gemelo vinculado y no abren escenas inventadas. Calidad se elige aparte; salir de Matrix cambia a Better para no volver a Starbucks. El cambio conserva dominio e idioma y elimina el contexto de player/cámara del local anterior. Opciones y Avanzado comparten tarjetas, iconos de línea y foco de teclado con Experto; conservan sus acciones y resize con un ancho mínimo legible.

EN: Options → Project and venue switches between Xtanco (estancos project), Cafebrería (cafebreria) and Starbucks (starbucks / alsea_starbucks). The header shows the current project. Starbucks opens Paseo de Gracia 103, stable ID alsea-sbux-021; Xtanco and Cafebrería are identified as demos without a linked real venue. The other 17 admira.app projects appear without linked twins and do not open invented scenes. Quality is separate; leaving Matrix falls back to Better to avoid reopening Starbucks. Switching preserves host and language and clears the previous venue’s player/camera context. Options and Advanced share Expert’s cards, line icons and keyboard focus, retain original actions and resize with readable minimum widths.

## Contrato compartido / Shared contract

{
  "catalog_source": "https://www.admira.app/expert-commands.js?v=20261001-shell-2",
  "catalog_snapshot": "https://www.xpaceos.com/admira-xp/scripts/project-catalog.json",
  "catalog_update": "node admira-xp/scripts/sync-project-catalog.mjs",
  "project_parameter": "project",
  "circuit_parameter": "circuit",
  "venue_parameter": "loc",
  "supported": {
    "estancos": {
      "circuit": "estancos",
      "vertical": "xtanco",
      "venue": "demo"
    },
    "cafebreria": {
      "circuit": "cafebreria",
      "vertical": "cafeteria",
      "venue": "demo"
    },
    "starbucks": {
      "circuit": "alsea_starbucks",
      "vertical": "cafeteria",
      "loc": "alsea-sbux-021"
    }
  },
  "pending": "Central registry API and authenticated project/venue association management; no backoffice storage/auth shared across domains. Unlinked clients are disabled, not fake twins.",
  "es": "Opciones → Proyecto y local permite cambiar entre Xtanco (proyecto estancos), Cafebrería (cafebreria) y Starbucks (starbucks / alsea_starbucks). La cabecera muestra el proyecto actual. Starbucks abre Paseo de Gracia 103, ID alsea-sbux-021; Xtanco y Cafebrería se identifican como demostraciones sin local real vinculado. Los otros 17 proyectos del catálogo de admira.app aparecen sin gemelo vinculado y no abren escenas inventadas. Calidad se elige aparte; salir de Matrix cambia a Better para no volver a Starbucks. El cambio conserva dominio e idioma y elimina el contexto de player/cámara del local anterior. Opciones y Avanzado comparten tarjetas, iconos de línea y foco de teclado con Experto; conservan sus acciones y resize con un ancho mínimo legible.",
  "en": "Options → Project and venue switches between Xtanco (estancos project), Cafebrería (cafebreria) and Starbucks (starbucks / alsea_starbucks). The header shows the current project. Starbucks opens Paseo de Gracia 103, stable ID alsea-sbux-021; Xtanco and Cafebrería are identified as demos without a linked real venue. The other 17 admira.app projects appear without linked twins and do not open invented scenes. Quality is separate; leaving Matrix falls back to Better to avoid reopening Starbucks. Switching preserves host and language and clears the previous venue’s player/camera context. Options and Advanced share Expert’s cards, line icons and keyboard focus, retain original actions and resize with readable minimum widths."
}

El catálogo se exporta del registro público de admira.app, incluyendo hash y fecha de revisión; no se ejecuta código remoto. Actualizar con el comando anterior al cambiar el registro. / The catalog is exported from admira.app’s public registry with source hash and review date; remote code is not executed. Refresh it with the command above when the registry changes.

La asociación xpaceUrl propia del local en admira.app sigue teniendo prioridad. El selector sólo navega entre los adaptadores disponibles; no modifica asociaciones ni sustituye la selección autenticada del backoffice. Compartir la URL conserva project, circuit y loc. / A venue’s explicit xpaceUrl in admira.app retains precedence. The selector only navigates available rendering adapters; it does not edit associations or replace authenticated backoffice selection. Shareable URLs retain project, circuit and loc.

Pendiente: API común autenticada para lista de proyectos/locales y sus asociaciones; nuevos gemelos por local, sin deducirlos por marca. No se ha encargado ni modificado otro proyecto. / Pending: shared authenticated project/venue association API and additional venue twins, never inferred from a brand. No changes or assignments were made in another project.

Los layouts guardados mantienen sus claves actuales: xtanco, xtanco_cafeteria y starbucks_pg103_v1. / Saved layouts retain their current namespaces: xtanco, xtanco_cafeteria and starbucks_pg103_v1.

Verificación: pruebas de aislamiento de rutas, catálogo/IDs, cambio desde Matrix y restricciones de Cafebrería; comprobación visual ES/EN, selector y resize de menús. Hoy #103 · DCL-6be09f7100e91e3ee3829958.

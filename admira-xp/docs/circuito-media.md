# Gemelo por punto · media por orientación (`&media=`) — Altadis BCN 9

**ES.** `admira-xp/scripts/circuito-nav.js` ya honra `surfaces[].orient` (vertical/horizontal) y `surfaces[].media` de la ficha del punto (`api.admira.store/da/locations`) y añade anterior/siguiente entre los puntos del circuito en su `tourOrder`. Nuevo (rama de vista previa `altadis/gemelos-formatos18`, sin fusionar):

- `&media=formatos18` → cada pantalla vertical reproduce `/altadis/media/01-vertical-1080x1920.mp4` (9:16) y cada horizontal `/altadis/media/02-horizontal-1920x1080.mp4` (16:9): pieza JTI «Tu sitio de siempre» renderizada a los 18 formatos Altadis.
- `&mv=<url>` / `&mh=<url>` → vídeo propio para vertical / horizontal (https o ruta del sitio).
- Sin parámetro → media de la ficha, como siempre. No modifica la ficha del punto (KV). La navegación ◀ ▶ y `&tour=` conservan el parámetro. El HUD lo indica.
- Ejemplo: `/admira-xp/?autostart=cafeteria&project=estancos&loc=altadis-bcn-001&media=formatos18`

**EN.** `&media=formatos18` (or `&mv=` / `&mh=`) overrides each twin screen's video by orientation (vertical → 9:16, horizontal → 16:9) without touching the location record. Without the parameter the record's `media` is used. Prev/next and `&tour=` keep the parameter. Preview branch only; not merged.

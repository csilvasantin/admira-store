# /demo global · Sneakers Store

## Español

Ejecuta /demo global en Experto o abre admira.biz/demo/. Recorre Proyecto → Xpacio → Playlist → Gemelo → Cámara y tutorial. Sneakers Store utiliza el proyecto sneakers-store y el Xpacio sneakers-store-santa-rosa-19, Santa Rosa 19, Barcelona. Las playlists por formato contienen piezas publicadas de Pixeria (Stock 665 horizontal; 990 y 964 verticales); Preparar playlists por formato conserva sus IDs al repetir con una sesión autorizada. SneakerStore abre la tienda real en un recorrido fotográfico 360 con Entrada, Centro y Fondo, recuperados de IEU el 8 de octubre de 2026. Arrastra o usa las flechas para mirar alrededor. Planta 3D abre la distribución editable, adaptada al pasillo estrecho, la chapa acanalada, los expositores negros, las recreativas, la puerta IOT Gallery y la caja del fondo; Ver pantalla reproduce la playlist Pixeria conectada. Las pantallas de la fotografía conservan el contenido de la captura; la playlist activa se ve en Ver pantalla y en la pantalla lateral del modelo 3D. Opciones queda a la izquierda, Avanzado a la derecha y Experto abajo. /distribuir edita el mobiliario en este navegador; /inventario lo consulta. La guía permite detener, avanzar y exportar una plantilla sin credenciales para el siguiente proyecto. IEU se abre manualmente: Store → Entrada → Puerta Cam → Ver stream; vuelve a Xtore, comparte esa pestaña y marca dos puntos para encuadrar la cámara. iPad y pantalla son opcionales. Jordan + LCD abre una vista frontal de la pared: el videowall Jordan de cinco paneles queda a la izquierda y la LCD gigante a su derecha, separados. Jordan utiliza la imagen capturada en Entrada de IEU; la LCD reproduce la playlist activa. También está en Avanzado → Pared · Jordan + LCD y en ?view=jordan. Desde la puerta hacia la caja, ambos están en el lateral izquierdo; las recreativas están enfrente. La revisión jordan-wall-v4 respalda el estado anterior de real-store-v2 y corrige sólo las posiciones predeterminadas, conservando las ubicaciones modificadas expresamente, fichas, bloqueos, visibilidad y borrados. La geometría 3D es aproximada, pendiente de medición; no activa dispositivos físicos ni crea una cámara IEU.

## English

Run /demo global in Expert or open admira.biz/demo/. Follow Project → Xpace → Playlist → Twin → Camera and tutorial. Sneakers Store uses project sneakers-store and venue sneakers-store-santa-rosa-19 at Santa Rosa 19, Barcelona. Its playlists by format contain published Pixeria pieces (Stock 665 landscape; 990 and 964 portrait); Prepare playlists by format retains their IDs on repeat with an authorized session. SneakerStore opens the real store as a photographic 360 tour with Entrance, Centre and Rear, recovered from IEU on 8 October 2026. Drag or use the arrow keys to look around. 3D floor plan opens an editable layout adapted to the narrow aisle, corrugated metal, black displays, arcade machines, IOT Gallery door and rear checkout; View screen plays the connected Pixeria playlist. Screens in the photograph retain the captured content; the active playlist appears in View screen and on the 3D model side display. Options is on the left, Advanced on the right and Expert below. /distribuir edits furniture in this browser; /inventario lists it. Pause, next and a credential-free template export support the next project. Open IEU manually: Store → Entrance → Puerta Cam → View stream; return to Xtore, share that tab and mark two points for the camera crop. iPad and screen are optional. Jordan + LCD opens a frontal wall view: the five-panel Jordan videowall is on the left and the giant LCD to its right, with space between them. Jordan uses the captured IEU Entrance image; the LCD plays the active playlist. It is also available in Advanced → Wall · Jordan + LCD and at ?view=jordan. From the door towards checkout, both are on the left side; the arcades are opposite. Revision jordan-wall-v4 backs up the previous real-store-v2 state and corrects only default positions, preserving explicitly edited placements, records, locks, visibility and deletions. The 3D geometry is approximate, awaiting measurements; it does not activate physical devices or create an IEU camera.

## Contrato compartido / Shared contract

Formatos de pantalla: la LCD horizontal usa Stock 665 (1280×720, horizontal/landscape/16:9); la pantalla vertical de entrada usa Stock 990 (1080×1920) y 964 (360×640), vertical/portrait/9:16. En el paso Playlist, Preparar playlists por formato crea o actualiza cada canal con sesión autorizada y conserva sus IDs. El servidor consulta los tags actuales de Pixeria y rechaza formatos incompatibles, ausentes o contradictorios. El reproductor comprueba también las dimensiones reales antes de reproducir; no estira ni recorta una pieza vertical para llenar la LCD. Ver pantalla permite elegir LCD horizontal o Entrada vertical. Jordan sigue siendo la captura fija de cinco paneles y las panorámicas conservan la fotografía original.

Screen formats: the landscape LCD uses Stock 665 (1280×720, horizontal/landscape/16:9); the entrance portrait screen uses Stock 990 (1080×1920) and 964 (360×640), vertical/portrait/9:16. In the Playlist step, Prepare playlists by format creates or updates each channel with an authorized session and retains its IDs. The server checks current Pixeria tags and rejects incompatible, missing or conflicting formats. The player also checks actual media dimensions before playback; it does not stretch or crop a portrait piece to fill the LCD. View screen lets you select landscape LCD or portrait entrance. Jordan remains the captured five-panel still and panoramas retain the original photograph.

```json
{
  "project_id": "sneakers-store",
  "circuit": "sneakerstore",
  "location_id": "sneakers-store-santa-rosa-19",
  "category": "SneakerStore",
  "guide": "https://www.admira.biz/demo/",
  "twin": "https://www.admira.store/xpacios/sneakerstore/",
  "state": "https://www.admira.biz/api/demo-global?project=sneakers-store",
  "playlist_id": "playlist-be8a1e99-1cce-4818-a796-da3372216d1e",
  "playlist": "https://mcp.admira.store/playlists/playlist-be8a1e99-1cce-4818-a796-da3372216d1e",
  "virtual_screen": "sneakers-store-santa-rosa-19-screen",
  "camera": "manual IEU Puerta Cam; 2-point camera crop; optional iPad/screen corners",
  "physical_control": false,
  "representation": {
    "default": "photographic-360",
    "scenes": [
      "entrada",
      "centro",
      "fondo"
    ],
    "source": "IEU Store · 2026-10-08",
    "editable_model": "?view=model",
    "measurements": "approximate, not surveyed",
    "photo_screens": "captured content; active playlist in View screen / 3D side display",
    "layout_revision": "rear-led-door-v5; previous jordan-wall-v4 backed up once; only default counter corrected; explicit edits retained",
    "scene_links": {
      "entrada": "https://www.admira.store/xpacios/sneakerstore/?scene=entrada",
      "centro": "https://www.admira.store/xpacios/sneakerstore/?scene=centro",
      "fondo": "https://www.admira.store/xpacios/sneakerstore/?scene=fondo"
    },
    "orientation": {
      "basis": "street door towards rear checkout",
      "left": [
        "Jordan videowall, five panels",
        "giant LCD",
        "entrance portrait display",
        "iPad",
        "rear bench"
      ],
      "right": [
        "long shoe display",
        "vertical LED column",
        "Star Wars arcade",
        "Super Mario arcade"
      ],
      "coordinates": {
        "entrance_z": 0,
        "checkout_z": 14,
        "left_x": 4,
        "right_x": 0
      },
      "dimensions": "interpreted units, not measured metres"
    },
    "wall_view": {
      "url": "https://www.admira.store/xpacios/sneakerstore/?view=jordan",
      "basis": "facing the display wall",
      "left": "Jordan videowall, five panels; captured IEU Entrada still",
      "right": "giant LCD; active Pixeria playlist",
      "source": "jordan-reference.mjs; UV quadrilaterals from original entrada.jpg"
    },
    "rear_view": {
      "url": "https://www.admira.store/xpacios/sneakerstore/?view=rear",
      "basis": "street entrance towards rear; right is x=0",
      "led": "back-wall; one landscape video canvas split around central doorway; same validated playlist as LCD",
      "door": "rear-door; central physical model door, not painted into video",
      "counter": "counter; right wall, countertop edge x=0; only default pose migrated",
      "measurements": "approximate, not surveyed"
    }
  },
  "screen_formats": {
    "horizontal": {
      "screen_id": "sneakers-store-santa-rosa-19-screen",
      "playlist_id": "playlist-be8a1e99-1cce-4818-a796-da3372216d1e",
      "stock_numbers": [
        665
      ],
      "verified_dimensions": [
        [
          1280,
          720
        ]
      ],
      "state": "https://www.admira.biz/api/demo-global?project=sneakers-store&channel=horizontal",
      "additional_screen_ids": [
        "sneakers-store-santa-rosa-19-rear-led"
      ]
    },
    "vertical": {
      "screen_id": "sneakers-store-santa-rosa-19-entry-display",
      "stock_numbers": [
        990,
        964
      ],
      "verified_dimensions": [
        [
          1080,
          1920
        ],
        [
          360,
          640
        ]
      ],
      "state": "https://www.admira.biz/api/demo-global?project=sneakers-store&channel=vertical",
      "playlist_id": "playlist-cadea3fa-89fe-40f9-828f-bd37ce4720db",
      "playlist": "https://mcp.admira.store/playlists/playlist-cadea3fa-89fe-40f9-828f-bd37ce4720db"
    },
    "validation": "Current Pixeria orientation tags required; actual decoded dimensions checked before playback; incompatible/unknown/conflicting formats blocked; square assets blocked on both channels",
    "jordan": "captured still across five portrait panels; not a live playlist"
  }
}
```

La identidad se valida con Google en el servidor. csilva@admira.com y csilvasantin@gmail.com pueden gestionar el catálogo; el permiso Gmail no amplía el control físico. / Server-side Google validation allows the corporate identity and the named Gmail identity to manage the catalogue; the Gmail permission does not expand physical control.

Estado guardado en AdmiraNext D1 (proyecto/local), Omnip (ficha) y MCP/D1 (playlist). La distribución del gemelo es local al navegador. / Project and venue live in AdmiraNext D1, the listing in Omnip and the playlist in MCP/D1. Twin layout is browser-local.

El espejo automático conserva esta entrega: si XpaceOS aún no contiene el contrato SneakerStore, la sincronización se detiene antes de borrar archivos. / Automatic mirroring stops before deleting delivered SneakerStore files if the XpaceOS source lacks this contract.

## Referencia real / Real-store reference

Las tres fotografías originales se conservan en `xpacios/sneakerstore/panoramas/`. Proceden de la sesión autorizada de Store en IEU; no incluyen vídeo de cámaras, cookies ni credenciales. El recorrido funciona sin mantener abierta esa sesión. La pantalla Puerta Cam y la segmentación siguen en IEU/Xtore y requieren la selección manual de pestaña. / The three original photographs are retained in `xpacios/sneakerstore/panoramas/`, obtained from the authorized IEU Store session; no camera footage, cookies or credentials are included. The tour works without that session. Puerta Cam and segmentation remain in IEU/Xtore and require manual tab selection.

La planta usa una envolvente interpretativa de 4 × 14 unidades; no acredita medidas del local. Las fotografías son la referencia visual fiel. El mobiliario anterior permanece en su clave local original; los cambios nuevos utilizan el sufijo `:real-store-v2` sobre el mismo identificador de Xpacio. / The plan uses an interpreted 4 × 14 unit envelope; this is not a measured survey. Photographs are the faithful visual reference. Previous furniture edits remain at their original local key; new edits use suffix `:real-store-v2` with the same venue identity.

## Orientación verificada / Verified orientation

Jordan + LCD abre una vista frontal de la pared: el videowall Jordan de cinco paneles queda a la izquierda y la LCD gigante a su derecha, separados. Jordan utiliza la imagen capturada en Entrada de IEU; la LCD reproduce la playlist activa. También está en Avanzado → Pared · Jordan + LCD y en ?view=jordan. Desde la puerta hacia la caja, ambos están en el lateral izquierdo; las recreativas están enfrente. La revisión jordan-wall-v4 respalda el estado anterior de real-store-v2 y corrige sólo las posiciones predeterminadas, conservando las ubicaciones modificadas expresamente, fichas, bloqueos, visibilidad y borrados.

Jordan + LCD opens a frontal wall view: the five-panel Jordan videowall is on the left and the giant LCD to its right, with space between them. Jordan uses the captured IEU Entrance image; the LCD plays the active playlist. It is also available in Advanced → Wall · Jordan + LCD and at ?view=jordan. From the door towards checkout, both are on the left side; the arcades are opposite. Revision jordan-wall-v4 backs up the previous real-store-v2 state and corrects only default positions, preserving explicitly edited placements, records, locks, visibility and deletions.

La revisión mantiene el identificador de pantalla y la playlist compartida. Las dimensiones siguen siendo interpretativas; las panorámicas originales no se modifican. / Screen identity and shared playlist are retained. Dimensions remain interpreted; original panoramas are unchanged.


## Fondo LED, puerta y mesa / Rear LED, door and table

Fondo LED abre el fondo 3D con una pantalla LED continua interrumpida por una puerta central real del modelo y la mesa de caja pegada a la pared derecha, mirando desde la entrada. Está también en Avanzado → Fondo · LED, puerta y mesa y en ?view=rear. El LED comparte la playlist horizontal de la LCD; tres superficies conservan un único lienzo y sus proporciones, con el hueco físico de la puerta. rear-led-door-v5 respalda una vez el estado jordan-wall-v4 y mueve sólo la mesa que conserva su posición predeterminada; mantiene ediciones, historial, bloqueos, visibilidad y borrados. La geometría sigue siendo aproximada, pendiente de medidas.

Rear LED opens the 3D rear with a continuous LED screen interrupted by a central model door and the checkout table against the right wall, looking from the entrance. It is also in Advanced → Rear · LED, door and table and at ?view=rear. The LED shares the LCD landscape playlist; three surfaces preserve one canvas and its aspect ratio around the physical door opening. rear-led-door-v5 backs up jordan-wall-v4 once and moves only a checkout table still at its default position; edits, history, locks, visibility and deletions are retained. Geometry remains approximate, awaiting measurements.

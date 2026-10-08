# /demo global · Sneakers Store

## Español

Ejecuta /demo global en Experto o abre admira.biz/demo/. Recorre Proyecto → Xpacio → Playlist → Gemelo → Cámara y tutorial. Sneakers Store utiliza el proyecto sneakers-store y el Xpacio sneakers-store-santa-rosa-19, Santa Rosa 19, Barcelona. La playlist compartida contiene piezas publicadas de Pixeria (Stock 990 y 964); se crea una sola vez al pulsar Crear playlist con una sesión autorizada y vuelve a leerse al repetir la guía. SneakerStore abre la tienda real en un recorrido fotográfico 360 con Entrada, Centro y Fondo, recuperados de IEU el 8 de octubre de 2026. Arrastra o usa las flechas para mirar alrededor. Planta 3D abre la distribución editable, adaptada al pasillo estrecho, la chapa acanalada, los expositores negros, las recreativas, la puerta IOT Gallery y la caja del fondo; Ver pantalla reproduce la playlist Pixeria conectada. Las pantallas de la fotografía conservan el contenido de la captura; la playlist activa se ve en Ver pantalla y en la pantalla lateral del modelo 3D. Opciones queda a la izquierda, Avanzado a la derecha y Experto abajo. /distribuir edita el mobiliario en este navegador; /inventario lo consulta. La guía permite detener, avanzar y exportar una plantilla sin credenciales para el siguiente proyecto. IEU se abre manualmente: Store → Entrada → Puerta Cam → Ver stream; vuelve a Xtore, comparte esa pestaña y marca dos puntos para encuadrar la cámara. iPad y pantalla son opcionales. Jordan + LCD abre una vista frontal de la pared: el videowall Jordan de cinco paneles queda a la izquierda y la LCD gigante a su derecha, separados. Jordan utiliza la imagen capturada en Entrada de IEU; la LCD reproduce la playlist activa. También está en Avanzado → Pared · Jordan + LCD y en ?view=jordan. Desde la puerta hacia la caja, ambos están en el lateral izquierdo; las recreativas están enfrente. La revisión jordan-wall-v4 respalda el estado anterior de real-store-v2 y corrige sólo las posiciones predeterminadas, conservando las ubicaciones modificadas expresamente, fichas, bloqueos, visibilidad y borrados. La geometría 3D es aproximada, pendiente de medición; no activa dispositivos físicos ni crea una cámara IEU.

## English

Run /demo global in Expert or open admira.biz/demo/. Follow Project → Xpace → Playlist → Twin → Camera and tutorial. Sneakers Store uses project sneakers-store and venue sneakers-store-santa-rosa-19 at Santa Rosa 19, Barcelona. Its shared playlist contains published Pixeria pieces (Stock 990 and 964); an authorized user creates it once with Create playlist, and repeating the guide only reads it. SneakerStore opens the real store as a photographic 360 tour with Entrance, Centre and Rear, recovered from IEU on 8 October 2026. Drag or use the arrow keys to look around. 3D floor plan opens an editable layout adapted to the narrow aisle, corrugated metal, black displays, arcade machines, IOT Gallery door and rear checkout; View screen plays the connected Pixeria playlist. Screens in the photograph retain the captured content; the active playlist appears in View screen and on the 3D model side display. Options is on the left, Advanced on the right and Expert below. /distribuir edits furniture in this browser; /inventario lists it. Pause, next and a credential-free template export support the next project. Open IEU manually: Store → Entrance → Puerta Cam → View stream; return to Xtore, share that tab and mark two points for the camera crop. iPad and screen are optional. Jordan + LCD opens a frontal wall view: the five-panel Jordan videowall is on the left and the giant LCD to its right, with space between them. Jordan uses the captured IEU Entrance image; the LCD plays the active playlist. It is also available in Advanced → Wall · Jordan + LCD and at ?view=jordan. From the door towards checkout, both are on the left side; the arcades are opposite. Revision jordan-wall-v4 backs up the previous real-store-v2 state and corrects only default positions, preserving explicitly edited placements, records, locks, visibility and deletions. The 3D geometry is approximate, awaiting measurements; it does not activate physical devices or create an IEU camera.

## Contrato compartido / Shared contract

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
    "layout_revision": "jordan-wall-v4; previous real-store-v2 state backed up once; untouched defaults corrected; explicit edits retained",
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
    }
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

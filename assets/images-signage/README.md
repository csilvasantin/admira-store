# Imágenes de signage — "soltar y listo"

Suelta aquí imágenes (`.jpg/.png/.webp/.gif`) y haz push: la GitHub Action
`media-manifest.yml` regenera `manifest.json` y la página las añade a la rotación
de las pantallas como slides (kind `image`).

Nombre bonito opcional en `titles.json` (`{ "archivo.jpg": "Mi cartel" }`); si no,
se deriva del nombre del fichero.

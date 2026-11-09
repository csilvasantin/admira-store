# VozContenido → pantallas del gemelo / Voice Content → twin screens

**ES.** Los vídeos creados en [admira.studio/vozcontenido](https://www.admira.studio/vozcontenido/) se guardan en el Stock con la etiqueta `storeos`. Al abrir el gemelo (`/admira-xp/`) en admira.store o xpaceos.com, el gemelo lee el índice del Stock (`stock.admira.store/stock/index.json`, respaldo `api.admira.store/stock/list`) y añade a la playlist de pantallas hasta 30 vídeos con esa etiqueta. No se guardan en localStorage: cada carga trae los nuevos. Promesa pública: `window.XpaceStoreosStock` (nombres añadidos). El índice se reconstruye tras cada publicación (cron de respaldo cada 10 min).

**EN.** Videos made in Voice Content are saved to Stock tagged `storeos`. When the twin opens on admira.store or xpaceos.com it reads the Stock index and appends up to 30 of those videos to the screens playlist. Not persisted: every load picks up new ones. Public promise: `window.XpaceStoreosStock`.

Fuente / Source: `admira-xp/index.html` (bloque `XpaceStoreosStock`). Origen / Origin: admira-studio PR #156.

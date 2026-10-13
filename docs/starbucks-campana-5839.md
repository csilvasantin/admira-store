# Starbucks · campaña «Tu momento / Your moment» en el gemelo (encargos #5840 · #5843)

**ES.** Campaña Starbucks de marca blanca GOOD ES/EN que hizo Oráculo en admira.studio con el Creador y el Adaptador
(admira-studio #5839, PR borrador #32). Son cuatro MP4 H.264 de 25 fps y 10 s, sin audio, con su PNG. Están en
`admira-xp/media/starbucks-5839/` con el mismo SHA-256 que su `delivery.json`.

| Formato | Pantalla del gemelo | Orden |
|---|---|---|
| Vertical 1080×1920 ES + EN | Muro P1–P6 (9:16) | delante de las pistas de siempre |
| Vertical 1080×1920 ES + EN | TPV (9:16) | delante de los dos anuncios locales |
| Horizontal 1920×1080 ES + EN | iPad del mostrador (único apaisado, 4:3 con bandas) | delante de la foto |

Los vídeos van mudos, como todas las pantallas, y el hilo musical (Altavoz) sigue con su propia playlist.

- **Semillas:** `admira-xp/scripts/starbucks-demo.mjs` (`STARBUCKS_5839`, `DEMO_WALL`, `DEMO_TPV`, `DEMO_IPAD`) y los
  `starbucks-*-playlist.json` regenerados con `export-starbucks-{screens,tpv,ipad}.mjs`.
- **Estado vivo:** manda el MCP (`mcp.admira.store/matrix/starbucks`, `managed`). `starbucks-5840-propuesta.mjs` toma
  ese estado y devuelve el propuesto sin escribir nada. Para aplicarlo en producción, con visto bueno:
  1. publicar los medios (Stock o este sitio);
  2. ejecutar `node admira-xp/scripts/starbucks-5840-propuesta.mjs vivo.json <base>`;
  3. aplicar `wall`, `tpv` e `ipad` con `matrix_playlist_update`.
- **Vista previa (pendiente de publicar):** alias `sbux-5840-preview` de Cloudflare Pages, con el mismo método que
  `pantallas-vivas-preview.yml`. En esa copia, `matrix-remote.mjs` lee el estado propuesto
  (`admira-xp/preview/matrix-starbucks-5840.json`) en lugar del vivo; el repo no cambia. En la preview no pulses
  «Guardar» del editor: escribe en el MCP de producción.

**EN.** White-label GOOD ES/EN Starbucks campaign made by Oráculo in admira.studio (admira-studio #5839, draft PR #32).
It consists of four 10 s silent H.264 MP4s with their PNGs, stored in `admira-xp/media/starbucks-5839/` with the same
SHA-256 as their `delivery.json`.

- Vertical ES/EN goes first on the wall (P1–P6) and on the POS screen.
- Horizontal ES/EN goes first on the counter iPad, the only landscape surface.
- Videos stay muted and the background music keeps its own playlist.
- The live MCP state still rules production. `starbucks-5840-propuesta.mjs` computes the proposed state without
  writing anything.
- The branch preview serves that proposed state instead of the live one. Apply it through MCP only after approval.

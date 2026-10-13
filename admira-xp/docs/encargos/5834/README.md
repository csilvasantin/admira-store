# #5834 · SneakerStore preview

ES: Captura real de Chrome `preview-jordan-es.png`, con URL local visible. NEXT STEP cubre entrada, iPad, Jordan, LCD, tira y columna; el fondo LED conserva el hueco de puerta. Las pruebas verifican siete perfiles, trece salidas, encaje y restauración exacta de mapas, UV, posición y escala al detener. Pausa, reiniciar, detener y volver a iniciar probados desde Experto. No se publica producción.

EN: `preview-jordan-es.png` is a real Chrome capture with the local URL visible. NEXT STEP covers entrance, iPad, Jordan, LCD, strip and column; rear LED retains its doorway. Tests check seven profiles, thirteen outputs, aperture fit and exact map/UV/position/scale restoration on stop. Pause, restart, stop and start again checked through Expert. No production deployment.

Preview: http://127.0.0.1:8482/xpacios/sneakerstore/?campaign=next-step&view=jordan&lang=es .

Campaign/MCP evidence and remaining Admira.live assignment-state lookup are recorded in Pixeria `docs/encargos/5834/README.md`. The XpaceOS help preview runs locally at http://127.0.0.1:8483/mcp; production help remains unchanged.

Pages review / Revisión publicada: https://5834-next-step-preview.admira-store.pages.dev/xpacios/sneakerstore/?campaign=next-step&view=jordan&lang=es . `pages-preview-jordan-es.png` captures the deployed branch with its URL visible. Initial deployment https://8730dccb.admira-store.pages.dev; workflow https://github.com/csilvasantin/admira-store/actions/runs/38413686711 passed and confirmed the canonical production deployment ID unchanged.

The published review exposed an engine-first loading race: the shared engine deduplicates adapter IDs, so the demo adapter must resolve the current page verb on each command. A regression test now registers the shell handler first and the scene handler afterwards; every alias reaches the scene. Options → NEXT STEP uses the paired preview destination too.

Final interaction check / Comprobación final: deployed branch playback was checked in Chrome after the loading-order correction: ES pausa → reiniciar → detener; EN pause → stop → start. Status and restored textures matched each command. Workflow https://github.com/csilvasantin/admira-store/actions/runs/38414602804 passed all 37 Store tests and again confirmed production unchanged. The initial shell language now follows ?lang before mounting, so its welcome log and labels start in the selected language.

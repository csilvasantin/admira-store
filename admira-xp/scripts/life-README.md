# El Xtanco · immersive 3D

Open `/admira-xp/?autostart=xtanco&visual=better` or choose **Avanzado (▤) → Better · 16 bits**. The same selector is available inside the views: **Good · 8 bits**, **Better · 16 bits**, **Best · 32 bits**. The homepage's **Try the twin** uses Better; `visual=life` remains an alias. Escape / **Volver al gemelo** returns to Good and its operational tools without starting another game.

This is a stylized, procedural representation of the running layout, not a scan or a claim of photorealism. Customers are the existing game actors, not newly inferred camera detections. Camera-owned exterior traffic is not replaced with synthetic pedestrians.

## Ownership

- `life-snapshot.mjs` reads `__xtancoVisualState()`: layout, actors, palette, movement and existing counters. Stable actor identities, explicit palette conversion, no writes to simulation.
- `life-scene.mjs` builds beveled furniture, textured surfaces, articulated characters and three lighting moods. It owns geometry/materials/textures, not a clock or network. Positions interpolate over 100 ms visually; source positions remain intact.
- `life-renderer.mjs` owns the local Three.js renderer, orthographic camera, pointer/pinch/keyboard camera actions and selection. Render is driven by the UI. Scene disposal releases GPU resources.
- `life-ui.mjs` opens an isolated native modal, reads state at 10 Hz and renders while visible. It dynamically loads Three.js only on launch. It closes if the current game state can no longer be represented. `__xtancoReleaseInputs()` releases held gameplay keys when entering the modal.

The public tiers are **Good = classic**, **Better = this stylized 3D**, **Best = static conceptual preview**. Best navigation is available; its operational capabilities remain planned. It does not render live simulation state or certify a photorealistic twin. `xtanco-visual-tiers.mjs` owns routing and the versioned preference `xtanco_visual_tier_v2`; the old wireframe/hybrid preference is not migrated to an unrelated tier. `__xtancoPremiumView` remains a compatibility façade with no composition, keeping original operation callbacks intact. Legacy `data-xtanco-visual` stays `good` so camera traffic cannot acquire the old wireframe style; the public tier uses `data-xtanco-tier`.

Editor, live player, CLI and control panels remain available in Good. All immersive digital screens sample one shared canvas via the existing `__xtoreWindowPlayer.draw()` source. No extra video, stream, iframe or simulation is created by this view. Audio, measurement and operational interactions remain owned by the original game. Best's asset pipeline and pending real-world references are described in [best-production.md](./best-production.md).

## Controls

**Comparar con Good** uses a mapped orthographic camera aligned to the classic projection. This is a presentation comparison: model silhouettes and operational controls can still differ. **Explorar 3D** uses an independent camera: drag to orbit the cutaway, Shift+drag / right-drag to pan, wheel or pinch to zoom. Select objects or people to inspect existing labels. Escape returns to Good. Day / sunset / night changes presentation lighting only, never physical lights or the game clock.

`/modo best` opens the static preview. A successful local result includes `ok:true`, `preview:true` and `availability:"preview"`; it confirms navigation, not implementation of the 30 functional areas. `/modo` is not an MCP tool. The [functional catalog](../../mcp/funcionalidades.json) retains stable IDs and pending Best capabilities.

## Checks

`node --test admira-xp/scripts/life-*.test.mjs homepage-twin-cta.test.mjs`

Browser QA: direct entry, furniture selection, camera presets, lighting, portrait layout, close/reopen and failure fallback. Check the preserved premium/controller/operations suite before publishing. WebGL is required; if it cannot start, the modal offers retry or return to the existing game.

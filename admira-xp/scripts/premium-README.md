# Xtanco Better / Best renderer

This document describes the legacy `premium-renderer.mjs` API and its internal material-mode names. The public selector now uses **Avanzado → Good · 8 bits / Better · 16 bits / Best · 32 bits**: Better uses the Life view with comparison and exploration cameras; Best opens the live 3D store; the fourth Matrix option presents Avenida Admira in fixed-camera 2.5D layers, with editable furniture from the shared 43-model inventory and live twin people. Internal `mode:'best'` in the example below does not activate or validate the public Best tier. See [life-README.md](./life-README.md) and [best-production.md](./best-production.md).

`premium-renderer.mjs` provides a presentation of the existing Xtanco state. It owns no simulation, traffic counts, media playback, capture permissions, or animation loop.

```js
import {createPremiumRenderer} from './premium-renderer.mjs';
const view=createPremiumRenderer({
  canvas,
  mode:'best', // 'better' changes materials and edge visibility on the same graph
  getPlayer:()=>window.__xtoreWindowPlayer
});
view.update({cols:14,rows:8,wallHeight:3.25,layout:shopLayout,actors:[],doorOpen:0});
view.resize(1000,650,devicePixelRatio);
view.render(performance.now());
view.setMode('better');
view.fit();
view.dispose();
```

The owner calls `update` and `render`, ideally at most 30 times per second while visible. `resize` ignores unchanged dimensions. Closing the view disposes its GPU objects and event handlers; it does not stop the shared source. Reopening creates a new renderer on the same canvas without forcing context loss.

For the main Good interface, construct with `integrated:true, controls:false` and supply `snapshot.projection={width,height,ox,oy,tileW,tileH}` using the main canvas's internal coordinates. This selects an exact orthographic mapping instead of fitting or orbiting the scene. Composite the offscreen WebGL canvas into the existing Canvas2D world before drawing its UI overlays. The drawing buffer is preserved between the throttled 3D frames, and no pointer or wheel handlers are installed. Scene background remains opaque to replace the previous world; the owner controls its clip. `project({col,row,height})` returns main-canvas coordinates; `unproject(x,y,height=0)` returns a point on a world-height plane.

The exact orthographic elevation is `asin(tileH/tileW)` and the vertical world-unit scale is `sqrt((tileW²-tileH²)/2)`. Snapshot wall and object heights must use this same scale. In integrated mode, furniture edits apply a world matrix mathematically equivalent to Good's pixel-space `rotate`/`scale`, preserving the same projected anchors and footprint transform. The renderer's designed asset silhouettes can still differ from the pixel-art originals; it does not redefine existing click regions.

Integrated mode renders architecture, floor, animated door and decorative `plant`, `rug`, `vending`, `wineRack`, `magazines`. It deliberately excludes every actor, and the `counter`, `shelves`, `lottery`, `manager`, `floorLamp`, `djBooth`, `tablet`, `turnKiosk`, `aroma`, `metahuman`, `custom`, `tft`, and `led` operational items. Good's original drawing pass supplies those operational objects once above the architecture. The integrated renderer also omits its decorative LED text, emissive fascia strips, camera fixture and all signage/window video planes while retaining the supporting walls and facade. Therefore integrated mode creates no signage texture and never samples a player; the existing operational overlay remains the sole visual media owner. Standalone mode retains its full scene and shared texture behavior.

The snapshot uses grid units: furniture has its existing `id/type/col/row/sx/sy/rot/flipX`; optional custom `fp` is a footprint pair, and `ph` is height in world units. Furniture decoration is procedural, with no external assets. Actor input is `{id,col,row,kind,color,skin,heading,walking}`. `heading` is radians. The caller converts existing projected actor foot positions using `actorGridPosition` from `premium-model.mjs`. `wallHeight = wallH / (tileW / sqrt(2) * cos(elevation))` preserves architectural proportions when using the exact elevation above.

The renderer keeps stable actor nodes, rebuilding architecture only when layout or room dimensions change. A mode switch preserves object identities. Both modes use the same scene graph, camera, transforms and shared signage texture. Dragging horizontally changes the viewing angle; the wheel changes zoom. `fit()` restores the initial angle and fitted view.

All connected screen surfaces reference one CanvasTexture. It samples the existing player's `draw(ctx,width,height)` at most 15 times per second; no additional video element, audio or getDisplayMedia call is created. When no source exists, an ADMIRA placeholder is drawn. The scene does not invent audience or exterior statistics.

Best uses standard roughness/metalness materials, hemisphere and directional lighting, and soft shadow maps. Better uses dark surface fills and cyan edge geometry; signage remains readable. Interior/exterior geometry is a procedural architectural interpretation of the active layout, not a measured scan or imported Blender scene.

Three.js 0.160.0 is vendored locally in `premium-three.mjs`, matching the existing scan viewers' pinned version. The MIT license is included in `premium-three.LICENSE`. There are no runtime CDN imports or model downloads. The version is intentionally pinned; an upgrade should include visual regression testing.

Run the offline contract/resource tests with:

```sh
node --test admira-xp/scripts/premium-scene.test.mjs admira-xp/scripts/premium-projection.test.mjs
```

They verify shared object identity across modes, snapshot immutability, actor updates, a single shared media texture, transient resource disposal under layout/actor churn, coordinate conversion and invalid-input bounds. Actual lighting, clipping and WebGL availability also require browser visual review.

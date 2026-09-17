# Matrix visitors: atlases C and D

Generated on 2026-09-15 for Yokup mission #215 using the built-in `image_gen` tool, not the API/CLI fallback. Each PNG contains six entirely fictional, fully dressed human cutouts in a 3-column × 2-row grid. Original outputs were copied into this directory without resizing, cropping, recoloring or alpha processing.

- [Atlas C](atlas-c.png), exact prompt: [atlas-c.prompt.txt](atlas-c.prompt.txt).
- [Atlas D](atlas-d.png), exact prompt: [atlas-d.prompt.txt](atlas-d.prompt.txt).

Both files are 1536 × 1024, RGBA, with 512 × 512 cells. Read cells in row-major order. The camera faces the figures from a raised rear three-quarter angle. Use each person's measured bounds to normalize height and align the feet; the generated figures are not all perfectly centered in their cells. Child/adult world height is a rendering decision.

Visual review confirmed six complete and separate figures per atlas, correct clothing/age categories, no text or cell borders, and clean cutout contours. Reading alpha values confirmed genuine transparency: C has 1,256,698 alpha-zero pixels, D has 1,305,444 alpha-zero pixels, out of 1,572,864. Alpha ranges from 0 to 254; faint values 1–3 outside the cutouts are negligible but should not be used to compute object bounds. No image postprocessing was applied.

## Character bounds

Bounds are local to each 512 × 512 cell at alpha ≥ 128, in `[left, top, right, bottom]` format; right and bottom are exclusive. A suitable default foot anchor is the horizontal midpoint of the bounds and their bottom.

| Cell | Atlas C | Atlas D |
| --- | --- | --- |
| 1 | `[197,13,397,506]` | `[204,81,337,469]` |
| 2 | `[158,34,359,500]` | `[192,68,329,471]` |
| 3 | `[140,9,302,506]` | `[182,20,339,489]` |
| 4 | `[184,28,393,489]` | `[186,11,364,480]` |
| 5 | `[178,43,346,471]` | `[167,14,344,481]` |
| 6 | `[161,52,324,472]` | `[178,21,340,479]` |

## Provenance

Built-in output directory: `/Users/csilvasantin/.codex/generated_images/01a0a643-90cc-7931-a39f-29a4956120b5/`.

- C source: `exec-caded754-6bab-4fd2-804b-a0fbcc64ca9d.png`.
- D source: `exec-66f2bd02-972e-4a70-8c7b-27eb2fa23397.png`.

The original outputs remain intact at their generated paths. These assets are photographic sprites, not 3D meshes or animated skeletal models.

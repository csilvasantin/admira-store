# Taller 3D

Guía completa / full guide: [/admira-xp/docs/taller-3d.md](../../docs/taller-3d.md).

```sh
# Python con Pillow y NumPy (TALLER_PY) + Blender 5.x (BLENDER)
admira-xp/tools/taller-3d/taller.sh admira-xp/tools/taller-3d/recetas/botellero-pg103.json
admira-xp/tools/taller-3d/taller.sh admira-xp/tools/taller-3d/recetas/cestas-pg103.json --fotos <fotos originales> --hoja <fuera del repo>
```

- `colocacion.py`: comprueba dónde va cada pieza (plano del local) y su CI de Yokup; imprime la línea del gemelo. Va primero. / Placement and Yokup CI check; runs first.
- `texturas.py`: operaciones de textura de una receta. / Recipe texture operations.
- `taller.py`: piezas en Good, Better, Best y Hiperreal. Se ejecuta dentro de Blender. / Pieces per tier (inside Blender).
- `comparativa.py`: hoja foto | 3D por pieza. / Photo | 3D sheet.
- `recetas/`: un JSON por encargo. / One JSON per job.
- `fuentes/<encargo>/`: recortes de objetos, sin personas. / Object crops, no people.

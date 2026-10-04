# Altadis · Estancos Barcelona — escena propia por punto

Misión FLT-101401 (encargo #4940, corrección a #4939) · 3-oct-2026 · NeoMacMini · MacMini.

## Qué hace

Los 9 puntos del circuito `altadis_bcn` de admira.app (`api.admira.store/da/locations`,
`tourOrder` 1-9) abren el gemelo con `/admira-xp/?loc=altadis-bcn-NNN`. Cada uno entra en
la **escena de estanco** (`autostart=xtanco`) y tiene la suya:

| Punto | Distribución | Sin | Pared |
|---|---|---|---|
| 001 | de serie | Mesa DJ, Metahuman | `#e0d4b8` |
| 002 | espejo | Mesa DJ | `#d8c8e0` |
| 003 | de serie | Botellero, Lámpara pie | `#c8dcc8` |
| 004 | espejo | Vending, Metahuman | `#e8d0b0` |
| 005 | de serie | Revistero, Mesa DJ | `#c8d4e4` |
| 006 | espejo | Lotería, Lámpara pie | `#e4c8c0` |
| 007 | de serie | Mesa DJ, Vending | `#d4dcb8` |
| 008 | espejo | Botellero, Metahuman | `#dcd0c0` |
| 009 | de serie | Metahuman, Lámpara pie, Revistero | `#c0d8dc` |

«Espejo» refleja las columnas de los muebles (el LED de la esquina se queda); los rótulos no
se voltean.

## Contrato

- Fuente: `ALTADIS_ESCENAS` en `admira-xp/index.html`; en ejecución, `window.XPACE_ALTADIS`
  (`escenas`, `escena()`, `layout(esc)`).
- Guardado: prefijo propio `xtanco_altadis-bcn-NNN`. Si el editor guardó una distribución
  en ese hueco, se carga esa; si no, la escena de la tabla. El Xtanco de serie (`xtanco`) no
  se toca.
- Nunca entran en Matrix ni en la cafetería, aunque venga guardado el nivel `matrix` o
  `?autostart=cafeteria` en la URL; calidad good/better.
- `scripts/circuito-nav.js` navega ◀ ▶ entre los 9 con `autostart=xtanco`.

## Antes

FLT-101352 (2-oct) los mandaba a la escena cafetería rotulada con el nombre del estanco.

---

EN: each of the 9 `altadis_bcn` points opens the tobacco-shop scene with its own layout,
wall colour and save slot (`xtanco_altadis-bcn-NNN`). Source `ALTADIS_ESCENAS` in
`admira-xp/index.html`, runtime `window.XPACE_ALTADIS`.

## Interruptor de pantallas

En cualquier estanco `?loc=altadis-bcn-NNN` hay un interruptor fijo:
**Sin adaptar** deja el contenido que ya tenía la sala.
**Adaptado con Pixeria** cambia la pantalla del fondo, las dos de la pared y la cinta de letreros
por un creativo de Pixeria (geometría y texto, sin marcas ajenas).
`?adapt=pixeria` abre ya en la posición adaptada. `?adapt=0` vuelve a Sin adaptar.

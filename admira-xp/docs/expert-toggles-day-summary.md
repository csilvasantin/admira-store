# Experto · Toggles y resumen / Toggles and summary

## Español

Experto usa un solo botón para Tótem, Avatar digital y Audiencia: luz verde y ON cuando está activo, luz roja y OFF cuando está apagado. Pulsar aplica el estado contrario y el indicador sigue los cambios del CLI. El resumen del día está OFF por defecto: /resumen dia on lo activa, /resumen dia off lo desactiva y cierra un resumen ya abierto. /resumen dia estado consulta la preferencia. La elección se conserva en este navegador. Sin resumen visible, el cierre guarda el histórico y avanza al siguiente día sin detener la experiencia.

## English

Expert uses one button for Totem, Digital avatar and Audience: green light and ON when active, red light and OFF when inactive. Clicking applies the opposite state; indicators also follow CLI changes. The end-of-day summary defaults OFF: /summary day on enables it, /summary day off disables it and dismisses an open summary. /summary day status reads the preference. The choice persists in this browser. With the summary hidden, daily closing still saves history and advances to the next day without interrupting the experience.

## Contract

`assets/expert-toggle.js` reads runtime state, aria-pressed and data-state on/off. `assets/day-summary.js` stores explicit on/off at `xpaceos.day-summary.v1`; absent key means OFF. Invalid summary commands remain local. Daily history is saved before optional presentation; disabling an open summary cancels its timer and advances once. CLI history and simulation economics are retained.

# Kanban de construcción · «El Templo de la Soledad de Superman»

> Estado de obra por **estación** (E1–E6) y **fase** (F0–F5), separando lo que es
> **SOFTWARE** (desarrollable aquí, en el repo) de lo que es **HARDWARE/OBRA**
> (intervención Yokup `iv-1784134056479` → Immersive Labs, técnico `tech-1784134939061`).
>
> Leyenda de estado: ✅ hecho · 🟡 en curso · ⬜ pendiente · ⛔ bloqueante
> Leyenda de tipo:   💻 software (Admira) · 🔩 hardware/obra (Yokup) · 📐 diseño
>
> Fuente: `planos-desarrollo.md` §11 (fases) y §5 (estaciones). Este documento
> vive en `build/` y se actualiza a medida que avanza cada artefacto.

---

## Resumen por fase

| Fase | Contenido | Responsable | Estado |
|---|---|---|---|
| **F0 · Diseño de detalle** | Plano CAD, guion por estación, persona Jor-El, BOM | Admira + escenografía | 🟡 |
| **F1 · Software y contenidos** | Persona Jor-El, escenas XPL, señalización E2, WebAR E5, kiosko E6, Xpacio en XpaceOS | Software Admira | 🟡 |
| **F2 · Fabricación** | Estatua, cápsula, vitrinas, mobiliario, esclusa, suelo | Escenografía | ⬜ |
| **F3 · Instalación en sala** | Obra, eléctrico/datos, AV, sensores, DMX, cámara | Yokup → Immersive Labs | ⬜ |
| **F4 · Integración y pruebas** | Puesta en marcha, reglas XPL en vivo, telemetría, RGPD, ensayo | Admira + Yokup | ⬜ |
| **F5 · Apertura y operación** | Go-live, uptime, incidencias Yokup, iteración | Operación | ⬜ |

---

## F1 · Software y contenidos — entregado en `build/` (este avance)

| Artefacto | Estación | Estado | Fichero |
|---|---|---|---|
| Persona Jor-El (system prompt + KB + saludo + voz + mount) | E1 | ✅ 💻 | `jorel-persona.md`, `jorel-persona.json` |
| Reglas XPL escenografía reactiva (esclusa, Kryptonita, Escudo por audiencia) | E4, E2, esclusa | ✅ 💻 | `xpl-templo.js` |
| Modelado del Templo como Xpacio (6 surfaces, segmentación, cámara) | E1–E6 | ✅ 💻 | `xpacio-templo.json` |
| Kanban de construcción (este documento) | — | ✅ 💻 | `checklist-construccion.md` |

**Pendiente de F1 (software, próximos avances):**
- ⬜ 💻 **E3 · La Capa** — ficha de reliquia + certificado NFT + checkout QR/NFC (front web + endpoint conversión).
- ⬜ 💻 **E5 · La Cápsula** — escena **WebAR** sin marcador + secuencia de mapping sincronizada.
- ⬜ 💻 **E1** — subir la persona Jor-El al cerebro `brain.digitalavatar.ai` (ruta/persona `jor-el`) — *depende del operador de digitalavatar.ai, no del repo.*
- ⬜ 💻 **E2** — dar de alta la creatividad "Escudo/emblema" como inventario en `omnipublicity-api` / parrilla `pixer-worker`.
- ⬜ 💻 **E6** — perfilar el kiosko `admira-xp` en modo Templo (escena, parrilla, megafonía, audiencia 3 salas).
- ⬜ 💻 **XPacio** — cargar `xpacio-templo.json` en el catálogo OmniPublicity (`window.OMNIP_LOCATIONS_DEFAULT` / KV via `omnipublicity-api`).

---

## Detalle por estación

### E1 · Cristal de Jor-El (holograma) — *estación estrella*
- ✅ 💻 Persona Jor-El (base de conocimiento, saludo, guardarraíles) — `jorel-persona.*`.
- ✅ 💻 Snippet `mount()` con brainUrl/voiceUrl (contrato `embed.js` verificado).
- ✅ 💻 Gancho de "despertar" desde XPL (`window.XPLTemplo.wake()` / regla revelación).
- ⬜ 💻 Persona cargada en `brain.digitalavatar.ai` (dep. operador digitalavatar.ai).
- 🔩 Panel/pantalla del holograma + montura **Pepper's Ghost** (opción B recomendada). → **Yokup F3**
- 🔩 Micrófono direccional + altavoz + botón/gesto de activación + mini-PC. → **Yokup F3**
- 🔩 (upgrade) Host GPU MetaHuman/Unreal Pixel Streaming (opción C). → **Yokup + infra, post go-live**
- Dependencias: red a Internet estable (cerebro/voz); penumbra (Pepper's Ghost).

### E2 · Escudo de la Casa de El (branding)
- ✅ 💻 Regla XPL de señalización condicional por perfil de audiencia (`crest` → classic/new52/snyder).
- ✅ 💻 Surface modelada en `xpacio-templo.json` (inventario monetizable, CPM €9).
- ⬜ 💻 Alta de creatividades del emblema en `omnipublicity-api` + parrilla `pixer-worker`.
- 🔩 Panel LED/LCD con forma de escudo (o proyección sobre relieve) + reproductor. → **Yokup F3**
- Dependencias: cámara de audiencia operativa (E-cam) para segmentar.

### E3 · La Capa (vitrina viva)
- ⬜ 💻 Ficha de la prenda + making-of + certificado (NFT) + checkout QR/NFC. → **F1 pendiente**
- ⬜ 💻 Tracking de escaneos → leads (proof-of-play).
- 🔩 Vitrina de metacrilato + pantalla táctil perimetral + lector NFC + sensor de apertura. → **Yokup F3**
- Dependencias: pieza física + iluminación de realce.

### E4 · La Kryptonita (zona reactiva)
- ✅ 💻 Reglas XPL: proximidad → bajar luces / debilitar estatua / ambiente (`xpl-templo.js`).
- ✅ 💻 Evento `templo:scene` para que la capa física (DMX/audio) lo consuma.
- ✅ 💻 Simuladores de sensor para demo (`XPLTemplo.setProximity/setPresence`).
- 🔩 Pieza translúcida + LED RGB interno. → **Yokup F3**
- 🔩 Sensores de proximidad ToF/PIR + controlador **DMX/DALI** + luminarias RGBW + audio. → **Yokup F3**
- Dependencias: nodo XPL en sala apuntando a `window.TEMPLO` (puente sensor→web) — *integración F4.*

### E5 · La Cápsula de Kal-El (AR + mapping)
- ⬜ 💻 Escena **WebAR** sin marcador (apertura de cápsula, viaje/aterrizaje). → **F1 pendiente**
- ⬜ 💻 Secuencia de **projection mapping** sincronizada + narrativa/audio.
- 🔩 Réplica de cápsula (fibra) + proyector(es) + soportes/óptica + calibración mapping. → **Yokup F3**
- Dependencias: penumbra; calibración in-situ.

### E6 · La Consola de Cristales (gemelo)
- ✅ 💻 Kiosko del gemelo ya en producción (`admira-xp`); Xpacio modelado.
- ⬜ 💻 Perfilado modo Templo (escena, parrilla, megafonía, audiencia de las 3 salas).
- 🔩 Panel táctil grande (43–55") + atril de cristal + mini-PC kiosko. → **Yokup F3**
- Dependencias: enlace al backoffice remoto real (admira.live/control).

---

## Capas transversales

### Cámara de audiencia — «El Xpacio te ve» ⛔ bloqueante para abrir
- ⬜ 💻 Consumo de métricas anónimas → `window.TEMPLO.aud` (puente edge→web) y telemetría al gemelo.
- 🔩 Cámara(s) en esclusa/central + **nodo de inferencia edge** (NPU/GPU, sin grabación). → **Yokup F3**
- ⛔ 📐 **DPIA + cartelería RGBD + cumplimiento RGPD** — requisito bloqueante antes de abrir al público. → **Admira legal + Yokup F4**

### Red / energía
- 🔩 Switch **PoE** gestionable, VLAN de sala, UPS para nodos críticos, cuadro eléctrico dedicado. → **Yokup F3**
- 🔩 Wi-Fi de visitante separado (WebAR/QR). → **Yokup F3**

### Telemetría y ciclo de vida
- ⬜ 💻 Heartbeat + telemetría de cada surface al gemelo XpaceOS (patrón `pingStore`/store XPL ya cableado en `xpl-templo.js`).
- ⬜ 💻 Webhook Admira→Yokup para incidencias automáticas de estación. → **F4**

---

## Dependencias clave (orden)

1. **F0/F1** persona + escenas + Xpacio (software) → *puede avanzar ya, sin obra.*
2. **F2** fabricación de piezas físicas (escenografía) → habilita **F3**.
3. **F3** instalación Yokup (eléctrico, AV, sensores, DMX, cámara) → habilita **F4**.
4. **F4** integración: puente sensores→`window.TEMPLO`, reglas XPL en vivo, prueba RGPD.
5. ⛔ **RGPD/DPIA de la cámara** debe cerrarse **antes** de F5 (apertura).

## Responsables

- **Software (💻):** Software Admira (Morfeo / equipo de silicio) — artefactos en `build/`.
- **Persona/cerebro Jor-El:** operador de `digitalavatar.ai` (carga en `brain.digitalavatar.ai`).
- **Hardware/obra (🔩):** Yokup → Immersive Labs, intervención `iv-1784134056479`.
- **Legal/RGPD (📐):** Admira legal + Yokup (DPIA cámara).
- **Operación (F5):** Operación Admira (uptime, incidencias, iteración de contenidos).

# Planos de desarrollo · «El Templo de la Soledad de Superman»
### Xperiencia inmersiva de Admira — documento de construcción para el equipo de desarrollo

> **Objeto de este documento.** Convertir el concepto validado (mockup interactivo en
> `www.xpaceos.com/xperiencias/soledad/`) en un **blueprint construible**: qué se levanta, con qué
> hardware, qué software lo gobierna, cómo se integra en el ecosistema Admira y en qué fases se ejecuta.
> Va dirigido a los equipos de **obra/escenografía, AV/integración, software y montaje (Yokup)**.
>
> **Versión** 1.0 · 2026-07-15 · **Autor** Morfeo (Admira, equipo de silicio) · **Estado** para desarrollo.
> **Referencia viva** mockup navegable: `www.xpaceos.com/xperiencias/soledad/` · Repo: `xpaceos/xperiencias/soledad/`.
> **Saga** 3ª sala: 🛋️ Apartamento de Sheldon → 🦇 La Batcueva → ❄️ **Fortaleza de la Soledad**.

---

## 1. Resumen ejecutivo

El **Templo de la Soledad** es un Xpacio físico inmersivo de ~**60–90 m²** que recrea la Fortaleza de
la Soledad de Superman. El visitante recorre una caverna de cristal kryptoniano donde **6 estaciones de
memorabilia** cobran vida mediante la tecnología de Admira: pantallas reactivas, sensores, proyección,
realidad aumentada y un **holograma conversacional de Jor-El** que habla y responde en tiempo real.

La sala **se ve a sí misma** (cámara de segmentación de audiencia) y adapta su ambiente, y está
**espejada en un gemelo digital (XpaceOS)** desde el que se controla, programa y mide en remoto —
igual que las tiendas del ecosistema Admira. La instalación se ejecuta y mantiene como **intervención
técnica en Yokup** (ya dada de alta: `iv-1784134056479`).

**Diferenciador:** no es una exposición estática de figuras; es un espacio que percibe, responde,
conversa y se monetiza — el mismo bucle *crear → emitir → percibir → monetizar* de Admira, aplicado a
una Xperiencia de marca/entretenimiento.

---

## 2. Objetivos y KPIs

| Objetivo | Métrica |
|---|---|
| Impacto WoW / dwell time | Tiempo medio de permanencia por visitante (target > 6 min) |
| Interacción | % de estaciones activadas por visita (target > 70%) |
| Conversión | Escaneos QR/NFC → ficha/compra de memorabilia; leads capturados |
| Conversación | Nº de diálogos con Jor-El; idiomas; preguntas frecuentes |
| Operación | Uptime de estaciones; incidencias abiertas/cerradas en Yokup |
| Monetización | CPM/valor del inventario de señalización (escudo-branding), patrocinios |

Toda la telemetría fluye al **gemelo XpaceOS** y a los paneles de Admira.

---

## 3. Planta del Xpacio (layout)

Espacio rectangular con **recorrido en U** alrededor de la **estatua central**. Iluminación fría
azul-cian, suelo tipo hielo (resina/vinilo), estalagmitas de metacrilato retroiluminado.

```
   ENTRADA (esclusa de luz / arco de cristal)
        │
        ▼
 ┌───────────────────────────────────────────────┐
 │  [E3] Capa           [E2] Escudo de El         │
 │  (vitrina táctil)    (pantalla branding)       │
 │                                                │
 │            ✦ ESTATUA DE KAL-EL ✦               │
 │            (pedestal + retroluz)               │
 │   [E1] Cristal                                 │
 │   de Jor-El          [E6] Consola de           │
 │   (holograma)        Cristales (gemelo)        │
 │                                                │
 │  [E4] Kryptonita     [E5] Cápsula de Kal-El    │
 │  (zona reactiva)     (AR + mapping)            │
 └───────────────────────────────────────────────┘
        │
        ▼
   SALIDA (tienda / captura de lead / QR)
```

- **Zona central:** estatua de Superman (fibra de vidrio o resina, 2,0–2,4 m) sobre pedestal con
  retroiluminación RGBW y halo. Barrera perimetral discreta.
- **Anillo perimetral:** las 6 estaciones, señalizadas con "cristales" (balizas luminosas) que invitan
  al tacto — traducción física de los *hotspots* del mockup.
- **Esclusa de entrada:** transición de luz (oscurece la vista y sube el frío cian) para el efecto
  "cruzar al templo".
- **Salida comercial:** panel de tienda + captura de lead + QR a la versión web de la Xperiencia.

Entregable de obra: **plano CAD a escala** (planta + alzados + retícula eléctrica/datos) a partir de
este esquema, adaptado a las medidas reales del local.

---

## 4. Recorrido del visitante (guest journey)

1. **Umbral** — cruza la esclusa; la sala baja luces y sube ambiente. La cámara lo detecta (anónimo).
2. **Revelación** — se ilumina la estatua central; una voz de bienvenida (Jor-El) puede activarse.
3. **Exploración** — recorre las 6 estaciones; cada baliza reacciona al acercarse/tocar.
4. **Clímax** — despierta a **Jor-El**: el holograma habla y responde preguntas.
5. **Reacción de la sala** — la Kryptonita/ambiente responden a la afluencia y al perfil (audiencia).
6. **Cierre** — salida por tienda: QR/NFC a fichas, compra de memorabilia, captura de lead.

---

## 5. Las 6 estaciones — especificación técnica

> Cada estación define: **función**, **hardware**, **contenido/interacción**, **Capa Admira**
> (la tecnología que la hace viva) y **necesidades de energía/red**. Todas cuelgan de la red de sala
> (VLAN dedicada) y reportan estado al gemelo XpaceOS (heartbeat + telemetría).

### E1 · Cristal de Jor-El (holograma conversacional) — *estación estrella*
- **Función:** IA viva de la Fortaleza; da la bienvenida, guía y responde en cualquier idioma.
- **Hardware:** ver **§6** (3 opciones de holograma). Micrófono direccional + altavoz + botón/gesto de
  activación. Mini-PC/render node según opción.
- **Interacción:** botón "Hablar con Jor-El" o detección de presencia → el avatar habla y escucha
  (STT), responde (LLM) y vocaliza con lip-sync (TTS).
- **Capa Admira:** pipeline **digitalavatar.ai** ya operativo — `embed.js` (cabeza 3D + visemas ARKit)
  + cerebro/voz en `brain.digitalavatar.ai` (`/metahuman/ask`, `/metahuman/say`). Persona "Jor-El"
  con base de conocimiento propia (Krypton, Casa de El, la Xperiencia). Opción premium: **MetaHuman /
  Unreal 5 por Pixel Streaming**.
- **Energía/red:** 1×220V + PoE; latencia baja a Internet (para el cerebro/voz) o LLM local.

### E2 · Escudo de la Casa de El (pantalla de branding)
- **Función:** emblema heráldico presidiendo el templo; lienzo de marca conmutable.
- **Hardware:** panel LED/LCD con forma de escudo (o proyección sobre relieve) + reproductor de
  señalización (Android/BrightSign/mini-PC).
- **Interacción:** cambia de versión del emblema / branding del patrocinador según el perfil que
  segmenta la cámara.
- **Capa Admira:** **señalización reactiva** conectada al motor de contenidos de Admira
  (`omnipublicity-api` / pixer-worker); inventario monetizable (CPM), parrilla programable desde el
  backoffice.
- **Energía/red:** 1×220V + datos.

### E3 · La Capa (vitrina viva)
- **Función:** reliquia estrella en vitrina; historia + autenticidad + venta.
- **Hardware:** vitrina de metacrilato con **pantalla táctil perimetral** (barra 24–32") + lector
  **NFC** + QR dinámico + iluminación de realce. Sensor de apertura (seguridad).
- **Interacción:** ficha de la prenda, making-of, certificado (NFT) y, si está a la venta, checkout en
  el móvil vía QR/NFC.
- **Capa Admira:** **memorabilia → punto de conversión**; proof-of-play; tracking de escaneos → leads.
- **Energía/red:** 1×220V + datos; NFC por USB/PoE.

### E4 · La Kryptonita (zona reactiva)
- **Función:** cristal verde latente; hace "reaccionar" toda la sala.
- **Hardware:** pieza translúcida con **LED RGB** interno + **sensores de proximidad** (ToF/PIR) +
  integración con la **iluminación DMX** de sala y audio.
- **Interacción:** al acercarse, luces palidecen, la estatua "se debilita" (retroluz baja), el ambiente
  cae — escenografía en tiempo real.
- **Capa Admira:** **motor de reglas XPL** (el mismo de los gemelos de tienda): CUANDO proximidad →
  ENTONCES escena. Controlador DMX/DALI + nodo XPL.
- **Energía/red:** 1×220V + DMX + sensores PoE.

### E5 · La Cápsula de Kal-El (AR + projection mapping)
- **Función:** la nave que trajo a Kal-El; pieza central narrativa.
- **Hardware:** réplica de cápsula (fibra) + **proyector(es)** para mapping + soporte de **WebAR** sin
  marcador (el visitante apunta el móvil). Altavoz local.
- **Interacción:** el móvil "abre" la cápsula y reproduce el viaje/aterrizaje; el mapping la envuelve
  en la reentrada.
- **Capa Admira:** **WebAR** servido desde el ecosistema + mapping sincronizado; narrativa inmersiva.
- **Energía/red:** 1–2×220V (proyectores) + datos; calibración de mapping.

### E6 · La Consola de Cristales (gemelo digital)
- **Función:** panel de mando físico del templo = maqueta del gemelo XpaceOS.
- **Hardware:** panel táctil grande (43–55") sobre atril de cristal; mini-PC kiosko.
- **Interacción:** demo del backoffice — cambiar escena, programar parrilla, lanzar megafonía, ver la
  audiencia de las 3 salas de la saga.
- **Capa Admira:** **gemelo XpaceOS** en modo kiosko (`admira-xp` / control), enlazado al backoffice
  remoto real. Es el "cómo se opera todo esto" hecho tangible.
- **Energía/red:** 1×220V + datos.

---

## 6. El holograma de Jor-El — 3 opciones técnicas

| Opción | Qué es | Pros | Contras | Coste rel. |
|---|---|---|---|---|
| **A. Web 3D (digitalavatar.ai `embed.js`)** | Cabeza 3D en pantalla/panel, voz + lip-sync + chat, cerebro en `brain.digitalavatar.ai` | **Ya operativo y verificado**; robusto; multi-idioma; barato; degrada a TTS local | No es "volumétrico" real | € |
| **B. Pepper's Ghost + panel** | Reflexión sobre cristal a 45° con la fuente = panel de la opción A o vídeo | Efecto "holograma flotante" clásico, muy WoW en sala | Óptica/carpintería a medida; control de luz ambiente | €€ |
| **C. MetaHuman / Unreal 5 (Pixel Streaming)** | Humano digital foto-real renderizado en GPU y emitido en vivo | Máxima calidad facial; premium | Necesita **host de render GPU** siempre encendido y red estable (`digitalavatar.ai/metahuman.html`) | €€€ |

**Recomendación:** **B = A dentro de una montura Pepper's Ghost.** Se construye ya con el pipeline
`digitalavatar.ai` (fiable, integrado en el mockup) y se le da presencia física de "holograma
flotante". Dejar **C (MetaHuman)** como upgrade de la estación cuando haya host de render dedicado.

**Datos técnicos del pipeline A/B (ya integrado):**
- Montaje: `import('https://digitalavatar.ai/embed.js').mount({ title, greeting, brainUrl, voiceUrl, lang })`.
- Cerebro: `POST https://brain.digitalavatar.ai/metahuman/ask` `{question,lang}` → `{answer, audioBase64, alignment}`.
- Voz: `POST https://brain.digitalavatar.ai/metahuman/say` `{text,lang}` → audio; fallback TTS del navegador.
- Persona Jor-El: definir base de conocimiento + saludo + voz. (Pendiente: `brainUrl` con persona dedicada.)

---

## 7. Cámara de audiencia — «El Xpacio te ve»

- **Hardware:** cámara(s) en la esclusa/central + **nodo de inferencia edge** (mini-PC con NPU/GPU, p.ej.
  Jetson/Coral o equivalente). **Sin grabación de vídeo**; solo métricas anónimas.
- **Qué mide:** presencia, aforo, franjas de edad/género agregadas, tiempo por zona (heatmap).
- **Uso:** adapta la escena (E2 branding, E4 ambiente) y alimenta la telemetría de audiencia del gemelo
  y de Admira (mismo enfoque que el bucle DOOH crear→emitir→percibir→monetizar).
- **Privacidad/legal:** procesamiento en el borde, datos agregados, cartelería informativa, cumplimiento
  RGPD. **Requisito bloqueante antes de abrir al público.**

---

## 8. Gemelo digital XpaceOS + motor XPL + backoffice

- El Templo se modela como un **Xpacio** en **XpaceOS** (igual que las tiendas): cada estación = una
  *surface* con estado (`live`/`idle`/`sched`), telemetría y control.
- **Motor XPL** (reglas CUANDO→ENTONCES) gobierna la escenografía reactiva (E4, ambiente, señalización
  condicional). Reutiliza `scripts/xpl-gemelo.js` y el vocabulario XPL existente.
- **Backoffice remoto** (admira.live/control + backoffice del gemelo): cambiar escena, programar
  parrilla, lanzar megafonía TTS, ver audiencia, abrir incidencias. La estación **E6** expone esto en sala.
- **Kiosko:** el gemelo corre como el kiosko `admira-xp` (patrón ya en producción).

---

## 9. Arquitectura de software e integraciones

```
   Visitante (móvil: WebAR / QR / checkout)
        │
   ┌────┴───────────────── Xpacio físico (VLAN de sala) ─────────────────────┐
   │  E1 Jor-El   E2 Escudo   E3 Capa   E4 Kryptonita   E5 Cápsula   E6 Consola │
   │     │           │          │            │              │            │       │
   │  reproductor/reproductores + controlador DMX + nodo XPL + nodo cámara edge  │
   └──────────────────────────────┬──────────────────────────────────────────┘
                                   │  (heartbeat + telemetría + control)
        ┌──────────────────────────┼───────────────────────────┐
        ▼                          ▼                           ▼
  Gemelo XpaceOS           digitalavatar.ai              Ecosistema Admira
  (twin + XPL +            (embed.js +                   (omnipublicity-api,
   backoffice +            brain.digitalavatar.ai:       pixer-worker: contenidos,
   kiosko admira-xp)       ask/say, MetaHuman)           parrilla, audiencia, CPM)
        │
        ▼
   Yokup (instalación/mantenimiento) — intervención iv-1784134056479 → Immersive Labs
```

- **Admira:** contenidos/señalización, parrilla, audiencia, monetización (E2, telemetría).
- **digitalavatar.ai:** Jor-El (E1).
- **XpaceOS:** gemelo, XPL, backoffice, kiosko (E6 y toda la escenografía).
- **Yokup:** ciclo de vida físico (montaje, incidencias, mantenimiento) — webhook Admira→Yokup.

---

## 10. Lista de materiales (BOM) indicativa

> Cantidades orientativas para dimensionar presupuesto; ajustar al plano real.

- **Escenografía:** estatua Superman (1), pedestal retroiluminado (1), cápsula réplica (1), estalagmitas
  metacrilato (varias), vitrina táctil de la Capa (1), atril de cristal E6 (1), suelo tipo hielo, esclusa.
- **Displays:** panel-escudo E2 (1), táctil perimetral E3 (1), táctil consola E6 (1), pantalla/panel
  del holograma E1 (1), + cristal Pepper's Ghost si opción B.
- **Reproductores/PC:** reproductores de señalización (E2/E5) + mini-PCs kiosko (E1/E6) + **nodo de
  inferencia edge** (cámara).
- **Sensores/control:** ToF/PIR (E4, esclusa), NFC (E3), controlador **DMX/DALI** + luminarias RGBW,
  micrófono direccional + altavoces (E1, E5), cámara(s) de audiencia.
- **Proyección:** proyector(es) para mapping de la cápsula (E5) + soportes/óptica.
- **Red/energía:** switch **PoE** gestionable, VLAN de sala, UPS para nodos críticos, cableado
  estructurado, regletas 220V por estación, cuadro eléctrico dedicado.
- **Software/servicios:** licencias/servicios digitalavatar.ai, hosting de contenidos, (opcional) host
  GPU para MetaHuman.

---

## 11. Fases de desarrollo y montaje

| Fase | Contenido | Responsable |
|---|---|---|
| **F0 · Diseño de detalle** | Plano CAD a escala, guion de contenidos por estación, persona Jor-El, presupuesto y BOM cerrada | Admira + escenografía |
| **F1 · Software y contenidos** | Persona/base de conocimiento de Jor-El; escenas XPL; señalización E2; WebAR E5; kiosko E6; modelado del Xpacio en XpaceOS | Software Admira |
| **F2 · Fabricación** | Estatua, cápsula, vitrinas, mobiliario, esclusa, suelo | Escenografía |
| **F3 · Instalación en sala** | Obra ligera, eléctrico/datos, montaje AV, sensores, DMX, cámara, calibración mapping | **Yokup → Immersive Labs** (`iv-1784134056479`) |
| **F4 · Integración y pruebas** | Puesta en marcha estaciones, reglas XPL, telemetría al gemelo, prueba de audiencia (RGPD), ensayo de recorrido | Admira + Yokup |
| **F5 · Apertura y operación** | Go-live; monitorización uptime; mantenimiento e incidencias vía Yokup; iteración de contenidos | Operación |

---

## 12. Requisitos de sala (obra e instalaciones)

- **Eléctrico:** cuadro dedicado, tomas 220V por estación, línea para proyectores/UPS, protección
  diferencial. Estimar carga total (displays + PC + proyección + iluminación).
- **Datos:** switch PoE gestionable, VLAN aislada, salida a Internet estable (para Jor-El), Wi-Fi de
  visitante separado (WebAR/QR).
- **Iluminación/oscuridad:** control de luz ambiente (el holograma y el mapping exigen penumbra);
  luminarias DMX/DALI regulables.
- **Climatización/acústica:** disipación de calor de PCs/proyectores; tratamiento acústico para la voz
  de Jor-El y el audio ambiente.
- **Seguridad:** vías de evacuación, anclaje de estatua/estructuras, vitrinas con sensor, señalización
  RGPD de la cámara.

---

## 13. Riesgos y plan B

| Riesgo | Mitigación |
|---|---|
| Caída de Internet (Jor-El) | LLM/TTS local en el nodo E1; fallback typewriter/holograma pregrabado |
| Host MetaHuman no disponible | Opción A/B (web 3D) como base; MetaHuman solo como upgrade |
| Bloqueo/latencia de servicios | Cachés locales de contenido; contenidos de señalización servidos en local |
| RGPD cámara | Edge-only, agregado, cartelería, DPIA antes de abrir |
| Fallos de estación en vivo | Telemetría + alertas al gemelo; incidencia automática a Yokup |

---

## 14. Referencias

- **Mockup navegable (fuente de verdad del concepto):** `www.xpaceos.com/xperiencias/soledad/`
- **Salas hermanas de la saga:** `.../xperiencias/sheldon/` · `.../xperiencias/batcueva/`
- **Repos:** `xpaceos/xperiencias/soledad/` (mockup + estos planos) · `xpaceos/admira-xp` (kiosko gemelo)
- **Jor-El:** `digitalavatar.ai/embed.js` · `brain.digitalavatar.ai/metahuman/{ask,say}` · `digitalavatar.ai/metahuman.html`
- **Yokup:** intervención `iv-1784134056479` (instalación, en_curso) → técnico `tech-1784134939061` (Immersive Labs)
- **Ecosistema:** `omnipublicity-api` (stores/surfaces) · `pixer-worker` (contenidos/audiencia) · admira.live/control

---

*Documento generado para desarrollo. El foco pasa del mockup a la construcción: estos planos son el
punto de partida para el plano CAD a escala y el presupuesto detallado.*

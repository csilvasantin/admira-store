// Registro de escenas realistas por tipo de local (misión DCL-a6cb621be0ce5932f50960de,
// «Hoy #47 · Altadis España · 10 Xtancos», 16-oct-2026).
//
// El gemelo de siempre sale del plano del Arquitecto con volúmenes sencillos (Esquema). El modo
// Realista monta LAS MISMAS pantallas físicas del formato (mismos metros, recortes, proporción y
// vídeo) dentro de un local modelado de verdad (un GLB), en la zona de montaje que toca a su
// formato. Es una escena INVENTADA: ningún local del circuito está levantado así.
//
// Un tipo de local → { modelo GLB + SHA-256, sala, paredes que se cortan, muebles (qué se oculta,
// qué se mueve, qué se conserva), zonas de montaje y materiales que admiten acabado }.
// Hoy: `xtanco` → Xtanco Best de admira.studio. `cafe` (Starbucks) queda preparado y vacío: el
// visor cae a Esquema sin más. Para añadir otro modelo, ver admira-xp/docs/altadis-18-espacios.md
// («Escena realista · cómo añadir otro modelo»).
//
// Lógica pura, sin DOM ni three.js: la usan escena-realista.mjs, el visor y los tests.

import { reference, TRIAL_FIXTURE_POLICY, FORMAT_REFERENCE_MAP } from './catalogo.mjs?v=real-1';

const freeze = v => { if (v && typeof v === 'object') { for (const k of Object.values(v)) freeze(k); Object.freeze(v); } return v; };

export const MODOS = ['esquema', 'realista'];
/** Lo que tarda como mucho el GLB antes de caer a Esquema (desde que empieza la descarga). */
export const ESPERA_MODELO_MS = 12000;

// Zonas del Xtanco Best. Son las de Studio (catalogo.mjs, TWIN_REFERENCES) con la sala de 6 m del
// modelo: a escala física ningún formato de Altadis pasa de 4,6 m, así que el mural y el
// superstretch no necesitan la ampliación a 8 m de Studio; el mostrador admite 1,30 m (los 1,22 m
// de los 55″ apaisados más el bisel). Cajas en metros, con la pantalla y su marco dentro.
const ZONAS_XTANCO = [
  reference('mostrador', 'Estanco · Mostrador', 'Shop · Counter', 6, 'flat',
    { min: { x: 2.8, y: 1.05, z: 3.25 }, max: { x: 4.15, y: 2.85, z: 3.65 } },
    { centreX: 3.475, front: 3.45, bottom: 1.12, maxWidth: 1.3, maxHeight: 1.7 },
    { type: 'counter_or_totem_stand', baseY: 0, screenBottom: 1.12 }),
  reference('mural', 'Estanco · Mural videowall', 'Shop · Video wall', 6, 'flat',
    { min: { x: 0.25, y: 1, z: 3.25 }, max: { x: 5.75, y: 2.96, z: 3.65 } },
    { centreX: 3, front: 3.45, top: 2.89, maxWidth: 5.45, maxHeight: 1.8 },
    { type: 'gallery_display_rail', baseY: 0 }),
  reference('columna', 'Estanco · Columna y góndola', 'Shop · Column and gondola', 6, 'flat',
    { min: { x: 3.9, y: 0.55, z: 3.25 }, max: { x: 5.9, y: 2.86, z: 3.65 } },
    { centreX: 4.9, front: 3.45, bottom: 0.65, maxWidth: 1.8, maxHeight: 2.2 },
    { type: 'vertical_gondola_stand', baseY: 0, screenBottom: 0.65 }),
  reference('superstretch', 'Estanco · Superstretch', 'Shop · Superstretch', 6, 'flat',
    { min: { x: 0.25, y: 2, z: 3.25 }, max: { x: 5.75, y: 2.99, z: 3.65 } },
    { centreX: 3, front: 3.45, top: 2.92, maxWidth: 5.45, maxHeight: 0.85 },
    { type: 'overhead_fascia_rail', baseY: 2 }),
  reference('cubo', 'Estanco · Cubo LED', 'Shop · LED cube', 6, 'four-face-prism-trial',
    { min: { x: 3.05, y: 1.05, z: 2.65 }, max: { x: 4.45, y: 2.92, z: 3.95 } },
    { centreX: 3.75, front: 3.85, bottom: 1.15, maxEdge: 1.05, maxHeight: 1.65 },
    { type: 'four_side_led_pedestal', baseY: 0, screenBottom: 1.15 },
    { faces: 4 }),
];

export const ESCENAS_REALISTAS = freeze({
  xtanco: {
    id: 'xtanco-best',
    nombre: { es: 'Xtanco Best', en: 'Xtanco Best' },
    inventada: true,
    // Lo que dice la ficha, discreto: la escena es inventada, no el estanco del circuito.
    nota: { es: 'Escena realista inventada · no es el estanco real', en: 'Invented realistic scene · not the real shop' },
    // GLB Best de admira.studio (Blender 5.2.2 LTS, 8-oct-2026): adaptaciones/modelos/xtanco-best/
    // y adaptaciones/gemelo-assets.mjs (TWIN_BEST_REFERENCE). Recurso inmutable del Stock con CORS *
    // y caché de un año; la segunda URL es la API del Stock (la que cita Studio).
    modelo: {
      id: 'xtanco-best-studio-20261008', stock: '1791411065310-v2jraa',
      urls: ['https://stock.admira.store/stock/1791411065310-v2jraa/asset.bin?v=13035628', 'https://api.admira.store/stock/asset/1791411065310-v2jraa'],
      sha256: '77b4f4c7346c0dacf22c3d8573f1d80536d367d3b64874115443c1b420edbb85', bytes: 13035628, unidades: 'm', triangulos: 160842,
    },
    // Huella del modelo (metros, Y arriba): pared del fondo en z = 0, fachada en x = 0, abierto por x = 6 y z = 4,5.
    sala: { ancho: 6, fondo: 4.5, alto: 3 },
    suelo: 'suelo',
    // Paredes que el visor corta cuando la cámara queda detrás (como las del Esquema). En coordenadas
    // del plano (x, y = z del modelo), en el sentido de las agujas del reloj: la normal mira dentro.
    paredes: [
      { id: 'fondo', nombre: 'Pared del fondo', a: [0, 0], b: [6, 0], nodos: ['pared_fondo', 'pared__rodapie_fondo', 'led_perimetral_fondo', 'puerta_almacén', 'almacen__*', 'iot_A1', 'iot_G1'] },
      { id: 'fachada', nombre: 'Fachada', a: [0, 4.5], b: [0, 0], nodos: ['pared_fachada', 'escaparate_1', 'fachada__*', 'puerta_entrada', 'entrada__tirador', 'led_perimetral_fachada'],
        huecos: [{ id: 'puerta_entrada', tipo: 'puerta', nombre: 'Entrada', desde: 0.25, ancho: 1, base: 0, alto: 2.4 }] },
      // El GLB omite las paredes de corte; la escena las cierra (y el techo) con el material de la
      // pared, y el visor las corta como las demás cuando la cámara queda detrás.
      { id: 'derecha', nombre: 'Pared derecha', a: [6, 0], b: [6, 4.5], cierre: true },
      { id: 'frente', nombre: 'Frente', a: [6, 4.5], b: [0, 4.5], cierre: true },
    ],
    techo: { material: 'PARED_fondo', color: '#e8e3da' },
    muebles: {
      // La pantalla de pared del modelo se sustituye por las del formato; las otras dos pantallas
      // del modelo no son del formato y se ocultan para que no se confundan con él.
      sustituida: TRIAL_FIXTURE_POLICY.replacedDisplayRoot,
      ocultos: ['pantalla-mostrador', 'pantalla-escaparate'],
      // Se apartan (sólo posición, en x/z) si su caja pisa la zona reservada: la política de Studio.
      movibles: [...TRIAL_FIXTURE_POLICY.movableRoots, ...TRIAL_FIXTURE_POLICY.adjustablePendantRoots],
      aparcar: { 'lampara-*': { z: 0.8 }, planta: { x: 0.8, z: 3.9 }, '*': { z: 0.95 } },
      // Lo que el visor puede ocultar si tapa las pantallas desde la cámara (el resto, nunca).
      tapan: ['planta', 'taburete-1', 'taburete-2', 'lampara-1', 'lampara-2', 'lampara-3', 'mostrador', 'tpv', 'vitrina', 'expendedora'],
      preservados: TRIAL_FIXTURE_POLICY.preservedRoots,
    },
    zonas: ZONAS_XTANCO,
    // Materiales del GLB que admiten el acabado de cada local (tinte; la marca y las pantallas, nunca).
    materiales: { pared: ['PARED_fondo', 'PARED_fachada'], suelo: ['SUELO'] },
    // Puntos de luz: las tres lámparas colgantes del modelo (x, y del plano; altura).
    luces: [[2.7, 1.75, 1.95], [3.5, 1.75, 1.95], [4.3, 1.75, 1.95]],
  },
  // Starbucks: hueco preparado. Cuando haya un GLB de cafetería, va aquí con la misma forma.
  cafe: null,
});

/** La escena realista de un tipo de local, o null si aún no tiene. */
export const escenaRealista = (tipo, registro = ESCENAS_REALISTAS) => (registro && Object.hasOwn(registro, tipo) && registro[tipo]) || null;

/** Errores de una entrada del registro (vacío si vale): lo que el visor necesita para montarla. */
export function validarEscena(def) {
  const errores = [];
  if (!def || typeof def !== 'object') return ['La escena no es un objeto'];
  const m = def.modelo || {};
  if (!Array.isArray(m.urls) || !m.urls.length || !m.urls.every(u => /^https:\/\/[^\s"'<>]+$/.test(u))) errores.push('El modelo necesita al menos una URL https');
  if (!/^[0-9a-f]{64}$/.test(m.sha256 || '')) errores.push('El modelo necesita su SHA-256');
  if (!def.nota || !def.nota.es || !def.nota.en) errores.push('La escena necesita su nota ES/EN («inventada»)');
  const s = def.sala || {};
  if (![s.ancho, s.fondo, s.alto].every(v => Number.isFinite(v) && v > 0)) errores.push('La sala necesita ancho, fondo y alto');
  if (!Array.isArray(def.zonas) || !def.zonas.length) errores.push('La escena necesita zonas de montaje');
  for (const z of def.zonas || []) {
    const b = z?.definition?.mount?.zone;
    if (!b || !['x', 'y', 'z'].every(k => b.min[k] < b.max[k])) errores.push(`Zona «${z?.id}» sin caja válida`);
    else if (b.min.x < 0 || b.max.x > s.ancho + 1e-9 || b.min.z < 0 || b.max.z > s.fondo + 1e-9 || b.max.y > s.alto + 1e-9) errores.push(`La zona «${z.id}» se sale de la sala`);
  }
  for (const w of def.paredes || []) if (!w.id || !Array.isArray(w.a) || !Array.isArray(w.b) || (!w.cierre && !w.nodos?.length)) errores.push(`Pared «${w?.id}» incompleta`);
  return errores;
}

/** La zona de montaje de un formato: la que dice el índice (`zona`) y, si no, la de Studio. */
export function zonaDe(def, formato) {
  if (!def) return null;
  const id = typeof formato === 'string' ? formato : formato?.formato || formato?.id;
  const pedida = (formato && typeof formato === 'object' && formato.zona) || FORMAT_REFERENCE_MAP[id] || 'mural';
  return def.zonas.find(z => z.id === pedida) || def.zonas.find(z => z.id === 'mural') || def.zonas[0];
}

/** ?escena=realista|esquema (también ?escena=realistic|schematic). Sin parámetro, null. */
export function modoDesdeURL(search = '') {
  const v = String(new URLSearchParams(search).get('escena') || '').toLowerCase();
  return { realista: 'realista', realistic: 'realista', esquema: 'esquema', schematic: 'esquema', esquematico: 'esquema' }[v] || null;
}

/**
 * ¿Puede este navegador con la escena realista? WebGL2, texturas de 4096 y algo de memoria. Un
 * móvil normal sí (se le quitan las sombras); uno muy justo, no: va a Esquema.
 */
export function soporteRealista({ webgl2 = true, maxTextura = 4096, memoria = null } = {}) {
  if (!webgl2) return { ok: false, motivo: 'sin-webgl2' };
  if (!(maxTextura >= 4096)) return { ok: false, motivo: 'texturas' };
  if (memoria != null && memoria < 2) return { ok: false, motivo: 'memoria' };
  return { ok: true, motivo: null };
}

/**
 * Qué modo se pinta. `pedido`: el de la URL o el conmutador (null = por defecto). `estado`: el del
 * GLB ('listo' | 'cargando' | 'lento' | 'fallo' | null). `soporte`: el de soporteRealista.
 * Por defecto Realista donde hay escena; si no hay, si falla, si tarda o si el navegador no puede,
 * Esquema, sin error. `disponible`: si el conmutador puede ofrecer Realista.
 */
export function elegirModo({ tipo, pedido = null, estado = null, soporte = { ok: true }, registro = ESCENAS_REALISTAS } = {}) {
  const def = escenaRealista(tipo, registro);
  if (!def) return { modo: 'esquema', motivo: 'sin-escena', disponible: false };
  if (soporte && soporte.ok === false) return { modo: 'esquema', motivo: soporte.motivo || 'sin-soporte', disponible: false };
  if (estado === 'fallo') return { modo: 'esquema', motivo: 'fallo', disponible: false };
  if (pedido === 'esquema') return { modo: 'esquema', motivo: 'pedido', disponible: true };
  // Si tarda, se cae a Esquema; pedida a mano, se le da otro plazo (el visor espera de nuevo).
  if (estado === 'lento' && pedido !== 'realista') return { modo: 'esquema', motivo: 'lento', disponible: true };
  return { modo: 'realista', motivo: pedido === 'realista' ? 'pedido' : 'defecto', disponible: true };
}

// ── Acabado por local ───────────────────────────────────────────────────────
// Los locales del circuito son inventados: cada uno con su pared, su suelo y su luz, deterministas
// por id, para que no parezcan el mismo local diez veces. Tonos de tienda real, sin estridencias;
// el suelo es un tinte sobre el terrazo del modelo (multiplica su textura).
export const ACABADOS = freeze({
  pared: [
    { id: 'noche', color: '#2c2c4a' },      // el azul noche del Xtanco Best
    { id: 'petroleo', color: '#24414a' },
    { id: 'botella', color: '#28402f' },
    { id: 'burdeos', color: '#4a2a30' },
    { id: 'grafito', color: '#34363a' },
    { id: 'tabaco', color: '#5a4636' },
    { id: 'salvia', color: '#7f8b78' },
    { id: 'arena', color: '#b7a58a' },
  ],
  suelo: [
    { id: 'terrazo', color: '#ffffff' },
    { id: 'gris-frio', color: '#e3e9ee' },
    { id: 'calido', color: '#f3e1c9' },
    { id: 'piedra', color: '#d2ccc3' },
    { id: 'marfil', color: '#efe8da' },
  ],
  luz: [
    { id: 'calida', color: '#ffd8ad', kelvin: 3000 },
    { id: 'fria', color: '#e4eeff', kelvin: 5000 },
  ],
});

/** FNV-1a de 32 bits: el mismo id da siempre el mismo número, en cualquier navegador. */
export function hashId(id) {
  let h = 0x811c9dc5;
  for (const c of String(id == null ? '' : id)) { h ^= c.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

/** Acabado determinista de un local: pared, suelo, luz cálida o fría e intensidad (0,9…1,1). */
export function acabadoPorId(id) {
  const h = hashId(id), h2 = hashId(`${id}·suelo`), h3 = hashId(`${id}·luz`);
  const pared = ACABADOS.pared[h % ACABADOS.pared.length], suelo = ACABADOS.suelo[h2 % ACABADOS.suelo.length], luz = ACABADOS.luz[h3 % ACABADOS.luz.length];
  return { id: String(id), pared: pared.id, colorPared: pared.color, suelo: suelo.id, colorSuelo: suelo.color, luz: luz.id, colorLuz: luz.color, kelvin: luz.kelvin,
    intensidad: Math.round((0.9 + ((h3 >>> 8) % 21) / 100) * 100) / 100 };
}

// Escena realista de un gemelo: el local modelado (GLB del registro escenas-realistas.mjs) con
// las pantallas del formato montadas en su zona (misión DCL-a6cb621be0ce5932f50960de, 16-oct-2026).
//
// Las pantallas, su vídeo y sus UV son los del gemelo de siempre: se construyen con
// crearEscena3D (escena3d.mjs) a partir de las pantallas montadas por montaje.mjs, así el
// <video> único, el recorte por UV y el cubo de 4 caras son exactamente los mismos. A esa
// escena se le quitan el suelo, el techo y las luces de volúmenes y se le pone el modelo, sus
// soportes, la luz y el acabado del local.
//
// Partes portadas de admira.studio (adaptaciones/gemelo-better.mjs, origin/main 13800205,
// último cambio 3e558db3): descarga con comprobación del SHA-256, origen en el suelo, la
// sustitución de `pantalla-pared`, el apartado de muebles de la zona (clearMountZone), los
// soportes de la referencia (referenceFixtures) y la fusión de geometría estática (batch), aquí
// por cada raíz semántica para poder seguir ocultando o moviendo cada mueble.
//
// Rendimiento: el GLB (13 MB) se descarga y se prepara UNA vez por página; el modelo preparado
// se reutiliza en cada estanco (sus texturas siguen en la GPU). Al cambiar de espacio se sueltan
// las pantallas, su vídeo, los soportes y las luces; el modelo no.

import * as T from '../../admira-xp/scripts/premium-three.mjs';
import { GLTFLoader } from '../../admira-xp/scripts/vendor/GLTFLoader.mjs';
import { mergeGeometries } from '../../admira-xp/scripts/vendor/BufferGeometryUtils.mjs';
import { crearEscena3D } from '../gran-de-gracia-51/escena3d.mjs?v=gdg51-7';
import { ESPERA_MODELO_MS } from './escenas-realistas.mjs?v=real-1';

const ahora = () => (globalThis.performance ? performance.now() : Date.now());
const coincide = (nombre, patrones) => patrones.some(p => (p.endsWith('*') ? nombre.startsWith(p.slice(0, -1)) : nombre === p));

// ── Modelo: una descarga y una preparación por página ───────────────────────
const modelos = new Map();   // id del modelo → { t0, estado, promesa, modelo, error }

/** 'cargando' | 'lento' (más de ESPERA_MODELO_MS cargando) | 'listo' | 'fallo' | null (sin pedir). */
export function estadoModelo(def) {
  const m = def && modelos.get(def.modelo.id);
  if (!m) return null;
  if (m.estado === 'cargando' && ahora() - m.t0 > ESPERA_MODELO_MS) return 'lento';
  return m.estado;
}

async function sha256(bytes) {
  const sutil = globalThis.crypto && globalThis.crypto.subtle;
  if (!sutil) return null;   // sin contexto seguro no se comprueba (no es un fallo)
  const d = new Uint8Array(await sutil.digest('SHA-256', bytes));
  return Array.from(d, v => v.toString(16).padStart(2, '0')).join('');
}

async function descargar(def, fetchImpl) {
  const fallos = [];
  for (const url of def.modelo.urls) {
    try {
      // Caché HTTP normal: el recurso es inmutable (un año), así una visita posterior no lo baja.
      const r = await fetchImpl(url, { mode: 'cors', credentials: 'omit' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      if (/text\/html/i.test(r.headers.get('content-type') || '')) throw new Error('responde HTML');
      const bytes = await r.arrayBuffer();
      if (def.modelo.bytes && bytes.byteLength !== def.modelo.bytes) throw new Error(`${bytes.byteLength} bytes`);
      const h = await sha256(bytes);
      if (h && h !== def.modelo.sha256) throw new Error('el SHA-256 no coincide');
      return { bytes, url, sha: h ? 'ok' : 'sin-comprobar' };
    } catch (e) { fallos.push(`${url} (${e.message})`); }
  }
  throw new Error(`No se pudo descargar el modelo: ${fallos.join(' · ')}`);
}

/** Empieza (o devuelve) la carga del modelo de una escena. Nunca lo pide dos veces. */
export function cargarModelo(def, { fetchImpl = globalThis.fetch } = {}) {
  const ya = modelos.get(def.modelo.id);
  if (ya) return ya.promesa;
  const m = { t0: ahora(), estado: 'cargando', modelo: null, error: null };
  m.promesa = (async () => {
    const { bytes, url, sha } = await descargar(def, fetchImpl);
    const gltf = await new GLTFLoader().parseAsync(bytes, url);
    const modelo = prepararModelo(gltf.scene, def);
    modelo.url = url; modelo.sha = sha; modelo.ms = Math.round(ahora() - m.t0);
    return modelo;
  })().then(modelo => { m.estado = 'listo'; m.modelo = modelo; return modelo; }, e => { m.estado = 'fallo'; m.error = e; throw e; });
  m.promesa.catch(() => {});
  modelos.set(def.modelo.id, m);
  return m.promesa;
}

/**
 * El modelo listo, o null si falla o no llega a tiempo: ESPERA_MODELO_MS desde que empezó a bajar
 * (`otraVez`: otro plazo entero desde ahora, cuando Realista se pidió a mano).
 */
export async function esperarModelo(def, { otraVez = false } = {}) {
  cargarModelo(def);
  const m = modelos.get(def.modelo.id);
  if (m.estado === 'listo') return m.modelo;
  if (m.estado === 'fallo') return null;
  const resto = otraVez ? ESPERA_MODELO_MS : Math.max(0, ESPERA_MODELO_MS - (ahora() - m.t0));
  return Promise.race([m.promesa.then(x => x, () => null), new Promise(r => setTimeout(() => r(null), resto))]);
}

export const errorModelo = def => modelos.get(def.modelo.id)?.error?.message || null;

// Fusión de la geometría estática de una raíz semántica (batch de Studio, por raíz): las mallas
// con el mismo material se funden en una, hija de la raíz, así la raíz se sigue pudiendo ocultar
// o mover entera. Ni transparentes, ni con hijos, ni con multimaterial.
function fundir(raiz) {
  raiz.updateMatrixWorld(true);
  const inversa = new T.Matrix4().copy(raiz.matrixWorld).invert(), grupos = new Map();
  raiz.traverse(n => {
    if (n === raiz || !n.isMesh || n.children.length || n.isSkinnedMesh || n.morphTargetInfluences?.length || Array.isArray(n.material) || n.material.transparent) return;
    const g = n.geometry, clave = `${n.material.uuid}:${Boolean(g.index)}:${Object.keys(g.attributes).sort().map(k => `${k}:${g.attributes[k].itemSize}:${g.attributes[k].normalized}:${g.attributes[k].array?.constructor?.name}`).join('|')}`;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(n);
  });
  let fundidas = 0;
  for (const nodos of grupos.values()) {
    if (nodos.length < 2) continue;
    const gs = nodos.map(n => n.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inversa, n.matrixWorld)));
    const g = mergeGeometries(gs, false);
    for (const x of gs) x.dispose();
    if (!g) continue;
    const malla = new T.Mesh(g, nodos[0].material); malla.name = `${raiz.name}:fundida`;
    raiz.add(malla);
    for (const n of nodos) n.removeFromParent();
    fundidas += nodos.length;
  }
  return fundidas;
}

/** Prepara el modelo una vez: origen en el suelo, vidrios sin transmisión, raíces, fusión y colores originales. */
export function prepararModelo(root, def) {
  root.updateMatrixWorld(true);
  const suelo = root.getObjectByName(def.suelo);
  if (!suelo) throw new Error('el modelo no tiene suelo');
  const caja = new T.Box3().setFromObject(suelo);
  root.position.sub(new T.Vector3(caja.min.x, caja.max.y, caja.min.z));
  root.updateMatrixWorld(true);
  const nodos = new Map();
  for (const n of root.children) if (n.name) nodos.set(n.name, n);
  if (!nodos.has(def.muebles.sustituida)) throw new Error(`el modelo no tiene «${def.muebles.sustituida}»`);
  const materiales = new Map();
  root.traverse(n => {
    if (!n.isMesh) return;
    n.castShadow = true; n.receiveShadow = true;
    for (const m of [n.material].flat()) {
      if (!m) continue;
      // La transmisión pide otra pasada de render por fotograma (y aquí el vídeo pinta todos): vidrio translúcido normal.
      if (m.transmission > 0) { m.transmission = 0; m.transparent = true; m.opacity = 0.22; m.depthWrite = false; m.needsUpdate = true; n.castShadow = false; }
      if ('envMapIntensity' in m) m.envMapIntensity = 0.55;
      if (!materiales.has(m.name)) materiales.set(m.name, []);
      if (!materiales.get(m.name).includes(m)) materiales.get(m.name).push(m);
    }
  });
  let fundidas = 0, mallas = 0;
  root.traverse(n => { if (n.isMesh) mallas++; });
  for (const n of nodos.values()) fundidas += fundir(n);
  const original = new Map();
  for (const [nombre, ms] of materiales) for (const m of ms) if (m.color) original.set(m, m.color.clone());
  const posicion = new Map([...nodos].map(([k, n]) => [k, n.position.clone()]));
  let llamadas = 0;
  root.traverse(n => { if (n.isMesh) llamadas++; });
  return { root, nodos, materiales, original, posicion, mallas, llamadas, fundidas };
}

// ── Entorno (reflejos) una vez por renderer ─────────────────────────────────
const entornos = new WeakMap();
function entorno(renderer) {
  if (entornos.has(renderer)) return entornos.get(renderer);
  const sala = new T.Scene(), propios = [];
  const poner = (geo, color, pos, rot = [0, 0, 0], side = T.DoubleSide) => {
    const mat = new T.MeshBasicMaterial({ color: new T.Color(...color), side }); const m = new T.Mesh(geo, mat);
    m.position.set(...pos); m.rotation.set(...rot); sala.add(m); propios.push(geo, mat);
  };
  poner(new T.BoxGeometry(12, 7, 12), [0.32, 0.31, 0.3], [0, 3, 0], [0, 0, 0], T.BackSide);
  poner(new T.PlaneGeometry(6, 2), [3.2, 3.1, 2.9], [0, 6.4, 0], [Math.PI / 2, 0, 0]);
  poner(new T.PlaneGeometry(3, 4), [2.2, 2.3, 2.4], [-5.8, 3, 0], [0, Math.PI / 2, 0]);
  poner(new T.PlaneGeometry(4, 3), [1.6, 1.5, 1.4], [0, 3, 5.8], [0, Math.PI, 0]);
  const pmrem = new T.PMREMGenerator(renderer);
  let rt;
  try { rt = pmrem.fromScene(sala, 0.04); } finally { pmrem.dispose(); for (const r of propios) r.dispose(); }
  entornos.set(renderer, rt);
  return rt;
}

// ── Escena ──────────────────────────────────────────────────────────────────
/**
 * Monta la escena realista de un espacio. `escena`: la de montaje.mjs (escenaMontada), con las
 * pantallas montadas. `montado`: { zona, placement }. `acabado`: el de acabadoPorId. `movil`:
 * sin sombras. Devuelve un objeto con la misma interfaz que crearEscena3D (scene, pantallas,
 * paredes, muebles, ponerLienzo…) más `realista`, `arreglos` y `acabado`.
 */
export function crearEscenaRealista({ renderer, def, modelo, escena, montado, acabado, movil = false, anisotropia = 4, onCambio = () => {} }) {
  // Las pantallas del formato, con el motor de siempre (vídeo único, UV por recorte, cubo de 4 caras).
  const base = crearEscena3D({ ...escena, paredes: [], muebles: [], dispositivos: [] }, { anisotropia, onCambio, tema: 'estanco' });
  const { scene } = base;
  for (const o of [...scene.children]) if (o.isLight) scene.remove(o);
  base.root.traverse(o => { if (o.userData.parte === 'suelo' || o.isLineSegments) o.visible = false; });
  base.techo.visible = false; base.lampara.visible = false;
  const propios = new Set(), own = x => (propios.add(x), x);

  // El modelo, en su estado de partida: todo visible menos la pantalla sustituida y las otras del modelo.
  const { root, nodos } = modelo;
  for (const [nombre, n] of nodos) {
    n.position.copy(modelo.posicion.get(nombre));
    n.visible = !(nombre === def.muebles.sustituida || def.muebles.ocultos.includes(nombre));
  }
  scene.add(root);
  root.updateMatrixWorld(true);

  // Muebles que pisan la zona reservada: se apartan (sólo posición, en x/z), como en Studio.
  const zona = montado.zona.definition.mount.zone;
  const limite = new T.Box3(new T.Vector3(zona.min.x, zona.min.y, zona.min.z), new T.Vector3(zona.max.x, zona.max.y, zona.max.z));
  const arreglos = [];
  for (const [nombre, n] of nodos) {
    if (!coincide(nombre, def.muebles.movibles) || !n.visible) continue;
    if (!new T.Box3().setFromObject(n).intersectsBox(limite)) continue;
    const desde = n.position.toArray();
    const regla = Object.entries(def.muebles.aparcar).find(([p]) => coincide(nombre, [p]))?.[1] || {};
    if (Number.isFinite(regla.x)) n.position.x = regla.x;
    if (Number.isFinite(regla.z)) n.position.z = regla.z;
    root.updateMatrixWorld(true);
    // Si ni apartado cabe, fuera de la escena: nunca atraviesa las pantallas.
    if (new T.Box3().setFromObject(n).intersectsBox(limite)) n.visible = false;
    arreglos.push({ nodeName: nombre, from: desde, to: n.position.toArray(), oculto: !n.visible, reason: 'trial_mount_clearance' });
  }

  // Acabado del local: tinte de pared y de suelo (la marca y las pantallas no se tocan).
  for (const [clave, color] of [['pared', acabado.colorPared], ['suelo', acabado.colorSuelo]]) {
    for (const nombre of def.materiales[clave] || []) for (const m of modelo.materiales.get(nombre) || []) {
      const o = modelo.original.get(m);
      if (!o) continue;
      m.color.copy(clave === 'suelo' ? o.clone().multiply(new T.Color(color)) : new T.Color(color));
    }
  }

  // Soportes de la zona (referenceFixtures de Studio): pies y raíl, columna de banda alta o peana.
  const soportes = new T.Group(); soportes.name = 'realista:soportes'; scene.add(soportes);
  const metal = own(new T.MeshStandardMaterial({ color: '#20272b', roughness: 0.42, metalness: 0.6 }));
  const laton = own(new T.MeshStandardMaterial({ color: '#b08d57', roughness: 0.32, metalness: 0.85 }));
  const caja = (nombre, x, y, z, w, h, d, m = metal) => { const g = own(new T.BoxGeometry(w, h, d)); const o = new T.Mesh(g, m); o.name = nombre; o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; soportes.add(o); return o; };
  const pl = montado.placement, b = pl.bounds, c = pl.centre, tipo = montado.zona.definition.supports.type;
  const detras = c.z - 0.065;
  if (tipo === 'overhead_fascia_rail') {
    for (const x of [b.min.x - 0.07, b.max.x + 0.07]) caja('realista:poste-banda', x, def.sala.alto / 2, detras, 0.06, def.sala.alto, 0.06);
    caja('realista:viga-banda', c.x, def.sala.alto - 0.02, detras, b.max.x - b.min.x + 0.22, 0.04, 0.08, laton);
    caja('realista:riel-banda', c.x, c.y, detras + 0.015, b.max.x - b.min.x, 0.05, 0.03);
  } else if (pl.faceCount === 4) {
    caja('realista:peana-led', c.x, b.min.y / 2, c.z, (b.max.x - b.min.x) * 0.72, b.min.y, (b.max.z - b.min.z) * 0.72);
    const lado = pl.width / 4;
    caja('realista:tapa-led', c.x, pl.top + 0.0125, c.z, lado + 0.02, 0.025, lado + 0.02);
  } else {
    const ancho = b.max.x - b.min.x;
    const n = ancho < 1.5 ? 1 : Math.max(2, Math.ceil(ancho / 2.2) + 1);
    const xs = n === 1 ? [c.x] : Array.from({ length: n }, (_, i) => b.min.x + 0.12 + i * (ancho - 0.24) / (n - 1));
    for (const x of xs) {
      caja('realista:pie', x, (b.max.y - 0.05) / 2, detras, 0.06, b.max.y - 0.05, 0.05);
      caja('realista:base', x, 0.02, detras, 0.42, 0.04, 0.36);
    }
    if (ancho >= 0.5) caja('realista:raíl', c.x, c.y, detras - 0.01, Math.max(0.3, ancho - 0.1), 0.06, 0.04, laton);
  }

  // Cierres: las paredes de corte que el GLB omite y el techo (con el tinte del local). No hacen
  // sombra: la luz principal entra por el frente abierto como si no estuvieran.
  const cierres = new Map(), { ancho: salaAncho, fondo: salaFondo, alto: salaAlto } = def.sala;
  const matPared = modelo.materiales.get(def.materiales.pared[0])?.[0] || own(new T.MeshStandardMaterial({ color: acabado.colorPared, roughness: 0.9 }));
  for (const w of def.paredes.filter(x => x.cierre)) {
    const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], len = Math.hypot(dx, dy), n = [-dy / len, dx / len];
    const o = new T.Mesh(own(new T.BoxGeometry(len, salaAlto, 0.12)), matPared);
    o.position.set((w.a[0] + w.b[0]) / 2 - n[0] * 0.06, salaAlto / 2, (w.a[1] + w.b[1]) / 2 - n[1] * 0.06);
    o.rotation.y = Math.atan2(n[0], n[1]); o.receiveShadow = true; o.name = `realista:cierre-${w.id}`;
    scene.add(o); cierres.set(w.id, o);
  }
  if (def.techo) {
    const techo = new T.Mesh(own(new T.PlaneGeometry(salaAncho, salaFondo)), own(new T.MeshStandardMaterial({ color: def.techo.color || '#e8e3da', roughness: 0.95 })));
    techo.rotation.x = Math.PI / 2; techo.position.set(salaAncho / 2, salaAlto, salaFondo / 2); techo.name = 'realista:techo'; techo.receiveShadow = true;
    scene.add(techo);
  }

  // Exterior: acera alrededor del local, para que el suelo no acabe en el vacío.
  const acera = new T.Mesh(own(new T.PlaneGeometry(40, 40)), own(new T.MeshStandardMaterial({ color: '#57524c', roughness: 0.95 })));
  acera.rotation.x = -Math.PI / 2; acera.position.set(def.sala.ancho / 2, -0.004, def.sala.fondo / 2 + 6); acera.receiveShadow = true; acera.name = 'realista:acera';
  scene.add(acera);

  // Luz del local: cielo y suelo, una principal (con sombras salvo en móvil), relleno y las lámparas.
  const k = acabado.intensidad || 1, luz = new T.Color(acabado.colorLuz);
  scene.background = new T.Color('#121518');
  scene.fog = new T.Fog('#121518', 18, 46);
  scene.environment = entorno(renderer).texture;
  const cielo = new T.HemisphereLight(luz, '#3e3a35', 0.75 * k); scene.add(cielo);
  const sol = new T.DirectionalLight(luz, 1.5 * k);
  sol.position.set(-2.5, 7.5, 9); sol.target.position.set(def.sala.ancho / 2, 1, def.sala.fondo / 2); scene.add(sol, sol.target);
  if (!movil) {
    sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
    Object.assign(sol.shadow.camera, { left: -5, right: 5, top: 5, bottom: -4, near: 1, far: 25 });
    sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02; sol.shadow.camera.updateProjectionMatrix();
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  }
  const relleno = new T.DirectionalLight('#dfe7ef', 0.35 * k); relleno.position.set(8, 3, 6); scene.add(relleno);
  for (const [x, y, h] of def.luces || []) { const p = new T.PointLight(luz, 2.2 * k, 6, 1.6); p.position.set(x, h, y); scene.add(p); }

  // Paredes que el visor corta (todas las piezas de cada una) y muebles que puede ocultar si tapan.
  const paredes = new Map(def.paredes.map(w => {
    const piezas = w.cierre ? [cierres.get(w.id)].filter(Boolean) : [...nodos].filter(([nombre]) => coincide(nombre, w.nodos)).map(([, n]) => n);
    return [w.id, { get visible() { return piezas.every(p => p.visible); }, set visible(v) { for (const p of piezas) p.visible = v; } }];
  }));
  const muebles = new Map(def.muebles.tapan.map(nombre => [nombre, nodos.get(nombre)]).filter(([, n]) => n && n.visible));
  const fantasma = { visible: false };

  return {
    scene, root: base.root, pantallas: base.pantallas, dispositivos: base.dispositivos, paredes, muebles, techo: fantasma, lampara: fantasma,
    ponerMedio: base.ponerMedio, hayVideo: base.hayVideo, ponerLienzo: base.ponerLienzo, quitarLienzo: base.quitarLienzo, refrescarLienzo: base.refrescarLienzo, enLienzo: base.enLienzo,
    realista: true, arreglos, acabado, modelo: { id: def.modelo.id, llamadas: modelo.llamadas, mallas: modelo.mallas, fundidas: modelo.fundidas, ms: modelo.ms, sha: modelo.sha },
    sombras: () => { if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true; },
    dispose() {
      base.dispose();
      scene.remove(root);
      for (const o of [...scene.children]) if (o.isLight && o.shadow) o.shadow.dispose?.();
      for (const r of propios) r.dispose();
      propios.clear();
      scene.environment = null; scene.fog = null;
      // El modelo queda como estaba (posiciones de partida); su geometría y texturas siguen en caché.
      for (const [nombre, n] of nodos) { n.position.copy(modelo.posicion.get(nombre)); n.visible = true; }
    },
  };
}
